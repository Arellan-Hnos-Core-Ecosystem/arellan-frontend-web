"use client";

import { useUIStore } from "@/stores/ui";

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`
            flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg
            transition-all duration-300 ease-in-out
            ${toast.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}
            ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-800" : ""}
            ${toast.type === "warning" ? "border-yellow-200 bg-yellow-50 text-yellow-800" : ""}
            ${toast.type === "info" ? "border-blue-200 bg-blue-50 text-blue-800" : ""}
          `}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && (
              <p className="text-xs opacity-80">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 hover:bg-black/5 transition-opacity"
            aria-label="Cerrar notificacion"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
