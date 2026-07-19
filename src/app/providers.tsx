"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@arellan-hnos-core-ecosystem/ui";
import { ToastContainer } from "@/app/components/toast-container";
import { useAuthStore } from "@/stores/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  // SEC-04: al recargar, el access token (solo memoria) se perdió; la cookie
  // HttpOnly de refresh lo reanuda vía BFF. Sin cookie válida no hace nada
  // (el middleware ya redirigió a /login en rutas protegidas).
  useEffect(() => {
    const { accessToken, restoreSession } = useAuthStore.getState();
    if (!accessToken) void restoreSession();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultScheme="system">
        {children}
        <ToastContainer />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
