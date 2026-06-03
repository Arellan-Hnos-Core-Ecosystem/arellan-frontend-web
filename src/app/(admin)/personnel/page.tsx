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
  Modal,
  FormField,
  Select,
} from "@arellan-hnos-core-ecosystem/ui";
import { usePersonnel } from "@/hooks/use-personnel";
import type { PersonnelFilters, UserRole, AccountStatus } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const roleLabels: Record<UserRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  FINANCE: "Finanzas",
  MECHANIC: "Mecanico",
  RECEPTIONIST: "Recepcionista",
};

const statusLabels: Record<AccountStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
};

const statusVariants: Record<
  AccountStatus,
  "success" | "warning" | "error"
> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  SUSPENDED: "error",
};

export default function PersonnelPage() {
  const [filters, setFilters] = useState<PersonnelFilters>({
    page: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = usePersonnel(filters);

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
      render: (person: { name: string; email: string }) => (
        <div>
          <span className="font-medium">{person.name}</span>
          <p className="text-xs text-muted-foreground">{person.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (person: { role: UserRole }) => (
        <Badge variant="brand">
          {roleLabels[person.role] ?? person.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (person: { status: AccountStatus }) => (
        <Badge variant={statusVariants[person.status]}>
          {statusLabels[person.status]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Registro",
      render: (person: { createdAt: string }) =>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={filters.role ?? "ALL"}
              onChange={(e) =>
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
    </Container>
  );
}
