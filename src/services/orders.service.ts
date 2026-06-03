import { apiClient } from "./api-client"
import type {
  Order,
  OrderFilters,
  OrderStatus,
  OrderPart,
  OrderTimelineEntry,
  PaginatedResponse,
} from "@/types"

/** Statistics returned by GET /orders/stats/summary */
export interface OrderStats {
  totalOrders: number
  activeOrders: number
  completedToday: number
  cancelledToday: number
  statusDistribution: Record<OrderStatus, number>
}

/**
 * Fetch paginated list of orders with optional filters.
 * GET /orders
 */
export async function getOrders(
  filters: OrderFilters = {},
): Promise<PaginatedResponse<Order>> {
  const { data } = await apiClient.get<PaginatedResponse<Order>>("/orders", {
    params: filters,
  })
  return data
}

/**
 * Fetch a single order by ID.
 * GET /orders/:id
 */
export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`)
  return data
}

/**
 * Create a new work order.
 * POST /orders
 */
export async function createOrder(
  payload: Record<string, unknown>,
): Promise<Order> {
  const { data } = await apiClient.post<Order>("/orders", payload)
  return data
}

/**
 * Update the status of an order with an optional comment.
 * PATCH /orders/:id/status
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  comment?: string,
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, {
    status,
    comment,
  })
  return data
}

/**
 * Cancel an order with a reason.
 * POST /orders/:id/cancel
 */
export async function cancelOrder(
  id: string,
  reason: string,
): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${id}/cancel`, {
    reason,
  })
  return data
}

/**
 * Add an item (part) to an existing order.
 * POST /orders/:id/items
 */
export async function addOrderItem(
  orderId: string,
  payload: { partId: string; quantity: number; unitPrice: number },
): Promise<OrderPart> {
  const { data } = await apiClient.post<OrderPart>(
    `/orders/${orderId}/items`,
    payload,
  )
  return data
}

/**
 * Get the status timeline for an order.
 * GET /orders/:id/timeline
 */
export async function getOrderTimeline(
  orderId: string,
): Promise<OrderTimelineEntry[]> {
  const { data } = await apiClient.get<OrderTimelineEntry[]>(
    `/orders/${orderId}/timeline`,
  )
  return data
}

/**
 * Get aggregated dashboard / summary statistics for orders.
 * GET /orders/stats/summary
 */
export async function getDashboardStats(): Promise<OrderStats> {
  const { data } = await apiClient.get<OrderStats>("/orders/stats/summary")
  return data
}

/**
 * Assign a mechanic to an order.
 * POST /orders/:id/assign
 */
export async function assignMechanic(
  orderId: string,
  mechanicId: string,
): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${orderId}/assign`, {
    mechanicId,
  })
  return data
}
