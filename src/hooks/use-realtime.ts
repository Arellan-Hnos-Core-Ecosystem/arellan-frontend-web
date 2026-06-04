"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { useUIStore } from "@/stores/ui"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface OrderUpdateEvent {
  orderId: string
  orderNumber: string
  newStatus: string
  vehiclePlate: string
  mechanicName?: string
  changedBy: string
  changedById: string
  timestamp: string
}

/**
 * WebSocket hook that connects to the orders real-time feed.
 *
 * - Connects to ws://localhost:3000/ws/orders (or NEXT_PUBLIC_WS_URL)
 * - Handles "order:updated" events by invalidating the React Query cache
 * - Provides connection status (`connecting` | `connected` | `disconnected` | `error`)
 */
export function useRealtime() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const addToast = useUIStore((s) => s.addToast)

  const connect = useCallback(() => {
    if (!accessToken) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    // Avoid duplicate connection attempts
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) return

    setStatus("connecting")

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/ws/orders?token=${accessToken}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      setStatus("connected")
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        if (payload.type === "order:updated") {
          const evt = payload.data as OrderUpdateEvent

          // Invalidate relevant React Query caches
          queryClient.invalidateQueries({ queryKey: ["orders"] })
          queryClient.invalidateQueries({ queryKey: ["dashboard"] })
          if (evt.orderId) {
            queryClient.invalidateQueries({ queryKey: ["orders", evt.orderId] })
          }

          addToast({
            type: "info",
            title: `OT #${evt.orderNumber} actualizada`,
            message: `${evt.vehiclePlate}: ${evt.newStatus} por ${evt.changedBy}`,
          })
        }
      } catch {
        // Ignore non-JSON or malformed messages
      }
    }

    socket.onclose = () => {
      setStatus("disconnected")
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }

    socket.onerror = () => {
      setStatus("error")
    }

    wsRef.current = socket
  }, [accessToken, queryClient, addToast])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    wsRef.current?.close()
    wsRef.current = null
    setStatus("disconnected")
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    isConnected: status === "connected",
    reconnect: connect,
    disconnect,
  } as const
}
