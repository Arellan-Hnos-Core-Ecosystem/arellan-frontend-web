import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
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
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Part>>("/inventory", {
        params: filters,
      });
      return data;
    },
  });
}

export function useCriticalStock() {
  return useQuery({
    queryKey: ["inventory", "critical"],
    queryFn: async () => {
      const { data } = await api.get<Part[]>("/inventory/critical");
      return data;
    },
    refetchInterval: 60000,
  });
}

export function usePart(id: string | undefined) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      const { data } = await api.get<Part>(`/inventory/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAddMovement() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (payload: {
      partId: string;
      type: MovementType;
      quantity: number;
      reason: string;
      orderId?: string;
    }) => {
      const { data } = await api.post<InventoryMovement>(
        "/inventory/movements",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({
        type: "success",
        title: "Movimiento registrado",
        message: "El movimiento de inventario se ha registrado exitosamente",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message,
      });
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (
      payload: Omit<Part, "id" | "createdAt" | "updatedAt">
    ) => {
      const { data } = await api.post<Part>("/inventory", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      addToast({
        type: "success",
        title: "Repuesto creado",
        message: "El repuesto se ha creado exitosamente",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message,
      });
    },
  });
}
