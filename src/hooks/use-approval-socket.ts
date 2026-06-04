"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { useUIStore } from "@/stores/ui"

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001"

export function useApprovalSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const addToast = useUIStore((s) => s.addToast)

  const connect = useCallback(() => {
    if (!accessToken) return
    if (socketRef.current?.connected) return

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on("connect", () => {
      setConnected(true)
      socket.emit("dashboard:subscribe")
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    socket.on("approval:requested", (data: {
      approvalId: string
      type: string
      amount: number
      requestedBy: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses", "pending"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      addToast({
        type: "warning",
        title: "Nueva aprobacion pendiente",
        message: `Gasto de S/ ${Number(data.amount || 0).toFixed(2)} requiere aprobacion`,
      })
    })

    socket.on("approval:resolved", (data: {
      approvalId: string
      status: string
      resolvedBy: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses", "pending"] })
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      addToast({
        type: "info",
        title: "Aprobacion resuelta",
        message: `La solicitud ha sido ${data.status === "APPROVED" ? "aprobada" : "rechazada"}`,
      })
    })

    socket.on("alert:security", (data: {
      type: string
      description: string
      severity: string
    }) => {
      addToast({
        type: "error",
        title: `Alerta: ${data.type}`,
        message: data.description,
        duration: 10000,
      })
    })

    socketRef.current = socket
  }, [accessToken, queryClient, addToast])

  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners()
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnected(false)
  }, [])

  useEffect(() => {
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  return { connected, reconnect: connect, disconnect }
}
