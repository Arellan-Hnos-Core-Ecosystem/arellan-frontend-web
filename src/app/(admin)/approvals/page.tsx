"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Spinner,
  Container,
  Badge,
  CashAmount,
  EmptyState,
  ConfirmDialog,
  StatusIndicator,
} from "@arellan-hnos-core-ecosystem/ui";
import { usePendingExpenses, useApproveExpense } from "@/hooks/use-finance";
import { useApprovalSocket } from "@/hooks/use-approval-socket";
import { useState } from "react";

export default function ApprovalsPage() {
  const { data: pendingExpenses, isLoading, error } = usePendingExpenses();
  const approveExpense = useApproveExpense();
  const { connected } = useApprovalSocket();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (id: string) => {
    await approveExpense.mutateAsync({
      id,
      status: "APPROVED",
    });
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await approveExpense.mutateAsync({
      id: rejectId,
      status: "REJECTED",
      rejectedReason: rejectReason,
    });
    setRejectId(null);
    setRejectReason("");
  };

  const pendingCount = pendingExpenses?.length ?? 0;

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aprobaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de autorizaciones de gastos pendientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Actualizando cada 15s
            </span>
          )}
          <Badge variant="brand">{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-red-500">
            Error al cargar las aprobaciones
          </CardContent>
        </Card>
      ) : pendingExpenses && pendingExpenses.length > 0 ? (
        <div className="space-y-4">
          {pendingExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {expense.description}
                      </h3>
                      <Badge variant="brand">
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        Solicitado por:{" "}
                        <span className="font-medium text-foreground">
                          {expense.requestedBy?.name ?? "N/A"}
                        </span>
                      </span>
                      <span>
                        {new Date(expense.createdAt).toLocaleDateString(
                          "es-PE",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      {expense.orderId && (
                        <span>
                          OT: #{expense.orderId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <CashAmount
                      amount={expense.amount}
                      className="text-xl font-bold"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(expense.id)}
                        disabled={approveExpense.isPending}
                      >
                        {approveExpense.isPending ? (
                          <Spinner className="mr-2 h-3 w-3" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRejectId(expense.id)}
                        disabled={approveExpense.isPending}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin aprobaciones pendientes"
          description="No hay gastos pendientes de aprobacion en este momento"
        />
      )}

      <ConfirmDialog
        open={rejectId !== null}
        onClose={() => {
          setRejectId(null);
          setRejectReason("");
        }}
        onConfirm={handleReject}
        title="Rechazar Gasto"
        description="Confirme que desea rechazar este gasto. Esta accion no se puede deshacer."
        confirmLabel="Rechazar"
        variant="danger"
      >
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium">
            Motivo del rechazo
          </label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="Explique el motivo del rechazo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </Container>
  );
}
