import { useQuery } from "@tanstack/react-query"
import { getDashboard } from "@/services/finance.service"
import type { FinanceDashboard } from "@/services/finance.service"

/**
 * Fetch finance KPI dashboard data (revenue, expenses, cashbox status, etc.).
 * Refetches every 30 seconds.
 */
export function useFinanceDashboard() {
  return useQuery<FinanceDashboard>({
    queryKey: ["finance", "dashboard"],
    queryFn: getDashboard,
    refetchInterval: 30000,
  })
}
