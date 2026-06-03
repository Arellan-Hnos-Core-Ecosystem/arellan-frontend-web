import { useQuery } from "@tanstack/react-query"
import { getVehicleHistory } from "@/services/vehicles.service"
import type { Order } from "@/types"

/**
 * Fetch the order history for a specific vehicle.
 * Returns all past work orders associated with the vehicle.
 */
export function useVehicleHistory(vehicleId: string | undefined) {
  return useQuery<Order[]>({
    queryKey: ["vehicles", vehicleId, "history"],
    queryFn: () => getVehicleHistory(vehicleId!),
    enabled: Boolean(vehicleId),
  })
}
