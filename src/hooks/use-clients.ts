import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import type { Client, ClientFilters, PaginatedResponse } from "@/types";

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters.search) params.search = filters.search;
      if (filters.page != null) params.page = Number(filters.page);
      if (filters.pageSize != null) params.pageSize = Number(filters.pageSize);
      const { data } = await api.get<PaginatedResponse<Client>>("/clients", { params });
      return data;
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (
      payload: Omit<Client, "id" | "createdAt" | "updatedAt" | "vehicles">
    ) => {
      const { data } = await api.post<Client>("/clients", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      addToast({
        type: "success",
        title: "Cliente creado",
        message: "El cliente se ha registrado exitosamente",
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
