import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import type { Account, PersonnelFilters, PaginatedResponse } from "@/types";

export function usePersonnel(filters: PersonnelFilters = {}) {
  return useQuery({
    queryKey: ["personnel", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.page != null) params.page = Number(filters.page);
      if (filters.pageSize != null) params.pageSize = Number(filters.pageSize);
      const { data } = await api.get<PaginatedResponse<Account>>("/personnel", { params });
      return data;
    },
  });
}

export function usePersonnelMember(id: string | undefined) {
  return useQuery({
    queryKey: ["personnel", id],
    queryFn: async () => {
      const { data } = await api.get<Account>(`/personnel/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePersonnel() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (
      payload: Omit<Account, "id" | "createdAt" | "updatedAt"> & {
        password: string;
      }
    ) => {
      const { data } = await api.post<Account>("/personnel", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      addToast({
        type: "success",
        title: "Personal creado",
        message: "El miembro del personal se ha registrado exitosamente",
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

export function useUpdatePersonnelStatus() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    }) => {
      const { data } = await api.patch<Account>(`/personnel/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      addToast({
        type: "success",
        title: "Estado actualizado",
        message: "El estado del personal se ha actualizado",
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
