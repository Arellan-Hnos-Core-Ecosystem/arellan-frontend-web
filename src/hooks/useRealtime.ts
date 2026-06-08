"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001"

type RealtimeEvent =
  | "order:created"
  | "order:updated"
  | "order:status_changed"
  | "inventory:low_stock"
  | "payment:received"
  | "personnel:check_in"
  | "personnel:check_out"
  | "vehicle:overdue"
  | "approval:requested"
  | "approval:resolved"
  | "alert:security"

type EventHandler = (data: any) => void

export function useRealtime(
  events: Partial<Record<RealtimeEvent, EventHandler>>,
  enabled = true,
) {
  const socketRef = useRef<Socket | null>(null)

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("accessToken")
  }, [])

  useEffect(() => {
    if (!enabled) return
    const token = getToken()
    if (!token) return

    const socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("[WS] Conectado:", socket.id)
    })

    socket.on("disconnect", (reason) => {
      console.log("[WS] Desconectado:", reason)
    })

    socket.on("connect_error", (err) => {
      console.warn("[WS] Error de conexion:", err.message)
    })

    Object.entries(events).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler)
    })

    return () => {
      Object.keys(events).forEach((event) => socket.off(event))
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef
}
