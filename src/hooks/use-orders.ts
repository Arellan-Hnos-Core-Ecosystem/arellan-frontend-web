import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
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
import { getDashboardSummary } from "@/services/dashboard.service";
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
    queryFn: () => getOrders(filters),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    refetchInterval: 30000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: Omit<Order, "id" | "createdAt" | "updatedAt" | "completedAt">) =>
      createOrderService(payload as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      addToast({ type: "success", title: "Orden creada", message: "La orden de trabajo se ha creado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: OrderStatus; comment?: string }) =>
      updateOrderStatusService(id, status, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({ type: "success", title: "Estado actualizado", message: `Orden actualizada a ${variables.status}` });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelOrderService(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({ type: "success", title: "Orden cancelada", message: "La orden de trabajo ha sido cancelada" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useOrderTimeline(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", orderId, "timeline"],
    queryFn: () => getOrderTimelineService(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useAddOrderItem() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, partId, quantity, unitPrice }: { orderId: string; partId: string; quantity: number; unitPrice: number }) =>
      addOrderItemService(orderId, { partId, quantity, unitPrice }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      addToast({ type: "success", title: "Repuesto agregado", message: "El repuesto se ha agregado a la orden" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, laborCost, partsCost, validDays }: {
      orderId: string;
      laborCost: number;
      partsCost: number;
      validDays?: number;
    }) =>
      api.post(`/orders/${orderId}/quote`, { laborCost, partsCost, validDays }),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      addToast({ type: "success", title: "Cotización enviada", message: "La cotización fue enviada al cliente exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error al enviar cotización", message: error.message });
    },
  });
}

export function useAssignMechanic() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, mechanicId }: { orderId: string; mechanicId: string }) =>
      assignMechanicService(orderId, mechanicId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      addToast({ type: "success", title: "Mecánico asignado", message: "El mecánico se ha asignado a la orden" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: getDashboardStatsService,
    refetchInterval: 30000,
  });
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useOrdersSocket() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on("order:status_changed", (data: { orderId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", data.orderId] });
      }
    });

    socket.on("order:updated", (data: { orderId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", data.orderId] });
      }
    });

    socket.on("order:created", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [accessToken, queryClient]);
}
