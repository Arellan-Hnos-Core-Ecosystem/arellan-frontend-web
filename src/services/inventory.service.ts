import { api } from "@/lib/api"
import type {
  Part,
  InventoryMovement,
  InventoryFilters,
  PaginatedResponse,
  MovementType,
} from "@/types"

/** Result shape from GET /inventory/valuation */
export interface InventoryValuation {
  totalCost: number
  totalRetail: number
  itemCount: number
  categoryBreakdown: Record<string, { cost: number; retail: number; count: number }>
}

/**
 * Fetch paginated inventory items.
 * GET /inventory
 */
export async function getItems(
  filters: InventoryFilters = {},
): Promise<PaginatedResponse<Part>> {
  const { data } = await api.get<PaginatedResponse<Part>>("/inventory", {
    params: filters,
  })
  return data
}

/**
 * Fetch a single inventory item by ID.
 * GET /inventory/:id
 */
export async function getItem(id: string): Promise<Part> {
  const { data } = await api.get<Part>(`/inventory/${id}`)
  return data
}

/**
 * Create a new inventory item (part).
 * POST /inventory
 */
export async function createItem(
  payload: Record<string, unknown>,
): Promise<Part> {
  const { data } = await api.post<Part>("/inventory", payload)
  return data
}

/**
 * Update an existing inventory item.
 * PATCH /inventory/:id
 */
export async function updateItem(
  id: string,
  payload: Record<string, unknown>,
): Promise<Part> {
  const { data } = await api.patch<Part>(`/inventory/${id}`, payload)
  return data
}

/**
 * Register a stock movement (in / out).
 * POST /inventory/movements
 */
export async function addMovement(payload: {
  partId: string
  type: MovementType
  quantity: number
  reason: string
  orderId?: string
}): Promise<InventoryMovement> {
  const { data } = await api.post<InventoryMovement>(
    "/inventory/movements",
    payload,
  )
  return data
}

/**
 * Fetch items that are below their minimum stock threshold.
 * GET /inventory/low-stock
 */
export async function getLowStock(): Promise<Part[]> {
  const { data } = await api.get<Part[]>("/inventory/low-stock")
  return data
}

/**
 * Get aggregated inventory valuation data.
 * GET /inventory/valuation
 */
export async function getValuation(): Promise<InventoryValuation> {
  const { data } = await api.get<InventoryValuation>(
    "/inventory/valuation",
  )
  return data
}

/**
 * Fetch movement history for items, optionally filtered.
 * GET /inventory/movements
 */
export async function getMovements(
  itemId?: string,
  filters: { page?: number; pageSize?: number; type?: MovementType } = {},
): Promise<PaginatedResponse<InventoryMovement>> {
  const { data } = await api.get<PaginatedResponse<InventoryMovement>>(
    "/inventory/movements",
    { params: { partId: itemId, ...filters } },
  )
  return data
}
