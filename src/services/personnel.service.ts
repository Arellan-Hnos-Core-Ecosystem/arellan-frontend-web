import { api } from "@/lib/api"
import type { Account, PersonnelFilters, PaginatedResponse } from "@/types"

/** Attendance record */
export interface AttendanceRecord {
  id: string
  personnelId: string
  personnel: Account
  checkIn: string
  checkOut: string | null
  date: string
}

/** Performance metrics for a personnel member */
export interface PersonnelPerformance {
  ordersCompleted: number
  averageCompletionTime: number
  customerRating: number
  revenueGenerated: number
  periodStart: string
  periodEnd: string
}

/** Vehicle usage authorization */
export interface VehicleUsage {
  id: string
  personnelId: string
  personnel: Account
  vehicleId: string
  plate: string
  reason: string
  authorizedById: string
  authorizedBy: Account
  startDate: string
  endDate: string | null
  active: boolean
  createdAt: string
}

/**
 * Fetch paginated list of personnel (workshop accounts).
 * GET /personnel
 */
export async function getPersonnel(
  filters: PersonnelFilters = {},
): Promise<PaginatedResponse<Account>> {
  const { data } = await api.get<PaginatedResponse<Account>>(
    "/personnel",
    { params: filters },
  )
  return data
}

/**
 * Fetch a single personnel member by ID.
 * GET /personnel/:id
 */
export async function getPersonnelMember(id: string): Promise<Account> {
  const { data } = await api.get<Account>(`/personnel/${id}`)
  return data
}

/**
 * Create a new personnel account.
 * POST /personnel
 */
export async function createPersonnel(
  payload: Record<string, unknown>,
): Promise<Account> {
  const { data } = await api.post<Account>("/personnel", payload)
  return data
}

/**
 * Update a personnel member's data.
 * PATCH /personnel/:id
 */
export async function updatePersonnel(
  id: string,
  payload: Record<string, unknown>,
): Promise<Account> {
  const { data } = await api.patch<Account>(
    `/personnel/${id}`,
    payload,
  )
  return data
}

/**
 * Register check-in for a personnel member.
 * POST /personnel/:id/attendance/check-in
 */
export async function checkIn(
  personnelId: string,
): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>(
    `/personnel/${personnelId}/attendance/check-in`,
  )
  return data
}

/**
 * Register check-out for a personnel member.
 * POST /personnel/:id/attendance/check-out
 */
export async function checkOut(
  personnelId: string,
): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>(
    `/personnel/${personnelId}/attendance/check-out`,
  )
  return data
}

/**
 * Get today's attendance records for all personnel.
 * GET /personnel/attendance/today
 */
export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>(
    "/personnel/attendance/today",
  )
  return data
}

/**
 * Get performance metrics for a personnel member.
 * GET /personnel/:id/performance
 */
export async function getPerformance(
  personnelId: string,
): Promise<PersonnelPerformance> {
  const { data } = await api.get<PersonnelPerformance>(
    `/personnel/${personnelId}/performance`,
  )
  return data
}

/**
 * Authorize workshop vehicle usage for a personnel member.
 * POST /personnel/vehicle-usage/authorize
 */
export async function authorizeVehicleUsage(payload: {
  personnelId: string
  vehicleId: string
  reason: string
}): Promise<VehicleUsage> {
  const { data } = await api.post<VehicleUsage>(
    "/personnel/vehicle-usage/authorize",
    payload,
  )
  return data
}

/**
 * Get all currently active vehicle usages.
 * GET /personnel/vehicle-usage/active
 */
export async function getActiveVehicleUsages(): Promise<VehicleUsage[]> {
  const { data } = await api.get<VehicleUsage[]>(
    "/personnel/vehicle-usage/active",
  )
  return data
}

/**
 * Update a personnel member's account status.
 * PATCH /personnel/:id/status
 */
export async function updatePersonnelStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE" | "TERMINATED",
): Promise<Account> {
  const { data } = await api.patch<Account>(`/personnel/${id}/status`, { status })
  return data
}
