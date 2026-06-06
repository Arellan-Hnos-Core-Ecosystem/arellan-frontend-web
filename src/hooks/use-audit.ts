import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditLog, AuditFilters, PaginatedResponse } from "@/types";

function mapAuditFilters(filters: AuditFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (filters.userId) params.userId = filters.userId;
  if (filters.action) params.action = filters.action;
  if (filters.entity) params.entity = filters.entity;
  if (filters.startDate) params.from = filters.startDate;
  if (filters.endDate) params.to = filters.endDate;
  return params;
}

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>("/audit", {
        params: mapAuditFilters(filters),
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
