"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Input,
  Spinner,
  Container,
  Alert,
  DataTable,
  Pagination,
  EmptyState,
  Select,
  Badge,
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

const ACTION_TRANSLATIONS: Record<string, string> = {
  CLIENTS_CREATED: "Cliente Registrado",
  CLIENTS_UPDATED: "Cliente Actualizado",
  ORDERS_CREATED: "Orden de Trabajo Creada",
  ORDERS_UPDATED: "Orden de Trabajo Actualizada",
  ORDER_STATUS_CHANGED: "Estado de OT Cambiado",
  WORK_ORDER_COMPLETED: "OT Completada",
  PAYMENTS_CREATED: "Pago Registrado",
  PAYMENTS_VERIFIED: "Pago Verificado",
  PAYMENT_UNAUTHORIZED_YAPE: "Alerta Yape No Autorizado",
  PAYMENT_QR_GENERATED: "QR de Pago Generado",
  FINANCE_CREATED: "Gasto Registrado",
  FINANCE_UPDATED: "Gasto Actualizado",
  FINANCE_APPROVED: "Gasto Aprobado",
  FINANCE_REJECTED: "Gasto Rechazado",
  VEHICLES_CREATED: "Vehículo Registrado",
  VEHICLES_UPDATED: "Vehiculo Actualizado",
  INVENTORY_CREATED: "Repuesto Registrado",
  INVENTORY_UPDATED: "Inventario Actualizado",
  INVENTORY_MOVEMENT: "Movimiento de Inventario",
  CRITICAL_STOCK: "Alerta de Stock Crítico",
  SECURITY: "Control de Acceso",
  SETTINGS_CREATED: "Configuracion Creada",
  SETTINGS_UPDATED: "Configuracion Actualizada",
  CASHBOX_OPENED: "Caja Abierta",
  CASHBOX_CLOSED: "Caja Cerrada",
  CASHBOX_BLOCKED_MAJOR_DISCREPANCY: "Caja Bloqueada - Discrepancia Mayor",
  CASHBOX_DAILY_REPORT_SENT: "Reporte Diario de Caja Enviado",
  CASHBOX_OVERRIDE_TOTP: "Anulacion de Caja Via TOTP",
  ORDER_CREATED: "Orden de Trabajo Creada",
  ORDER_CANCELLED: "Orden Cancelada",
  EXPENSE_APPROVED: "Gasto Aprobado",
  CONFIG_CHANGED: "Configuracion Cambiada",
  LOGOUT: "Cierre de Sesion",
  LOGOUT_ALL: "Cierre de Todas las Sesiones",
  LOGIN: "Inicio de Sesion",
  PERSONNEL_CREATED: "Personal Registrado",
  PERSONNEL_UPDATED: "Personal Actualizado",
  ATTENDANCE_CHECK_IN: "Entrada Registrada",
  ATTENDANCE_CHECK_OUT: "Salida Registrada",
  ATTENDANCE_LATE_PENALTY: "Penalizacion por Tardanza",
  VEHICLE_USAGE_AUTHORIZED: "Uso de Vehiculo Autorizado",
  VEHICLE_RETURNED: "Vehiculo Devuelto",
  PURCHASES_CREATED: "Orden de Compra Creada",
  PURCHASES_RECEIVED: "Compra Recibida",
  COMMISSIONS_CREATED: "Comision Registrada",
  COMMISSIONS_APPROVED: "Comision Aprobada",
  QUOTES_CREATED: "Cotizacion Creada",
  QUOTES_CONVERTED: "Cotizacion Convertida a OT",
  INVOICES_CREATED: "Factura Emitida",
  INVOICES_CANCELLED: "Factura Cancelada",
  BACKUP_TRIGGERED: "Backup Automatico Ejecutado",
  MONTHLY_INVENTORY_AUDIT: "Auditoria Mensual de Inventario",
  DISCOUNT_APPLIED: "Descuento Aplicado",
  PART_ADDED: "Repuesto Agregado a OT",
  MECHANIC_ASSIGNED: "Mecanico Asignado",
  ACCOUNT_CREATED: "Cuenta de Usuario Creada",
  ACCOUNT_UPDATED: "Cuenta de Usuario Actualizada",
  SECURITY_ALERT: "Alerta de Seguridad",
};

const ENTITY_TRANSLATIONS: Record<string, string> = {
  orders: "Ordenes de Trabajo",
  work_orders: "Ordenes de Trabajo",
  WorkOrder: "Orden de Trabajo",
  clients: "Clientes",
  vehicles: "Vehiculos",
  finance: "Finanzas",
  payments: "Pagos",
  inventory: "Inventario",
  inventory_items: "Inventario",
  personnel: "Personal",
  attendance: "Asistencia",
  settings: "Configuraciones",
  auth: "Autenticacion",
  Session: "Sesion",
  CashboxSession: "Caja Chica",
  cashbox_sessions: "Caja Chica",
  cashbox: "Caja Chica",
  purchases: "Compras",
  commissions: "Comisiones",
  quotes: "Cotizaciones",
  invoices: "Facturas",
  audit_logs: "Auditoria",
  AuditLog: "Registro de Auditoria",
  accounts: "Cuentas de Usuario",
  Account: "Cuenta de Usuario",
  System: "Sistema",
  "work order": "Orden de Trabajo",
  expense: "Gasto / Finanzas",
  setting: "Configuracion del Sistema",
  notifications: "Notificaciones",
  VehicleUsage: "Uso de Vehiculo",
  Approval: "Aprobacion",
  ExpenseAuthorization: "Gasto",
  FinancialTransaction: "Transaccion Financiera",
  InventoryMovement: "Movimiento de Inventario",
};

function translateAction(raw: string): string {
  if (ACTION_TRANSLATIONS[raw]) return ACTION_TRANSLATIONS[raw];

  const withUnderscore = raw
    .replace(/([A-Z])/g, "_$1")
    .toUpperCase()
    .replace(/^_/, "");
  if (ACTION_TRANSLATIONS[withUnderscore]) return ACTION_TRANSLATIONS[withUnderscore];

  const parts = raw.split("_");
  if (parts.length >= 2) {
    const entityPart = parts.slice(0, -1).join(" ");
    const actionPart = parts[parts.length - 1];
    const actionWord =
      actionPart === "CREATED" ? "Creado(a)" :
      actionPart === "UPDATED" ? "Actualizado(a)" :
      actionPart === "DELETED" ? "Eliminado(a)" :
      actionPart;
    return `${entityPart} ${actionWord}`;
  }

  return raw.replace(/_/g, " ");
}

function translateEntity(raw: string | null | undefined): string {
  if (!raw) return "Sistema";
  if (ENTITY_TRANSLATIONS[raw]) return ENTITY_TRANSLATIONS[raw];

  const lowerRaw = raw.toLowerCase();
  if (ENTITY_TRANSLATIONS[lowerRaw]) return ENTITY_TRANSLATIONS[lowerRaw];

  return raw.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

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
      accessor: (log: { action: string; severity?: string }) => {
        const translated = translateAction(log.action);
        const isSecurity = log.severity === "SECURITY_ALERT" || log.severity === "CRITICAL";
        return (
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              isSecurity
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {translated}
          </span>
        );
      },
    },
    {
      key: "entity",
      header: "Entidad",
      accessor: (log: { entity: string | null; entityId: string | null }) => (
        <div>
          <div className="font-medium text-sm">
            {translateEntity(log.entity)}
          </div>
          {log.entityId && (
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {log.entityId.length > 36
                ? `${log.entityId.substring(0, 8)}...`
                : log.entityId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "user",
      header: "Usuario",
      accessor: (log: { userName?: string; userId?: string }) => (
        <span className="text-sm">
          {log.userName || log.userId || "Sistema"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severidad",
      accessor: (log: { severity?: string }) => {
        if (!log.severity) return <span className="text-muted-foreground text-xs">-</span>;
        const variant =
          log.severity === "SECURITY_ALERT" || log.severity === "CRITICAL"
            ? "error"
            : log.severity === "WARNING"
              ? "warning"
              : "neutral";
        const label =
          log.severity === "SECURITY_ALERT" ? "Alerta" :
          log.severity === "CRITICAL" ? "Critico" :
          log.severity === "WARNING" ? "Advertencia" :
          log.severity === "INFO" ? "Info" :
          log.severity;
        return <Badge variant={variant as any}>{label}</Badge>;
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

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuario..."
                value={searchUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchUser(e.target.value)
                }
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
              <DataTable
                columns={columns}
                data={data.data}
                keyExtractor={(row) => row.id}
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
          title="Sin registros"
          description="No se encontraron registros de auditoria con los filtros actuales"
        />
      )}
    </Container>
  );
}
