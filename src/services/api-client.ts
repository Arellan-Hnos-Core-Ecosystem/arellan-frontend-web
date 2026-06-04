import axios from "axios"
import { useAuthStore } from "@/stores/auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []
let redirectGuard = false

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            },
            reject,
          })
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        await useAuthStore.getState().refreshAccessToken()
        const newToken = useAuthStore.getState().accessToken
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return apiClient(originalRequest)
        }
        processQueue(new Error("Refresh failed"), null)
        if (typeof window !== "undefined" && !redirectGuard) {
          redirectGuard = true
          useAuthStore.getState().logout()
          window.location.replace("/login")
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        if (typeof window !== "undefined" && !redirectGuard) {
          redirectGuard = true
          useAuthStore.getState().logout()
          window.location.replace("/login")
        }
      } finally {
        isRefreshing = false
      }
    }
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      "Error de conexion"
    return Promise.reject(new Error(message))
  },
)

export default apiClient
