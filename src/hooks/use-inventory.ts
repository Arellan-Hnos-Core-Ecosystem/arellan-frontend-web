import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui";
import { useRealtime } from "./useRealtime";
import {
  getItems,
  getCriticalItems,
  getItem,
  addMovement,
  createItem,
} from "@/services/inventory.service";
import type {
  Part,
  InventoryMovement,
  InventoryFilters,
  PaginatedResponse,
  MovementType,
} from "@/types";

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: () => getItems(filters),
  });
}

export function useCriticalStock() {
  return useQuery({
    queryKey: ["inventory", "critical"],
    queryFn: getCriticalItems,
    refetchInterval: 60000,
  });
}

export function usePart(id: string | undefined) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
  });
}

export function useAddMovement() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: { partId: string; type: MovementType; quantity: number; reason: string; orderId?: string }) =>
      addMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({ type: "success", title: "Movimiento registrado", message: "El movimiento de inventario se ha registrado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useInventoryRealtime() {
  const queryClient = useQueryClient();
  useRealtime({
    "inventory:low_stock": () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: Omit<Part, "id" | "createdAt" | "updatedAt">) => {
      // Mapeo inverso mandatorio DENTRO del mutationFn: el CreateItemDto del
      // backend (whitelist estricta) exige sku/category/stock/minStock/unitPrice;
      // las claves esteticas de la UI (code/currentStock/salePrice) rebotan 400.
      // Atrapado aqui, cualquier reintento post-refresh de token re-emite el
      // payload ya mapeado.
      const backendPayload = {
        sku: data.code,
        name: data.name,
        category: data.category ?? "",
        stock: Number(data.currentStock ?? 0),
        minStock: Number(data.minStock ?? 1),
        unitPrice: Number(data.salePrice ?? 0),
      };
      return createItem(backendPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      addToast({ type: "success", title: "Repuesto creado", message: "El repuesto se ha creado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}
