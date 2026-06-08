import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui";
import { getClients, getClient, createClient } from "@/services/clients.service";
import type { Client, ClientFilters, PaginatedResponse } from "@/types";

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: () => getClients(filters),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => getClient(id!),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: Omit<Client, "id" | "createdAt" | "updatedAt" | "vehicles">) =>
      createClient(payload as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      addToast({ type: "success", title: "Cliente creado", message: "El cliente se ha registrado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}
