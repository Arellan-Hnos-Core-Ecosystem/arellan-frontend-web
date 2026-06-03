import { useQuery } from "@tanstack/react-query"
import { getLowStock } from "@/services/inventory.service"
import type { Part } from "@/types"

/**
 * Fetch inventory items that are below their minimum stock threshold.
 * Auto-refetches every 60 seconds to keep low-stock alerts fresh.
 */
export function useLowStock() {
  return useQuery<Part[]>({
    queryKey: ["inventory", "low-stock"],
    queryFn: getLowStock,
    refetchInterval: 60000,
  })
}
