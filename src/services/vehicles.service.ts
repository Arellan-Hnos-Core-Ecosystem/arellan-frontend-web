import { api } from "@/lib/api"
import type { Vehicle, PaginatedResponse, Order } from "@/types"

/** Basic filters for vehicle listing */
export interface VehicleFilters {
  search?: string
  plate?: string
  brand?: string
  clientId?: string
  page?: number
  pageSize?: number
}

/**
 * Fetch paginated list of vehicles.
 * GET /vehicles
 */
export async function getVehicles(
  filters: VehicleFilters = {},
): Promise<PaginatedResponse<Vehicle>> {
  const { data } = await api.get<PaginatedResponse<Vehicle>>(
    "/vehicles",
    { params: filters },
  )
  return data
}

/**
 * Fetch a single vehicle by ID.
 * GET /vehicles/:id
 */
export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await api.get<Vehicle>(`/vehicles/${id}`)
  return data
}

/**
 * Register a new vehicle.
 * POST /vehicles
 */
export async function createVehicle(
  payload: Record<string, unknown>,
): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>("/vehicles", payload)
  return data
}

/**
 * Get the order history for a specific vehicle.
 * GET /vehicles/:id/history
 */
export async function getVehicleHistory(id: string): Promise<Order[]> {
  const { data } = await api.get<Order[]>(`/vehicles/${id}/history`)
  return data
}

/**
 * Fetch the workshop fleet (vehicles owned by the shop itself).
 * GET /vehicles/workshop-fleet
 */
export async function getWorkshopFleet(): Promise<Vehicle[]> {
  const { data } = await api.get<Vehicle[]>("/vehicles/workshop-fleet")
  return data
}
