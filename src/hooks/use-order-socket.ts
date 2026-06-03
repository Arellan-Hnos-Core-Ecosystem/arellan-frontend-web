"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuthStore } from "@/stores/auth"
import { useQueryClient } from "@tanstack/react-query"
import { useUIStore } from "@/stores/ui"
import type { OrderStatus } from "@/types"

interface OrderSocketEvent {
  orderId: string
  orderNumber: string
  newStatus: OrderStatus
  vehiclePlate: string
  mechanicName?: string
  changedBy: string
  changedById: string
  timestamp: string
}

interface UseOrderSocketOptions {
  orderId?: string
  onStatusChange?: (event: OrderSocketEvent) => void
}

export function useOrderSocket(options: UseOrderSocketOptions = {}) {
  const { orderId, onStatusChange } = options
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [latency, setLatency] = useState<number | null>(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const connect = useCallback(() => {
    if (!accessToken) return
    if (socketRef.current?.connected) return

    const socket = io(
      `${process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000"}/ws/orders`,
      {
        auth: { token: accessToken },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      },
    )

    socket.on("connect", () => {
      setConnected(true)

      if (orderId) {
        socket.emit("order:subscribe", { orderId })
      }

      pingIntervalRef.current = setInterval(() => {
        const start = Date.now()
        socket.emit("ping", () => {
          setLatency(Date.now() - start)
        })
      }, 10000)
    })

    socket.on("disconnect", () => {
      setConnected(false)
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
    })

    socket.on("order:updated", (event: OrderSocketEvent) => {
      if (event.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", event.orderId] })
        queryClient.invalidateQueries({ queryKey: ["orders"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      }

      addToast({
        type: "info",
        title: `OT #${event.orderNumber} actualizada`,
        message: `${event.vehiclePlate}: ${event.newStatus} por ${event.changedBy}`,
      })

      onStatusChange?.(event)
    })

    socket.on("connect_error", (error) => {
      console.error("WS connection error:", error.message)
      setConnected(false)
    })

    socketRef.current = socket
  }, [accessToken, orderId, queryClient, addToast, onStatusChange])

  const disconnect = useCallback(() => {
    if (orderId && socketRef.current) {
      socketRef.current.emit("order:unsubscribe", { orderId })
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnected(false)
  }, [orderId])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, disconnect])

  useEffect(() => {
    if (accessToken) {
      connect()
    }
  }, [accessToken, connect])

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  return {
    connected,
    latency,
    emit,
    reconnect: connect,
    disconnect,
  }
}
