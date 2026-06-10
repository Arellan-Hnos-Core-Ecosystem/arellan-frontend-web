"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Spinner,
  Container,
  Alert,
  Badge,
  OrderStatusBadge,
  ConfirmDialog,
  Modal,
  Select,
  FormField,
} from "@arellan-hnos-core-ecosystem/ui";
import { useOrder, useUpdateOrderStatus, useCancelOrder, useSendQuote } from "@/hooks/use-orders";
import { api } from "@/lib/api";
import { z } from "zod";
import type { OrderStatus } from "@/types";

const quoteFormSchema = z.object({
  laborCost: z.number({ invalid_type_error: "Ingrese un monto válido" }).positive("La mano de obra debe ser mayor a cero"),
  partsCost: z.number({ invalid_type_error: "Ingrese un monto válido" }).min(0, "Los repuestos no pueden ser negativos"),
}).refine((d) => d.laborCost + d.partsCost > 0, { message: "La suma de costos debe ser mayor a cero" });

const statusLabels: Record<OrderStatus, string> = {
  RECEIVED: "Recibido",
  IN_DIAGNOSIS: "En Diagnostico",
  BUDGETED: "Presupuestado",
  IN_PROGRESS: "En Proceso",
  IN_REVIEW: "En Revision",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ["IN_DIAGNOSIS", "CANCELLED"],
  IN_DIAGNOSIS: ["BUDGETED", "CANCELLED"],
  BUDGETED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["READY", "CANCELLED"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: order, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const sendQuote = useSendQuote();

  const [quoteLaborCost, setQuoteLaborCost] = useState("");
  const [quotePartsCost, setQuotePartsCost] = useState("");
  const [quoteErrors, setQuoteErrors] = useState<Record<string, string>>({});

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // QR Payment
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);

  const handleGenerateQR = async () => {
    if (!order) return;
    setQrLoading(true);
    try {
      const { data } = await api.post("/finance/qr/generate", { workOrderId: order.id });
      setQrData(data);
      setQrCountdown(420);
      setShowQRModal(true);
    } catch (err: any) {
      const addToast = (await import("@/stores/ui")).useUIStore.getState().addToast;
      addToast({ type: "error", title: "Error", message: err.response?.data?.message || err.message });
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (qrCountdown <= 0) return;
    const timer = setInterval(() => setQrCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [qrCountdown]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Container>
        <Alert variant="error">
          {error?.message ?? "Orden no encontrada"}
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/orders")}
        >
          Volver a ordenes
        </Button>
      </Container>
    );
  }

  const availableTransitions = statusTransitions[order.status] ?? [];

  const handleSendQuote = async () => {
    const parsed = quoteFormSchema.safeParse({
      laborCost: parseFloat(quoteLaborCost) || 0,
      partsCost: parseFloat(quotePartsCost) || 0,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[String(e.path[0])] = e.message; });
      setQuoteErrors(fieldErrors);
      return;
    }
    setQuoteErrors({});
    await sendQuote.mutateAsync({ orderId: order.id, laborCost: parsed.data.laborCost, partsCost: parsed.data.partsCost });
  };

  const orderAny = order as any;

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    await updateStatus.mutateAsync({
      id: order.id,
      status: selectedStatus,
      comment: statusComment || undefined,
    });
    setShowStatusModal(false);
    setSelectedStatus("");
    setStatusComment("");
  };

  const handleCancel = async () => {
    if (!cancelReason) return;
    await cancelOrder.mutateAsync({
      id: order.id,
      reason: cancelReason,
    });
    setShowCancelModal(false);
    setCancelReason("");
  };

  return (
    <Container>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/orders")}
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
                <polyline points="15,18 9,12 15,6" />
              </svg>
              Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              OT #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {availableTransitions.length > 0 && (
          <>
          <Button onClick={() => setShowStatusModal(true)}>
            Cambiar Estado
          </Button>
          <Button variant="outline" onClick={handleGenerateQR} disabled={qrLoading || order.status === "CANCELLED"}>
            {qrLoading ? <Spinner size="sm" /> : "Generar QR de Cobro"}
          </Button>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Descripcion</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.description}</p>
              {order.observations && (
                <div className="mt-3 rounded-md bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Observaciones:
                  </p>
                  <p className="mt-1 text-sm">{order.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote — visible when BUDGETED */}
          {order.status === "BUDGETED" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  Cotización al Cliente
                  {orderAny.quote && (
                    <Badge
                      variant={orderAny.quote.status === "SENT" ? "warning" : orderAny.quote.status === "APPROVED" ? "success" : "neutral"}
                      className="ml-2 text-xs"
                    >
                      {orderAny.quote.status}
                    </Badge>
                  )}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderAny.quote?.status === "SENT" ? (
                  <Alert variant="info">
                    Cotización <strong>{orderAny.quote.number}</strong> enviada al cliente. Total: <strong>S/ {Number(orderAny.quote.total).toFixed(2)}</strong>.
                    Válida hasta {new Date(orderAny.quote.validUntil).toLocaleDateString("es-PE")}.
                  </Alert>
                ) : orderAny.quote?.status === "APPROVED" ? (
                  <Alert variant="success">
                    Cotización aprobada por el cliente. OT en progreso.
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ingrese los costos finales del diagnóstico. Los repuestos importados incluirán automáticamente el costo de aduanas.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Mano de obra (S/)" error={quoteErrors.laborCost}>
                        <Input
                          id="labor-cost"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={quoteLaborCost}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuoteLaborCost(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Repuestos (S/)" error={quoteErrors.partsCost}>
                        <Input
                          id="parts-cost"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={quotePartsCost}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuotePartsCost(e.target.value)}
                        />
                      </FormField>
                    </div>
                    {quoteErrors[""] && <p className="text-xs text-destructive">{quoteErrors[""]}</p>}
                    <Button
                      onClick={handleSendQuote}
                      disabled={sendQuote.isPending || !quoteLaborCost}
                      className="w-full"
                    >
                      {sendQuote.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Enviar Cotización al Cliente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Historial de Estados</h2>
            </CardHeader>
            <CardContent>
              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-0">
                  {[...(order.timeline ?? [])]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((entry, index, arr) => (
                      <div
                        key={entry.id}
                        className="relative flex gap-4 pb-4 last:pb-0"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-3 w-3 rounded-full border-2 ${
                              index === 0
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30 bg-muted"
                            }`}
                          />
                          {index < arr.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <OrderStatusBadge status={entry.status} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString(
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
                          </div>
                          {entry.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.comment}
                            </p>
                          )}
                          {entry.changedBy && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              por {entry.changedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin historial de estados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Parts used */}
          {order.parts && order.parts.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Repuestos Utilizados</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium text-muted-foreground">
                          Codigo
                        </th>
                        <th className="py-2 font-medium text-muted-foreground">
                          Repuesto
                        </th>
                        <th className="py-2 font-medium text-muted-foreground">
                          Cantidad
                        </th>
                        <th className="py-2 font-medium text-muted-foreground">
                          Precio Unit.
                        </th>
                        <th className="py-2 font-medium text-muted-foreground">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.parts ?? []).map((op) => (
                        <tr key={op.id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">
                            {op.part?.code ?? "N/A"}
                          </td>
                          <td className="py-2">{op.part?.name ?? "N/A"}</td>
                          <td className="py-2">{op.quantity}</td>
                          <td className="py-2">
                            S/ {Number(op.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-2 font-semibold">
                            S/ {Number((op.quantity * Number(op.unitPrice || 0)) || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {order.photos && order.photos.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Fotos</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {(order.photos ?? []).map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-lg border"
                    >
                      <img
                        src={photo.url}
                        alt={photo.description ?? "Foto de la orden"}
                        className="aspect-square w-full object-cover"
                      />
                      {photo.description && (
                        <p className="p-2 text-xs text-muted-foreground">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vehicle info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Vehiculo</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Placa</p>
                <p className="font-mono font-medium">{order.vehicle.plate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marca / Modelo</p>
                <p className="font-medium">
                  {order.vehicle.brand} {order.vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ano</p>
                <p className="font-medium">{order.vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="font-medium">{order.vehicle.color}</p>
              </div>
              {order.vehicle.vin && (
                <div>
                  <p className="text-xs text-muted-foreground">VIN</p>
                  <p className="font-mono text-sm">{order.vehicle.vin}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Cliente</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {order.client.firstName} {order.client.lastName}
                </p>
              </div>
              {order.client.dni && (
                <div>
                  <p className="text-xs text-muted-foreground">DNI</p>
                  <p className="font-medium">{order.client.dni}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="font-medium">{order.client.phone}</p>
              </div>
              {order.client.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{order.client.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mechanic */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Mecanico Asignado</h2>
            </CardHeader>
            <CardContent>
              {order.mechanic ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {order.mechanic.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{order.mechanic.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.mechanic.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin mecanico asignado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payments + Yape alert */}
          {(() => {
            if (!orderAny.payments?.length) return null;
            return (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Pagos</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderAny.payments.filter((p: any) => p.isPersonalYape).length > 0 && (
                  <Alert variant="error" className="border-red-500 bg-red-50">
                    <p className="font-bold text-sm">⚠️ Pago en cuenta Yape personal detectado</p>
                    {orderAny.payments.filter((p: any) => p.isPersonalYape).map((p: any) => (
                      <p key={p.id} className="text-xs mt-1">
                        S/ {Number(p.amount).toFixed(2)} recibido en cuenta {p.yapeAccount || "desconocida"}
                      </p>
                    ))}
                    <p className="text-xs mt-2 font-medium">Verificar con el equipo de administración.</p>
                  </Alert>
                )}
                {orderAny.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.method}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-PE") : ""}
                      </p>
                    </div>
                    <span className="font-bold text-sm">S/ {Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )})()}
        </div>
      </div>

      {/* Status change modal */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cambiar Estado de la Orden"
      >
        <div className="space-y-4">
          <FormField label="Nuevo Estado">
            <Select
              id="nuevo-estado"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as OrderStatus)
              }
              options={[
                { value: "", label: "Seleccionar estado..." },
                ...availableTransitions.map((status) => ({
                  value: status,
                  label: statusLabels[status],
                })),
              ]}
            />
          </FormField>
          <FormField label="Comentario (opcional)">
            <textarea
              id="comentario"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Comentario sobre el cambio de estado..."
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Actualizar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancelar Orden"
        description="Esta accion no se puede deshacer. La orden sera marcada como cancelada."
        confirmLabel="Si, cancelar orden"
        variant="danger"
      >
        <FormField label="Motivo de cancelacion" className="mt-3">
          <textarea
            id="motivo-cancelacion"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="Explique el motivo de la cancelacion..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </FormField>
      </ConfirmDialog>

      {/* QR Payment Modal */}
      <Modal open={showQRModal} onClose={() => setShowQRModal(false)} title="Cobro con QR">
        {qrData && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-500">Escanee el QR para pagar</p>
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCodeSVG value={qrData.qrToken} size={200} />
            </div>
            <p className="text-3xl font-bold">S/ {Number(qrData.amount).toFixed(2)}</p>
            <p className="text-sm text-gray-400">
              Orden: {qrData.orderId}
            </p>
            <p className={`text-sm font-medium ${qrCountdown < 60 ? "text-red-500" : "text-gray-500"}`}>
              Expira en {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, "0")}
            </p>
            <Alert variant="warning">
              Este es el QR oficial del taller. No usar Yape personal.
            </Alert>
          </div>
        )}
      </Modal>
    </Container>
  );
}
