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
} from "@arellan-hnos-core-ecosystem/ui";
import { useOrders } from "@/hooks/use-orders";
import type { OrderFilters, OrderStatus } from "@/types";

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

  const columns = [
    {
      key: "orderNumber",
      header: "N° OT",
      render: (order: { orderNumber: number }) => (
        <span className="font-mono font-medium">#{order.orderNumber}</span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (order: { client: { firstName: string; lastName: string } }) =>
        `${order.client.firstName} ${order.client.lastName}`,
    },
    {
      key: "vehicle",
      header: "Vehiculo",
      render: (order: { vehicle: { brand: string; model: string; plate: string } }) =>
        `${order.vehicle.brand} ${order.vehicle.model} (${order.vehicle.plate})`,
    },
    {
      key: "status",
      header: "Estado",
      render: (order: { status: OrderStatus }) => (
        <OrderStatusBadge status={order.status} />
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      render: (order: { createdAt: string }) =>
        new Date(order.createdAt).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      header: "",
      render: (order: { id: string }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/orders/${order.id}`);
          }}
        >
          Ver detalle
        </Button>
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, placa o N° OT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={filters.status ?? "ALL"}
              onChange={(e) => handleStatusFilter(e.target.value)}
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
