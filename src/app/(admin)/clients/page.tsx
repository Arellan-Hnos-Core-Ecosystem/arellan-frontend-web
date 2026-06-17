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
  Pagination,
  EmptyState,
} from "@arellan-hnos-core-ecosystem/ui";
import { useClients } from "@/hooks/use-clients";
import type { ClientFilters } from "@/types";

export default function ClientsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useClients(filters);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1,
    }));
  };

  const columns = [
    {
      key: "firstName",
      header: "Nombre",
      accessor: (client: { firstName: string; lastName: string }) => (
        <span className="font-medium">
          {client.firstName} {client.lastName}
        </span>
      ),
    },
    {
      key: "dni",
      header: "DNI",
      accessor: (client: { dni: string }) => (
        <span className="font-mono text-sm">{client.dni}</span>
      ),
    },
    {
      key: "phone",
      header: "Telefono",
      accessor: (client: { phone: string }) => client.phone,
    },
    {
      key: "email",
      header: "Email",
      accessor: (client: { email: string | null }) =>
        client.email ?? <span className="text-muted-foreground">-</span>,
    },
    {
      key: "vehicles",
      header: "Vehiculos",
      accessor: (client: { vehicles: unknown[] }) => (
        <Badge variant="brand">{client.vehicles?.length ?? 0}</Badge>
      ),
    },
  ];

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de clientes registrados
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
              />
            </div>
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
          Error al cargar los clientes: {error.message}
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
          title="Sin clientes"
          description="No se encontraron clientes registrados"
        />
      )}
    </Container>
  );
}
