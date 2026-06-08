"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { useUIStore } from "@/stores/ui"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001"

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const addToast = useUIStore((s) => s.addToast)

  const connect = useCallback(() => {
    if (!accessToken) return
    if (socketRef.current?.connected) return

    setStatus("connecting")

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socket.on("connect", () => {
      setStatus("connected")
    })

    socket.on("disconnect", () => {
      setStatus("disconnected")
    })

    socket.on("connect_error", () => {
      setStatus("error")
    })

    socket.on("order:updated", (data: {
      orderId: string
      orderNumber: string
      newStatus: string
      vehiclePlate: string
      mechanicName?: string
      changedBy: string
      timestamp: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", data.orderId] })
      }
      addToast({
        type: "info",
        title: `OT #${data.orderNumber} actualizada`,
        message: `${data.vehiclePlate}: ${data.newStatus} por ${data.changedBy}`,
      })
    })

    socket.on("order:status_changed", (data: {
      orderId: string
      oldStatus: string
      newStatus: string
      updatedBy: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", data.orderId] })
      }
    })

    socket.on("anomaly:detected", (data: {
      type: string
      description: string
      severity: string
      sessionId?: string
      userId?: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["finance"] })
      addToast({
        type: "error",
        title: `Anomalia: ${data.type}`,
        message: data.description,
        duration: 10000,
      })
    })

    socket.on("inventory:low_stock", (data: {
      itemId: string
      itemName: string
      currentStock: number
      minStock: number
    }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      addToast({
        type: "warning",
        title: "Stock critico",
        message: `${data.itemName}: ${data.currentStock}/${data.minStock} unidades`,
      })
    })

    socketRef.current = socket
  }, [accessToken, queryClient, addToast])

  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners()
    socketRef.current?.disconnect()
    socketRef.current = null
    setStatus("disconnected")
  }, [])

  useEffect(() => {
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  return {
    status,
    isConnected: status === "connected",
    reconnect: connect,
    disconnect,
  } as const
}
