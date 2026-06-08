import { useQuery } from "@tanstack/react-query";
import { getAuditLogs, getAuditLog } from "@/services/audit.service";
import type { AuditLog, AuditFilters, PaginatedResponse } from "@/types";

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: () => getAuditLogs(filters),
  });
}

export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: ["audit", id],
    queryFn: () => getAuditLog(id!),
    enabled: Boolean(id),
  });
}
