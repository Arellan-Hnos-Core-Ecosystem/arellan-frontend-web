import { apiClient } from "./api-client"
import type { Client, ClientFilters, PaginatedResponse, Vehicle } from "@/types"

/**
 * Fetch paginated list of clients with optional search / filters.
 * GET /clients
 */
export async function getClients(
  filters: ClientFilters = {},
): Promise<PaginatedResponse<Client>> {
  const { data } = await apiClient.get<PaginatedResponse<Client>>("/clients", {
    params: filters,
  })
  return data
}

/**
 * Fetch a single client by ID (includes nested vehicles).
 * GET /clients/:id
 */
export async function getClient(id: string): Promise<Client> {
  const { data } = await apiClient.get<Client>(`/clients/${id}`)
  return data
}

/**
 * Register a new client.
 * POST /clients
 */
export async function createClient(
  payload: Record<string, unknown>,
): Promise<Client> {
  const { data } = await apiClient.post<Client>("/clients", payload)
  return data
}

/**
 * Update an existing client's data.
 * PATCH /clients/:id
 */
export async function updateClient(
  id: string,
  payload: Record<string, unknown>,
): Promise<Client> {
  const { data } = await apiClient.patch<Client>(`/clients/${id}`, payload)
  return data
}

/**
 * Fetch all vehicles belonging to a client.
 * GET /clients/:id/vehicles
 */
export async function getClientVehicles(clientId: string): Promise<Vehicle[]> {
  const { data } = await apiClient.get<Vehicle[]>(
    `/clients/${clientId}/vehicles`,
  )
  return data
}
