"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
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
import { useOrder, useUpdateOrderStatus, useCancelOrder } from "@/hooks/use-orders";
import type { OrderStatus } from "@/types";

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

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [cancelReason, setCancelReason] = useState("");

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
          <Button onClick={() => setShowStatusModal(true)}>
            Cambiar Estado
          </Button>
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

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Historial de Estados</h2>
            </CardHeader>
            <CardContent>
              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-0">
                  {[...order.timeline]
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
                      {order.parts.map((op) => (
                        <tr key={op.id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">
                            {op.part?.code ?? "N/A"}
                          </td>
                          <td className="py-2">{op.part?.name ?? "N/A"}</td>
                          <td className="py-2">{op.quantity}</td>
                          <td className="py-2">
                            S/ {op.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2 font-medium">
                            S/ {(op.quantity * op.unitPrice).toFixed(2)}
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
                  {order.photos.map((photo) => (
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="Explique el motivo de la cancelacion..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </FormField>
      </ConfirmDialog>
    </Container>
  );
}
