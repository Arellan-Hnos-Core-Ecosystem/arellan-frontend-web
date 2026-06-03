import { useQuery } from "@tanstack/react-query"
import { getClientVehicles } from "@/services/clients.service"
import type { Vehicle } from "@/types"

/**
 * Fetch all vehicles belonging to a specific client.
 * Uses the clients service under the hood.
 */
export function useClientVehicles(clientId: string | undefined) {
  return useQuery<Vehicle[]>({
    queryKey: ["clients", clientId, "vehicles"],
    queryFn: () => getClientVehicles(clientId!),
    enabled: Boolean(clientId),
  })
}
