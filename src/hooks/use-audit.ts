import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditLog, AuditFilters, PaginatedResponse } from "@/types";

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>("/audit", {
        params: filters,
      });
      return data;
    },
  });
}

export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: ["audit", id],
    queryFn: async () => {
      const { data } = await api.get<AuditLog>(`/audit/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}
