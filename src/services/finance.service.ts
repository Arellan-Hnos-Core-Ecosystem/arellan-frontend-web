import { api } from "@/lib/api"
import type {
  CashboxSession,
  CashboxTransaction,
  Expense,
  FinanceFilters,
  PaginatedResponse,
  MovementType,
} from "@/types"

/** KPIs returned by GET /finance/dashboard */
export interface FinanceDashboard {
  todayRevenue: number
  todayExpenses: number
  pendingExpensesCount: number
  monthlyRevenue: number
  monthlyExpenses: number
  cashboxOpen: boolean
  currentBalance: number | null
}

/** Cashflow entry */
export interface CashflowEntry {
  date: string
  income: number
  expenses: number
  balance: number
}

/** Daily report request payload */
export interface DailyReportPayload {
  date: string
}

/** Daily report response */
export interface DailyReport {
  date: string
  openingBalance: number
  closingBalance: number
  totalIncome: number
  totalExpenses: number
  transactions: CashboxTransaction[]
}

/** Commission record */
export interface Commission {
  userId: string
  userName: string
  orderCount: number
  totalAmount: number
  commission: number
}

/**
 * Get today's cashbox session (open or last closed).
 * GET /finance/cashbox/today
 */
export async function getTodayCashbox(): Promise<CashboxSession | null> {
  const { data } = await api.get<CashboxSession | null>(
    "/finance/cashbox/today",
  )
  return data
}

/**
 * Open a new cashbox session for today.
 * POST /finance/cashbox/open
 */
export async function openCashbox(payload: {
  initialAmount: number
}): Promise<CashboxSession> {
  const { data } = await api.post<CashboxSession>(
    "/finance/cashbox/open",
    payload,
  )
  return data
}

/**
 * Close today's cashbox session.
 * POST /finance/cashbox/close
 */
export async function closeCashbox(payload: {
  finalAmount: number
}): Promise<CashboxSession> {
  const { data } = await api.post<CashboxSession>(
    "/finance/cashbox/close",
    payload,
  )
  return data
}

/**
 * Add a cash transaction (income or expense) to the active session.
 * POST /finance/cashbox/transaction
 */
export async function addTransaction(payload: {
  description: string
  amount: number
  type: MovementType
  orderId?: string
}): Promise<CashboxTransaction> {
  const { data } = await api.post<CashboxTransaction>(
    "/finance/cashbox/transaction",
    payload,
  )
  return data
}

/**
 * Fetch paginated expenses with optional date filters.
 * GET /finance/expenses
 */
export async function getExpenses(
  filters: FinanceFilters = {},
): Promise<PaginatedResponse<Expense>> {
  const { data } = await api.get<PaginatedResponse<Expense>>(
    "/finance/expenses",
    { params: filters },
  )
  return data
}

/**
 * Register a new expense (pending approval).
 * POST /finance/expenses
 */
export async function createExpense(payload: {
  description: string
  amount: number
  category: string
  orderId?: string
}): Promise<Expense> {
  const { data } = await api.post<Expense>("/finance/expenses", payload)
  return data
}

/**
 * Approve an expense.
 * POST /finance/expenses/:id/approve
 */
export async function approveExpense(id: string): Promise<Expense> {
  const { data } = await api.post<Expense>(
    `/finance/expenses/${id}/approve`,
  )
  return data
}

/**
 * Get finance KPI dashboard data.
 * GET /finance/dashboard
 */
export async function getDashboard(): Promise<FinanceDashboard> {
  const { data } = await api.get<FinanceDashboard>("/finance/dashboard")
  return data
}

/**
 * Get cashflow data for a date range.
 * GET /finance/cashflow
 */
export async function getCashflow(
  params: { startDate?: string; endDate?: string } = {},
): Promise<CashflowEntry[]> {
  const { data } = await api.get<CashflowEntry[]>("/finance/cashflow", {
    params,
  })
  return data
}

/**
 * Generate a daily financial report for a specific date.
 * POST /finance/reports/daily
 */
export async function getDailyReport(
  payload: DailyReportPayload,
): Promise<DailyReport> {
  const { data } = await api.post<DailyReport>(
    "/finance/reports/daily",
    payload,
  )
  return data
}

/**
 * Get mechanic commissions data.
 * GET /finance/commissions
 */
export async function getCommissions(): Promise<Commission[]> {
  const { data } = await api.get<Commission[]>("/finance/commissions")
  return data
}

/**
 * Fetch expenses pending approval.
 * GET /finance/expenses/pending
 */
export async function getPendingExpenses(): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>("/finance/expenses/pending")
  return data
}

/**
 * Update expense status (approve or reject).
 * PATCH /finance/expenses/:id/status
 */
export async function updateExpenseStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectedReason?: string,
): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/finance/expenses/${id}/status`, {
    status,
    rejectedReason,
  })
  return data
}
