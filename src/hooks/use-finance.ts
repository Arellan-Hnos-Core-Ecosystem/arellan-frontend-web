import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui";
import {
  getTodayCashbox,
  openCashbox,
  closeCashbox,
  getExpenses,
  getPendingExpenses,
  updateExpenseStatus,
  createExpense,
} from "@/services/finance.service";
import type {
  CashboxSession,
  Expense,
  ExpenseStatus,
  PaginatedResponse,
  FinanceFilters,
} from "@/types";

export function useTodayCashbox() {
  return useQuery({
    queryKey: ["finance", "cashbox", "today"],
    queryFn: getTodayCashbox,
    refetchInterval: 15000,
  });
}

export function useOpenCashbox() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: { initialAmount: number }) => openCashbox(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "cashbox"] });
      addToast({ type: "success", title: "Caja abierta", message: "La caja se ha abierto exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useCloseCashbox() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: { finalAmount: number }) => closeCashbox(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "cashbox"] });
      addToast({ type: "success", title: "Caja cerrada", message: "La caja se ha cerrado exitosamente" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useExpenses(filters: FinanceFilters = {}) {
  return useQuery({
    queryKey: ["finance", "expenses", filters],
    queryFn: () => getExpenses(filters),
  });
}

export function usePendingExpenses() {
  return useQuery({
    queryKey: ["finance", "expenses", "pending"],
    queryFn: getPendingExpenses,
    refetchInterval: 15000,
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectedReason,
    }: {
      id: string;
      status: Extract<ExpenseStatus, "APPROVED" | "REJECTED">;
      rejectedReason?: string;
    }) => updateExpenseStatus(id, status, rejectedReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({
        type: "success",
        title: variables.status === "APPROVED" ? "Gasto aprobado" : "Gasto rechazado",
        message: variables.status === "APPROVED" ? "El gasto ha sido aprobado" : "El gasto ha sido rechazado",
      });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: { description: string; amount: number; category: string; orderId?: string }) =>
      createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
      addToast({ type: "success", title: "Gasto registrado", message: "El gasto se ha registrado y esta pendiente de aprobacion" });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Error", message: error.message });
    },
  });
}
