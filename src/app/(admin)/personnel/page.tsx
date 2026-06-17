"use client";

import { useState, useEffect } from "react";
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
import { usePersonnel } from "@/hooks/use-personnel";
import { api } from "@/lib/api";
import type { PersonnelFilters, UserRole, AccountStatus } from "@/types";

const roleLabels: Record<UserRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  FINANCE: "Finanzas",
  MECHANIC: "Mecanico",
  TRAINEE: "Aprendiz",
  CLIENT: "Cliente",
};

const statusLabels: Record<AccountStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  TERMINATED: "Desvinculado",
};

const statusVariants: Record<
  AccountStatus,
  "success" | "warning" | "error"
> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  TERMINATED: "error",
};

export default function PersonnelPage() {
  const [filters, setFilters] = useState<PersonnelFilters>({
    page: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [activeUsages, setActiveUsages] = useState<any[]>([]);
  const [overdueUsages, setOverdueUsages] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const { data, isLoading, error } = usePersonnel(filters);

  useEffect(() => {
    Promise.all([
      api.get("/personnel/attendance/today").then(r => r.data).catch(() => ({ records: [] })),
      api.get("/personnel/vehicle-usage/active").then(r => r.data).catch(() => []),
      api.get("/personnel/vehicle-usage/overdue").then(r => r.data).catch(() => []),
    ]).then(([attData, activeData, overdueData]) => {
      setAttendance(attData?.records || attData?.data || []);
      setActiveUsages(Array.isArray(activeData) ? activeData : activeData?.data || []);
      setOverdueUsages(Array.isArray(overdueData) ? overdueData : overdueData?.data || []);
    }).finally(() => setLoadingExtras(false));
  }, []);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1,
    }));
  };

  const handleRoleFilter = (role: UserRole | "ALL") => {
    setFilters((prev) => ({
      ...prev,
      role: role === "ALL" ? undefined : role,
      page: 1,
    }));
  };

  const columns = [
    {
      key: "name",
      header: "Nombre",
      accessor: (person: { name: string; email: string }) => (
        <div>
          <span className="font-medium">{person.name}</span>
          <p className="text-xs text-muted-foreground">{person.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      accessor: (person: { role: UserRole }) => (
        <Badge variant="brand">
          {roleLabels[person.role] ?? person.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (person: { status: AccountStatus }) => (
        <Badge variant={statusVariants[person.status]}>
          {statusLabels[person.status]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Registro",
      accessor: (person: { createdAt: string }) =>
        new Date(person.createdAt).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
  ];

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal</h1>
          <p className="text-sm text-muted-foreground">
            Gestion del personal de la clinica
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={filters.role ?? "ALL"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleRoleFilter(e.target.value as UserRole | "ALL")
              }
              options={[
                { value: "ALL", label: "Todos los roles" },
                ...Object.entries(roleLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
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
          Error al cargar el personal: {error.message}
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
          title="Sin personal"
          description="No se encontro personal registrado"
        />
      )}

      {/* Asistencias del día */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Asistencia Hoy</h2>
          <p className="text-sm text-muted-foreground">Registros de entrada y salida del personal</p>
        </CardHeader>
        <CardContent>
          {loadingExtras ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : attendance.length > 0 ? (
            <div className="space-y-2">
              {attendance.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {a.personnel?.firstName} {a.personnel?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{a.personnel?.position}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>Entrada: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString("es-PE") : "—"}</p>
                    <p>Salida: {a.checkOut ? new Date(a.checkOut).toLocaleTimeString("es-PE") : "—"}</p>
                    <Badge variant={a.type === "PRESENT" ? "success" : a.type === "LATE" ? "warning" : "error"} className="mt-1 text-xs">
                      {a.type === "PRESENT" ? "Presente" : a.type === "LATE" ? "Tarde" : a.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin registros de asistencia para hoy.</p>
          )}
        </CardContent>
      </Card>

      {/* Uso de vehículos del taller */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Vehículos del Taller en Uso</h2>
          <p className="text-sm text-muted-foreground">Personal usando vehículos de la flota</p>
        </CardHeader>
        <CardContent>
          {loadingExtras ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <>
              {overdueUsages.length > 0 && (
                <Alert variant="error" className="mb-4">
                  <p className="font-semibold">⚠️ {overdueUsages.length} vehículo(s) con retorno vencido</p>
                  {overdueUsages.map((u: any) => (
                    <p key={u.id} className="text-xs mt-1">
                      {u.vehicle?.plate} — {u.personnel?.firstName} {u.personnel?.lastName} — Retorno esperado: {new Date(u.expectedReturn).toLocaleString("es-PE")}
                    </p>
                  ))}
                </Alert>
              )}
              {activeUsages.length > 0 ? (
                <div className="space-y-2">
                  {activeUsages.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{u.vehicle?.plate} — {u.vehicle?.brand} {u.vehicle?.model}</p>
                        <p className="text-xs text-gray-400">{u.personnel?.firstName} {u.personnel?.lastName} · {u.purpose}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Salida: {new Date(u.checkoutAt).toLocaleTimeString("es-PE")}</p>
                        <p>Retorno: {new Date(u.expectedReturn).toLocaleString("es-PE")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No hay vehículos del taller en uso actualmente.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
