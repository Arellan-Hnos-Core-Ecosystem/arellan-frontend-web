import { api } from "@/lib/api"
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
  const { data } = await api.get<PaginatedResponse<Order>>("/orders", {
    params: filters,
  })
  return data
}

/**
 * Fetch a single order by ID.
 * GET /orders/:id
 */
export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

/**
 * Create a new work order.
 * POST /orders
 */
export async function createOrder(
  payload: Record<string, unknown>,
): Promise<Order> {
  const { data } = await api.post<Order>("/orders", payload)
  return data
}

/**
 * Update the status of an order with an optional comment.
 * PATCH /orders/:id/status
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  _comment?: string,
): Promise<Order> {
  // FUN-14: el backend expone POST /orders/:id/status y su DTO sólo admite
  // `status`; el ValidationPipe global (forbidNonWhitelisted) rechazaba
  // `comment` con 400. No hay endpoint para adjuntar comentario al cambio.
  const { data } = await api.post<Order>(`/orders/${id}/status`, { status })
  return data
}

/**
 * Cancel an order with a reason.
 * POST /orders/:id/cancel
 */
export async function cancelOrder(
  id: string,
  _reason?: string,
): Promise<Order> {
  // FUN-14: la cancelación es DELETE /orders/:id (soft delete → CANCELLED).
  // No existía POST /orders/:id/cancel (devolvía 404).
  const { data } = await api.delete<Order>(`/orders/${id}`)
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
  // FUN-14: el backend expone POST /orders/:id/parts con
  // { items: [{ itemId, quantity }] } (no existía /orders/:id/items). El precio
  // unitario lo fija el backend desde el inventario, por lo que no se envía.
  const { data } = await api.post<OrderPart>(
    `/orders/${orderId}/parts`,
    { items: [{ itemId: payload.partId, quantity: payload.quantity }] },
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
  // FUN-14: no existe GET /orders/:id/timeline. El historial vive en el detalle
  // (statusHistory) de GET /orders/:id; se deriva aquí.
  const { data } = await api.get<{
    statusHistory?: Array<{ id: string; status: OrderStatus; changedBy?: string; timestamp?: string }>
  }>(`/orders/${orderId}`)
  const history = Array.isArray(data?.statusHistory) ? data.statusHistory : []
  return history.map((h) => ({
    id: h.id,
    orderId,
    status: h.status,
    comment: null,
    changedById: h.changedBy ?? "",
    createdAt: h.timestamp ?? new Date().toISOString(),
  }))
}

/**
 * Get aggregated dashboard / summary statistics for orders.
 * GET /orders/stats/summary
 */
export async function getDashboardStats(): Promise<OrderStats> {
  const { data } = await api.get<OrderStats>("/orders/stats/summary")
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
  const { data } = await api.post<Order>(`/orders/${orderId}/assign`, {
    mechanicId,
  })
  return data
}
