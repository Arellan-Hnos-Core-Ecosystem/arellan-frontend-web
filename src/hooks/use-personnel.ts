import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui";
import {
  getPersonnel,
  getPersonnelMember,
  createPersonnel,
  updatePersonnelStatus,
} from "@/services/personnel.service";
import type { Account, AccountStatus, PersonnelFilters, PaginatedResponse } from "@/types";

export function usePersonnel(filters: PersonnelFilters = {}) {
  return useQuery({
    queryKey: ["personnel", filters],
    queryFn: () => getPersonnel(filters),
  });
}

export function usePersonnelMember(id: string | undefined) {
  return useQuery({
    queryKey: ["personnel", id],
    queryFn: () => getPersonnelMember(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePersonnel() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: Omit<Account, "id" | "createdAt" | "updatedAt"> & { password: string }) =>
      createPersonnel(payload as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      addToast({ type: "success", title: "Personal creado", message: "El miembro del personal se ha registrado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useUpdatePersonnelStatus() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) =>
      updatePersonnelStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      addToast({ type: "success", title: "Estado actualizado", message: "El estado del personal se ha actualizado" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}
