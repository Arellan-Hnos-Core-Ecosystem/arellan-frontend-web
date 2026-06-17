"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Spinner,
  Container,
  Alert,
  Badge,
  DataTable,
  EmptyState,
  Select,
  Pagination,
  OrderStatusBadge,
  Tabs,
} from "@arellan-hnos-core-ecosystem/ui";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import type { Order, OrderFilters, OrderStatus } from "@/types";

const statusOptions: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "RECEIVED", label: "Recibido" },
  { value: "IN_DIAGNOSIS", label: "En Diagnostico" },
  { value: "BUDGETED", label: "Presupuestado" },
  { value: "IN_PROGRESS", label: "En Proceso" },
  { value: "IN_REVIEW", label: "En Revision" },
  { value: "READY", label: "Listo" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useOrders(filters);
  const updateStatus = useUpdateOrderStatus();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "ALL" ? undefined : (value as OrderStatus),
      page: 1,
    }));
  };

  const handleTabChange = (tab: string) => {
    setFilters((prev) => ({
      ...prev,
      status: tab === "qa" ? "IN_REVIEW" : undefined,
      page: 1,
    }));
  };

  const handleApproveQa = (orderId: string) => {
    updateStatus.mutate({ id: orderId, status: "READY" });
  };

  const columns = [
    {
      key: "number",
      header: "N° OT",
      // El modelo Prisma expone "number" (secuencial OT-AAAA-NNN), no "orderNumber"
      accessor: (order: Order) => (
        <span className="font-mono font-medium">{order.number ?? "—"}</span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      accessor: (order: Order) =>
        order.client?.firstName
          ? `${order.client.firstName} ${order.client.lastName ?? ""}`.trim()
          : "Cliente no registrado",
    },
    {
      key: "vehicle",
      header: "Vehiculo",
      accessor: (order: Order) =>
        order.vehicle?.plate
          ? `${order.vehicle.brand ?? ""} ${order.vehicle.model ?? ""} (${order.vehicle.plate})`.trim()
          : "Sin vehículo",
    },
    {
      key: "status",
      header: "Estado",
      accessor: (order: Order) => (
        <OrderStatusBadge status={order.status} />
      ),
    },
    {
      key: "receivedAt",
      header: "Fecha",
      // El modelo Prisma expone "receivedAt" (no "createdAt") como fecha de ingreso
      accessor: (order: Order) => {
        const raw = order.receivedAt ?? order.createdAt;
        return raw
          ? new Date(raw).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
      },
    },
    {
      key: "actions",
      header: "",
      accessor: (order: Order) => (
        <div className="flex items-center justify-end gap-2">
          {order.status === "IN_REVIEW" && (
            <Button
              size="sm"
              data-testid={`approve-qa-${order.id}`}
              disabled={updateStatus.isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleApproveQa(order.id);
              }}
            >
              Aprobar Control de Calidad
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              router.push(`/orders/${order.id}`);
            }}
          >
            Ver detalle
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ordenes de Trabajo
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion de ordenes de servicio
          </p>
        </div>
        <Button onClick={() => router.push("/orders/new")}>
          + Nueva Orden
        </Button>
      </div>

      <Tabs defaultValue="all" onChange={handleTabChange} className="mb-6">
        <Tabs.List>
          <Tabs.Trigger value="all">Todas las Ordenes</Tabs.Trigger>
          <Tabs.Trigger value="qa">Pendientes de QA</Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, placa o N° OT..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={filters.status ?? "ALL"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusFilter(e.target.value)}
              options={statusOptions}
            />
            <Button variant="outline" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error">
          Error al cargar las ordenes: {error.message}
        </Alert>
      ) : data && data.data.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={data.data}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => router.push(`/orders/${row.id}`)}
              />
            </CardContent>
          </Card>
          {data.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(page) =>
                  setFilters((prev) => ({ ...prev, page }))
                }
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Sin ordenes"
          description="No se encontraron ordenes de trabajo con los filtros actuales"
          action={
            <Button onClick={() => router.push("/orders/new")}>
              Crear primera orden
            </Button>
          }
        />
      )}
    </Container>
  );
}
