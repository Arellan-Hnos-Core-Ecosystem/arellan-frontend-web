"use client";

import { useState, useEffect } from "react";
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
  CashAmount,
  Modal,
  FormField,
  EmptyState,
  Select,
} from "@arellan-hnos-core-ecosystem/ui";
import {
  useTodayCashbox,
  useOpenCashbox,
  useCloseCashbox,
  useExpenses,
  usePendingExpenses,
} from "@/hooks/use-finance";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";

export default function FinancePage() {
  const router = useRouter();
  const { data: cashbox, isLoading, error } = useTodayCashbox();
  const { data: pendingExpenses } = usePendingExpenses();
  const openCashbox = useOpenCashbox();
  const closeCashbox = useCloseCashbox();
  const [expensePage, setExpensePage] = useState(1);
  const { data: expenses } = useExpenses({
    page: expensePage,
    pageSize: 10,
  });

  const [activeTab, setActiveTab] = useState<"caja" | "comisiones" | "dashboard">("caja");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");

  // Comisiones
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commStatusFilter, setCommStatusFilter] = useState("");

  // Cashflow dashboard
  const [cashflow, setCashflow] = useState<any>(null);
  const [loadingCashflow, setLoadingCashflow] = useState(false);

  useEffect(() => {
    if (activeTab === "comisiones") loadCommissions();
    if (activeTab === "dashboard") loadCashflow();
  }, [activeTab]);

  const loadCommissions = async (status?: string) => {
    setLoadingCommissions(true);
    try {
      const params = status ? { status } : {};
      const { data } = await api.get("/finance/commissions", { params });
      setCommissions(data?.data || []);
    } catch { setCommissions([]); }
    finally { setLoadingCommissions(false); }
  };

  const loadCashflow = async () => {
    setLoadingCashflow(true);
    try {
      const { data } = await api.get("/finance/cashflow");
      setCashflow(data);
    } catch { setCashflow(null); }
    finally { setLoadingCashflow(false); }
  };

  const handleOpenCashbox = async () => {
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount < 0) return;
    await openCashbox.mutateAsync({ initialAmount: amount });
    setShowOpenModal(false);
    setInitialAmount("");
  };

  const handleCloseCashbox = async () => {
    const amount = parseFloat(finalAmount);
    if (isNaN(amount) || amount < 0) return;
    await closeCashbox.mutateAsync({ finalAmount: amount });
    setShowCloseModal(false);
    setFinalAmount("");
  };

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
          Error al cargar datos financieros: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-sm text-muted-foreground">
          Gestion de caja y gastos
        </p>
      </div>

      {/* Cashbox status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Estado de Caja</h2>
              {cashbox ? (
                <Badge variant="success">Abierta</Badge>
              ) : (
                <Badge variant="error">Cerrada</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cashbox ? (
              <>
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    Monto Inicial
                  </span>
                  <CashAmount amount={cashbox.initialAmount} />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    Transacciones Hoy
                  </span>
                  <span className="font-medium">
                    {cashbox.transactions?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    Abierta por
                  </span>
                  <span className="font-medium">
                    {cashbox.openedBy?.name ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    Abierta desde
                  </span>
                  <span className="font-medium">
                    {new Date(cashbox.openedAt).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <Button
                  className="w-full"
                  variant="danger"
                  onClick={() => setShowCloseModal(true)}
                >
                  Cerrar Caja
                </Button>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  La caja esta cerrada. Abrala para iniciar operaciones del dia.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setShowOpenModal(true)}
                >
                  Abrir Caja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gastos Pendientes</h2>
              {pendingExpenses && pendingExpenses.length > 0 && (
                <Badge variant="warning">{pendingExpenses.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingExpenses && pendingExpenses.length > 0 ? (
              <div className="space-y-3">
                {pendingExpenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {expense.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.requestedBy?.name ?? "N/A"} ·{" "}
                          {expense.category}
                        </p>
                      </div>
                      <CashAmount
                        amount={expense.amount}
                        className="text-sm font-bold"
                      />
                    </div>
                  </div>
                ))}
                {pendingExpenses.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{pendingExpenses.length - 5} gastos pendientes mas
                  </p>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay gastos pendientes de aprobacion
              </p>
            )}
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => router.push("/approvals")}
              >
                Ver todas las aprobaciones
              </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions list */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Transacciones del Dia</h2>
        </CardHeader>
        <CardContent>
          {expenses?.data && expenses.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium text-muted-foreground">Descripcion</th>
                    <th className="py-2 font-medium text-muted-foreground">Categoria</th>
                    <th className="py-2 font-medium text-muted-foreground">Monto</th>
                    <th className="py-2 font-medium text-muted-foreground">Estado</th>
                    <th className="py-2 font-medium text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.data.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0">
                      <td className="py-2">{expense.description}</td>
                      <td className="py-2">{expense.category}</td>
                      <td className="py-2"><CashAmount amount={expense.amount} /></td>
                      <td className="py-2">
                        <Badge variant={expense.status === "APPROVED" ? "success" : expense.status === "REJECTED" ? "error" : "warning"}>
                          {expense.status === "APPROVED" ? "Aprobado" : expense.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(expense.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No hay transacciones registradas hoy</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Comisiones + Dashboard histórico */}
      <div className="mt-6">
        <div className="flex gap-2 border-b mb-4">
          {(["caja", "comisiones", "dashboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "caja" ? "Caja" : tab === "comisiones" ? "Comisiones" : "Dashboard"}
            </button>
          ))}
        </div>

        {activeTab === "comisiones" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Comisiones</h2>
                  <p className="text-sm text-muted-foreground">Comisiones por importaciones y servicios</p>
                </div>
                <Select value={commStatusFilter} onChange={(e) => { setCommStatusFilter(e.target.value); loadCommissions(e.target.value || undefined); }} options={[
                  { value: "", label: "Todos los estados" },
                  { value: "PENDING", label: "Pendiente" },
                  { value: "APPROVED", label: "Aprobado" },
                  { value: "REJECTED", label: "Rechazado" },
                ]} />
              </div>
            </CardHeader>
            <CardContent>
              {loadingCommissions ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium text-muted-foreground">Personal</th>
                        <th className="py-2 font-medium text-muted-foreground">Proveedor</th>
                        <th className="py-2 font-medium text-muted-foreground">Monto</th>
                        <th className="py-2 font-medium text-muted-foreground">Tipo</th>
                        <th className="py-2 font-medium text-muted-foreground">Estado</th>
                        <th className="py-2 font-medium text-muted-foreground">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2">{c.personnel?.firstName} {c.personnel?.lastName}</td>
                          <td className="py-2">{c.supplier?.name || "—"}</td>
                          <td className="py-2"><CashAmount amount={c.amount} /></td>
                          <td className="py-2">
                            <Badge variant={c.type === "IMPORT" ? "error" : "brand"}>{c.type === "IMPORT" ? "Importación" : c.type}</Badge>
                          </td>
                          <td className="py-2">
                            <Badge variant={c.status === "APPROVED" ? "success" : c.status === "REJECTED" ? "error" : "warning"}>
                              {c.status === "APPROVED" ? "Aprobado" : c.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                            </Badge>
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("es-PE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="Sin comisiones" description="No hay comisiones registradas." />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "dashboard" && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Dashboard Histórico</h2>
              <p className="text-sm text-muted-foreground">Ingresos vs Egresos</p>
            </CardHeader>
            <CardContent>
              {loadingCashflow ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : cashflow ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <p className="text-sm text-green-600">Ingresos Totales</p>
                      <CashAmount amount={cashflow.totalIn} className="text-2xl font-bold text-green-700" />
                    </div>
                    <div className="rounded-lg bg-red-50 p-4 text-center">
                      <p className="text-sm text-red-600">Egresos Totales</p>
                      <CashAmount amount={cashflow.totalOut} className="text-2xl font-bold text-red-700" />
                    </div>
                    <div className={`rounded-lg p-4 text-center ${cashflow.net >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                      <p className="text-sm text-blue-600">Neto</p>
                      <CashAmount amount={cashflow.net} className="text-2xl font-bold" />
                    </div>
                  </div>
                  {/* Payment methods breakdown */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">Ingresos por método</p>
                      {Object.entries(cashflow.inflows || {}).map(([method, data]: [string, any]) => (
                        <div key={method} className="flex justify-between text-sm py-1">
                          <span>{method}</span>
                          <span className="font-medium">{data.count}x · S/ {Number(data.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Egresos por método</p>
                      {Object.entries(cashflow.outflows || {}).map(([method, data]: [string, any]) => (
                        <div key={method} className="flex justify-between text-sm py-1">
                          <span>{method}</span>
                          <span className="font-medium">{data.count}x · S/ {Number(data.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState title="Sin datos" description="No hay datos de cashflow disponibles." />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Open cashbox modal */}
      <Modal
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Abrir Caja"
      >
        <div className="space-y-4">
          <FormField label="Monto Inicial (S/)">
            <Input
              type="number"
              placeholder="0.00"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowOpenModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOpenCashbox}
              disabled={openCashbox.isPending || !initialAmount}
            >
              {openCashbox.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Abrir Caja
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close cashbox modal */}
      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Cerrar Caja"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ingrese el monto final contado en caja para verificar el cuadre.
          </p>
          <FormField label="Monto Final Contado (S/)">
            <Input
              type="number"
              placeholder="0.00"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCloseModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleCloseCashbox}
              disabled={closeCashbox.isPending || !finalAmount}
            >
              {closeCashbox.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Cerrar Caja
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
}
