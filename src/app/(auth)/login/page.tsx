"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  FormField,
  Spinner,
  Alert,
  Container,
  cn,
} from "@arellan-hnos-core-ecosystem/ui";
import { useAuthStore } from "@/stores/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingrese un email valido"),
  password: z
    .string()
    .min(1, "La contrasena es requerida")
    .min(6, "La contrasena debe tener al menos 6 caracteres"),
});

const mfaSchema = z.object({
  code: z
    .string()
    .min(1, "El codigo es requerido")
    .length(6, "El codigo debe tener 6 digitos"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MfaFormData = z.infer<typeof mfaSchema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    verifyMfa,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    mfaToken,
  } = useAuthStore();
  const [mfaMode, setMfaMode] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mfaForm = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && !mfaToken) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, mfaToken, router]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data);
      const state = useAuthStore.getState();
      if (state.mfaToken) {
        setMfaMode(true);
      }
    } catch {
      // Error manejado en el store
    }
  };

  const handleMfa = async (data: MfaFormData) => {
    try {
      await verifyMfa({ code: data.code, mfaToken: mfaToken ?? "" });
      router.push("/dashboard");
    } catch {
      // Error manejado en el store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Container className="max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Arellan Hnos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Clinica Automotriz · Panel de Administracion
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            <p>{error}</p>
            <button
              onClick={clearError}
              className="ml-2 font-bold"
              aria-label="Cerrar alerta"
            >
              x
            </button>
          </Alert>
        )}

        {mfaMode ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                Verificacion en Dos Pasos
              </h2>
              <p className="text-sm text-muted-foreground">
                Ingrese el codigo de autenticacion de su aplicacion
              </p>
            </CardHeader>
            <form onSubmit={mfaForm.handleSubmit(handleMfa)}>
              <CardContent>
                <FormField
                  label="Codigo MFA"
                  error={mfaForm.formState.errors.code?.message}
                >
                  <Input
                    {...mfaForm.register("code")}
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    autoFocus
                  />
                </FormField>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : null}
                  Verificar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMfaMode(false)}
                >
                  Volver al inicio de sesion
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Iniciar Sesion</h2>
              <p className="text-sm text-muted-foreground">
                Ingrese sus credenciales para acceder al panel
              </p>
            </CardHeader>
            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <CardContent className="space-y-4">
                <FormField
                  label="Email"
                  error={loginForm.formState.errors.email?.message}
                >
                  <Input
                    id="email"
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="correo@arellanhnos.com"
                    autoComplete="email"
                  />
                </FormField>
                <FormField
                  label="Contrasena"
                  error={loginForm.formState.errors.password?.message}
                >
                  <Input
                    id="contrasena"
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </FormField>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : null}
                  Ingresar
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </Container>
    </div>
  );
}
