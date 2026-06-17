"use client";

import { useState } from "react";
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
  Pagination,
  EmptyState,
  Select,
} from "@arellan-hnos-core-ecosystem/ui";
import { useAuditLogs } from "@/hooks/use-audit";
import type { AuditFilters, AuditAction, AuditEntity } from "@/types";

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  LOGIN: "Inicio Sesion",
  LOGOUT: "Cierre Sesion",
  APPROVE: "Aprobar",
  REJECT: "Rechazar",
};

const entityLabels: Record<AuditEntity, string> = {
  ORDER: "Orden",
  CLIENT: "Cliente",
  VEHICLE: "Vehiculo",
  EXPENSE: "Gasto",
  INVENTORY: "Inventario",
  CASHBOX: "Caja",
  ACCOUNT: "Cuenta",
  PART: "Repuesto",
  PHOTO: "Foto",
};

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    pageSize: 15,
  });
  const [searchUser, setSearchUser] = useState("");

  const { data, isLoading, error } = useAuditLogs(filters);

  const handleActionFilter = (action: AuditAction | "ALL") => {
    setFilters((prev) => ({
      ...prev,
      action: action === "ALL" ? undefined : action,
      page: 1,
    }));
  };

  const handleEntityFilter = (entity: AuditEntity | "ALL") => {
    setFilters((prev) => ({
      ...prev,
      entity: entity === "ALL" ? undefined : entity,
      page: 1,
    }));
  };

  const columns = [
    {
      key: "action",
      header: "Accion",
      accessor: (log: { action: AuditAction }) => (
        <Badge
          variant={
            log.action === "DELETE"
              ? "error"
              : log.action === "CREATE"
                ? "success"
                : log.action === "APPROVE"
                  ? "success"
                  : log.action === "REJECT"
                    ? "error"
                    : "neutral"
          }
        >
          {actionLabels[log.action] ?? log.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entidad",
      accessor: (log: { entity: AuditEntity; entityId: string }) => (
        <div>
          <span className="text-sm">
            {entityLabels[log.entity] ?? log.entity}
          </span>
          <p className="text-xs text-muted-foreground font-mono">
            {log.entityId}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "Usuario",
      accessor: (log: { user: { name: string } }) => (
        <span className="text-sm">{log.user?.name ?? "Sistema"}</span>
      ),
    },
    {
      key: "changes",
      header: "Cambios",
      accessor: (log: { changes: Record<string, unknown> | null }) => {
        if (!log.changes) return <span className="text-muted-foreground">-</span>;
        const keys = Object.keys(log.changes);
        return (
          <span className="text-xs text-muted-foreground">
            {keys.length} campo(s) modificado(s)
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Fecha",
      accessor: (log: { createdAt: string }) =>
        new Date(log.createdAt).toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    },
  ];

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Registro de todas las acciones en el sistema
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuario..."
                value={searchUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUser(e.target.value)}
              />
            </div>
            <Select
              value={filters.action ?? "ALL"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleActionFilter(e.target.value as AuditAction | "ALL")
              }
              options={[
                { value: "ALL", label: "Todas las acciones" },
                ...Object.entries(actionLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              value={filters.entity ?? "ALL"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleEntityFilter(e.target.value as AuditEntity | "ALL")
              }
              options={[
                { value: "ALL", label: "Todas las entidades" },
                ...Object.entries(entityLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
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
          Error al cargar la auditoria: {error.message}
        </Alert>
      ) : data && data.data.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={data.data} keyExtractor={(row) => row.id} />
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
          title="Sin registros"
          description="No se encontraron registros de auditoria con los filtros actuales"
        />
      )}
    </Container>
  );
}
