"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  Spinner,
  Container,
  Alert,
  Badge,
  cn,
} from "@arellan-hnos-core-ecosystem/ui";
import { useDashboardStats } from "@/hooks/use-orders";
import { useCriticalStock } from "@/hooks/use-inventory";
import { usePendingExpenses } from "@/hooks/use-finance";
import { useAuditLogs } from "@/hooks/use-audit";
import { CashAmount } from "@arellan-hnos-core-ecosystem/ui";

// Diccionario de traduccion: enums crudos del audit log -> texto legible
const ACTION_TRANSLATIONS: Record<string, string> = {
  CRITICAL_STOCK: "Alerta de Stock Crítico",
  INVENTORY_CREATED: "Registro de Repuesto",
  INVENTORY_UPDATED: "Actualización de Stock",
  INVENTORY_MOVEMENT: "Movimiento de Inventario",
  FINANCE_CREATED: "Registro de Gasto",
  FINANCE_UPDATED: "Actualización de Gasto",
  FINANCE_APPROVED: "Gasto Aprobado",
  FINANCE_REJECTED: "Gasto Rechazado",
  PAYMENT_QR_GENERATED: "QR de Pago Generado",
  PAYMENTS_CREATED: "Pago Registrado",
  PAYMENTS_VERIFIED: "Pago Verificado",
  PAYMENT_UNAUTHORIZED_YAPE: "Alerta Yape No Autorizado",
  SECURITY: "Control de Acceso",
  SECURITY_ALERT: "Alerta de Seguridad",
  CASHBOX_OPENED: "Apertura de Caja",
  CASHBOX_CLOSED: "Cierre de Caja",
  CASHBOX_BLOCKED_MAJOR_DISCREPANCY: "Caja Bloqueada por Descuadre",
  CASHBOX_DAILY_REPORT_SENT: "Reporte Diario de Caja",
  AUTH_LOGIN: "Inicio de Sesión",
  LOGIN: "Inicio de Sesión",
  LOGOUT: "Cierre de Sesión",
  LOGOUT_ALL: "Cierre de Todas las Sesiones",
  ORDER_CREATED: "Nueva Orden de Trabajo",
  ORDERS_CREATED: "Orden de Trabajo Creada",
  ORDERS_UPDATED: "Orden de Trabajo Actualizada",
  ORDER_STATUS_CHANGED: "Cambio de Estado de OT",
  WORK_ORDER_COMPLETED: "OT Completada",
  VEHICLE_DELIVERED: "Entrega de Vehículo",
  VEHICLES_CREATED: "Vehículo Registrado",
  VEHICLES_UPDATED: "Vehículo Actualizado",
  CLIENTS_CREATED: "Cliente Registrado",
  CLIENTS_UPDATED: "Cliente Actualizado",
  SETTINGS_CREATED: "Configuración Creada",
  SETTINGS_UPDATED: "Configuración Actualizada",
  EXPENSE_APPROVED: "Gasto Aprobado",
  EXPENSE_DISBURSED: "Gasto Desembolsado",
  EXPENSE_REJECTED: "Gasto Rechazado",
  DISCOUNT_APPLIED: "Descuento Aplicado",
  PART_ADDED: "Repuesto Agregado a OT",
  MECHANIC_ASSIGNED: "Mecánico Asignado",
  ATTENDANCE_CHECK_IN: "Entrada Registrada",
  ATTENDANCE_CHECK_OUT: "Salida Registrada",
  VEHICLE_USAGE_AUTHORIZED: "Uso de Vehículo Autorizado",
  PURCHASES_CREATED: "Orden de Compra Creada",
  COMMISSIONS_CREATED: "Comisión Registrada",
  INVOICES_CREATED: "Factura Emitida",
  BACKUP_TRIGGERED: "Backup Automático",
  MONTHLY_INVENTORY_AUDIT: "Auditoría Mensual de Inventario",
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
};

const MODULE_TRANSLATIONS: Record<string, string> = {
  inventory: "Inventario",
  inventory_items: "Inventario",
  InventoryItem: "Inventario",
  InventoryMovement: "Inventario",
  auth: "Seguridad",
  finance: "Finanzas",
  cashbox: "Finanzas",
  cashbox_sessions: "Caja Chica",
  CashboxSession: "Caja Chica",
  orders: "Operaciones",
  work_orders: "Órdenes de Trabajo",
  WorkOrder: "Órdenes de Trabajo",
  payments: "Pagos",
  clients: "Clientes",
  vehicles: "Vehículos",
  personnel: "Personal",
  attendance: "Asistencia",
  settings: "Configuraciones",
  Account: "Seguridad",
  accounts: "Cuentas",
  ExpenseAuthorization: "Finanzas",
  FinancialTransaction: "Transacciones",
  Vehicle: "Vehículos",
  Client: "Clientes",
  System: "Sistema",
  AuditLog: "Auditoría",
  Approval: "Aprobaciones",
  VehicleUsage: "Uso de Vehículo",
  purchases: "Compras",
  commissions: "Comisiones",
  quotes: "Cotizaciones",
  invoices: "Facturación",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: criticalStock } = useCriticalStock();
  const { data: pendingExpenses } = usePendingExpenses();
  const { data: auditLogs } = useAuditLogs({
    page: 1,
    pageSize: 5,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="error">
          Error al cargar el dashboard: {error.message}
        </Alert>
      </Container>
    );
  }

  const dashboardCards = [
    {
      title: "Ordenes Activas",
      value: stats?.activeOrdersCount ?? 0,
      subtitle: "Ordenes en progreso hoy",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      route: "/orders",
    },
    {
      title: "Caja",
      value: stats?.openCashbox ? "Abierta" : "Cerrada",
      subtitle: stats?.openCashbox
        ? `Desde ${new Date(stats.openCashbox.openedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
        : "No hay caja abierta",
      color: stats?.openCashbox
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-red-100 text-red-800 border-red-200",
      route: "/finance",
    },
    {
      title: "Aprobaciones Pendientes",
      value: stats?.pendingApprovalsCount ?? 0,
      subtitle: "Gastos por aprobar",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      route: "/approvals",
    },
    {
      title: "Stock Critico",
      value: stats?.criticalStockCount ?? 0,
      subtitle: "Repuestos bajo minimo",
      color: "bg-red-100 text-red-800 border-red-200",
      route: "/inventory",
    },
  ];

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la clinica automotriz
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(card.route)}
          >
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Caja status detail */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Estado de Caja</h2>
          </CardHeader>
          <CardContent>
            {stats?.openCashbox ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant="success">Abierta</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Abierta por
                  </span>
                  <span className="text-sm font-medium">
                    {stats.openCashbox.openedBy?.name ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Monto inicial
                  </span>
                  <CashAmount amount={stats.openCashbox.initialAmount} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Transacciones
                  </span>
                  <span className="text-sm font-medium">
                    {stats.openCashbox.transactions?.length ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay caja abierta. Dirijase a Finanzas para abrir caja.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/finance")}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Ir a Finanzas
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent audit activity */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Actividad Reciente</h2>
          </CardHeader>
          <CardContent>
            {auditLogs?.data && auditLogs.data.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.data.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
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
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {log.user?.name ?? "Sistema"}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {ACTION_TRANSLATIONS[log.action] || log.action} · {MODULE_TRANSLATIONS[log.entity] || log.entity}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay actividad reciente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical stock alerts */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Alertas de Stock Critico</h2>
          </CardHeader>
          <CardContent>
            {criticalStock && criticalStock.length > 0 ? (
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
                        Stock Actual
                      </th>
                      <th className="py-2 font-medium text-muted-foreground">
                        Stock Minimo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalStock.map((part) => (
                      <tr key={part.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">
                          {part.code}
                        </td>
                        <td className="py-2">{part.name}</td>
                        <td className="py-2">
                          <Badge variant="error">
                            {part.currentStock}
                          </Badge>
                        </td>
                        <td className="py-2">{part.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay alertas de stock critico
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
