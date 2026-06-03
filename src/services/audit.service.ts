import { apiClient } from "./api-client"
import type { AuditLog, AuditFilters, PaginatedResponse } from "@/types"

/**
 * Fetch paginated audit trail entries with optional filters.
 * GET /audit
 */
export async function getAuditLogs(
  filters: AuditFilters = {},
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLog>>("/audit", {
    params: filters,
  })
  return data
}

/**
 * Fetch a single audit log entry by ID.
 * GET /audit/:id
 */
export async function getAuditLog(id: string): Promise<AuditLog> {
  const { data } = await apiClient.get<AuditLog>(`/audit/${id}`)
  return data
}

/**
 * Get all activity logs for a specific user.
 * GET /audit/user/:userId/activity
 */
export async function getUserActivity(userId: string): Promise<AuditLog[]> {
  const { data } = await apiClient.get<AuditLog[]>(
    `/audit/user/${userId}/activity`,
  )
  return data
}
