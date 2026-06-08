import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";

export async function getDashboardSummary(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/dashboard/summary");
  return data;
}
