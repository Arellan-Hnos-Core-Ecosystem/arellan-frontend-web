import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import {
  getOrders,
  getOrder,
  createOrder as createOrderService,
  updateOrderStatus as updateOrderStatusService,
  cancelOrder as cancelOrderService,
  addOrderItem as addOrderItemService,
  getOrderTimeline as getOrderTimelineService,
  getDashboardStats as getDashboardStatsService,
  assignMechanic as assignMechanicService,
  type OrderStats,
} from "@/services/orders.service";
import type {
  Order,
  OrderFilters,
  OrderStatus,
  OrderPart,
  OrderTimelineEntry,
  PaginatedResponse,
  DashboardStats,
} from "@/types";

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.from = filters.startDate;
      if (filters.endDate) params.to = filters.endDate;
      if (filters.page != null) params.page = Number(filters.page);
      if (filters.pageSize != null) params.pageSize = Number(filters.pageSize);
      const { data } = await api.get<PaginatedResponse<Order>>("/orders", { params });
      return data;
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/summary");
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (
      payload: Omit<Order, "id" | "createdAt" | "updatedAt" | "completedAt">
    ) => {
      const { data } = await api.post<Order>("/orders", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      addToast({
        type: "success",
        title: "Orden creada",
        message: "La orden de trabajo se ha creado exitosamente",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message,
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      id,
      status,
      comment,
    }: {
      id: string;
      status: OrderStatus;
      comment?: string;
    }) => {
      const { data } = await api.patch<Order>(`/orders/${id}/status`, {
        status,
        comment,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({
        type: "success",
        title: "Estado actualizado",
        message: `Orden actualizada a ${variables.status}`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message,
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => {
      const { data } = await api.post<Order>(`/orders/${id}/cancel`, {
        reason,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({
        type: "success",
        title: "Orden cancelada",
        message: "La orden de trabajo ha sido cancelada",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message,
      });
    },
  });
}

// ── NEW hooks (using services layer) ────────────────────────────────────────

/**
 * Fetch the full status timeline for a specific order.
 */
export function useOrderTimeline(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", orderId, "timeline"],
    queryFn: () => getOrderTimelineService(orderId!),
    enabled: Boolean(orderId),
  });
}

/**
 * Add a part/item to an existing order.
 */
export function useAddOrderItem() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      orderId,
      partId,
      quantity,
      unitPrice,
    }: {
      orderId: string
      partId: string
      quantity: number
      unitPrice: number
    }) => {
      return addOrderItemService(orderId, { partId, quantity, unitPrice })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      addToast({
        type: "success",
        title: "Repuesto agregado",
        message: "El repuesto se ha agregado a la orden",
      })
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message })
    },
  })
}

/**
 * Assign a mechanic to an order.
 */
export function useAssignMechanic() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      orderId,
      mechanicId,
    }: {
      orderId: string
      mechanicId: string
    }) => {
      return assignMechanicService(orderId, mechanicId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      addToast({
        type: "success",
        title: "Mecánico asignado",
        message: "El mecánico se ha asignado a la orden",
      })
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message })
    },
  })
}

/**
 * Fetch order summary statistics (from /orders/stats/summary).
 */
export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: getDashboardStatsService,
    refetchInterval: 30000,
  })
}
