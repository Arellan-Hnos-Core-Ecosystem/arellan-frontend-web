import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
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
    queryFn: async () => {
      const { data } = await api.get<CashboxSession | null>(
        "/finance/cashbox/today"
      );
      return data;
    },
    refetchInterval: 15000,
  });
}

export function useOpenCashbox() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (payload: { initialAmount: number }) => {
      const { data } = await api.post<CashboxSession>(
        "/finance/cashbox/open",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "cashbox"] });
      addToast({
        type: "success",
        title: "Caja abierta",
        message: "La caja se ha abierto exitosamente",
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

export function useCloseCashbox() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (payload: { finalAmount: number }) => {
      const { data } = await api.post<CashboxSession>(
        "/finance/cashbox/close",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "cashbox"] });
      addToast({
        type: "success",
        title: "Caja cerrada",
        message: "La caja se ha cerrado exitosamente",
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

export function useExpenses(filters: FinanceFilters = {}) {
  return useQuery({
    queryKey: ["finance", "expenses", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page != null) params.page = Number(filters.page);
      if (filters.pageSize != null) params.size = Number(filters.pageSize);
      const { data } = await api.get<PaginatedResponse<Expense>>(
        "/finance/expenses",
        { params }
      );
      return data;
    },
  });
}

export function usePendingExpenses() {
  return useQuery({
    queryKey: ["finance", "expenses", "pending"],
    queryFn: async () => {
      const { data } = await api.get<Expense[]>("/finance/expenses/pending");
      return data;
    },
    refetchInterval: 15000,
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectedReason,
    }: {
      id: string;
      status: Extract<ExpenseStatus, "APPROVED" | "REJECTED">;
      rejectedReason?: string;
    }) => {
      const { data } = await api.patch<Expense>(
        `/finance/expenses/${id}/status`,
        {
          status,
          rejectedReason,
        }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      addToast({
        type: "success",
        title:
          variables.status === "APPROVED" ? "Gasto aprobado" : "Gasto rechazado",
        message:
          variables.status === "APPROVED"
            ? "El gasto ha sido aprobado"
            : "El gasto ha sido rechazado",
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

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (payload: {
      description: string;
      amount: number;
      category: string;
      orderId?: string;
    }) => {
      const { data } = await api.post<Expense>("/finance/expenses", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
      addToast({
        type: "success",
        title: "Gasto registrado",
        message: "El gasto se ha registrado y esta pendiente de aprobacion",
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
