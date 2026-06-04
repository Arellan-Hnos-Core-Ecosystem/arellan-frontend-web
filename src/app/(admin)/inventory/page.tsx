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
  Modal,
  FormField,
  EmptyState,
  DataTable,
  Pagination,
  Select,
} from "@arellan-hnos-core-ecosystem/ui";
import { useInventory, useCreatePart } from "@/hooks/use-inventory";
import type { InventoryFilters } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const partSchema = z.object({
  code: z.string().min(1, "El codigo es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  currentStock: z.coerce.number().min(0, "No puede ser negativo"),
  minStock: z.coerce.number().min(0, "No puede ser negativo"),
  costPrice: z.coerce.number().min(0, "No puede ser negativo"),
  salePrice: z.coerce.number().min(0, "No puede ser negativo"),
  category: z.string().nullable().optional(),
});

type PartFormData = z.infer<typeof partSchema>;

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, error } = useInventory(filters);
  const createPart = useCreatePart();

  const form = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      code: "",
      name: "",
      description: null,
      brand: null,
      currentStock: 0,
      minStock: 10,
      costPrice: 0,
      salePrice: 0,
      category: null,
    },
  });

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1,
    }));
  };

  const handleLowStockFilter = (show: boolean) => {
    setFilters((prev) => ({
      ...prev,
      lowStock: show || undefined,
      page: 1,
    }));
  };

  const handleCreatePart = async (formData: PartFormData) => {
    await createPart.mutateAsync({
      code: formData.code,
      name: formData.name,
      description: formData.description ?? null,
      brand: formData.brand ?? null,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      costPrice: formData.costPrice,
      salePrice: formData.salePrice,
      category: formData.category ?? null,
    });
    setShowAddModal(false);
    form.reset();
  };

  const columns = [
    {
      key: "code",
      header: "Codigo",
      render: (part: { code: string }) => (
        <span className="font-mono text-xs font-medium">{part.code}</span>
      ),
    },
    {
      key: "name",
      header: "Repuesto",
      render: (part: { name: string; brand: string | null }) => (
        <div>
          <span className="font-medium">{part.name}</span>
          {part.brand && (
            <span className="ml-1 text-xs text-muted-foreground">
              · {part.brand}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "currentStock",
      header: "Stock",
      render: (part: { currentStock: number; minStock: number }) => {
        const isLow = part.currentStock <= part.minStock;
        return (
          <Badge variant={isLow ? "error" : "success"}>
            {part.currentStock}
            {isLow && (
              <span className="ml-1 text-xs">(min: {part.minStock})</span>
            )}
          </Badge>
        );
      },
    },
    {
      key: "costPrice",
      header: "Costo",
      render: (part: { costPrice: number }) => (
        <span>S/ {Number(part.costPrice || 0).toFixed(2)}</span>
      ),
    },
    {
      key: "salePrice",
      header: "Venta",
      render: (part: { salePrice: number }) => (
        <span className="font-medium">S/ {Number(part.salePrice || 0).toFixed(2)}</span>
      ),
    },
    {
      key: "category",
      header: "Categoria",
      render: (part: { category: string | null }) => (
        <span className="text-xs">
          {part.category ?? "Sin categoria"}
        </span>
      ),
    },
  ];

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de repuestos y stock
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          + Nuevo Repuesto
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por codigo o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filters.lowStock ? "primary" : "outline"}
                size="sm"
                onClick={() => handleLowStockFilter(!filters.lowStock)}
              >
                Stock Critico
              </Button>
              <Button variant="outline" onClick={handleSearch}>
                Buscar
              </Button>
            </div>
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
          Error al cargar el inventario: {error.message}
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
          title="Sin repuestos"
          description="No se encontraron repuestos en el inventario"
          action={
            <Button onClick={() => setShowAddModal(true)}>
              Agregar primer repuesto
            </Button>
          }
        />
      )}

      {/* Add part modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nuevo Repuesto"
      >
        <form
          onSubmit={form.handleSubmit(handleCreatePart)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Codigo"
              error={form.formState.errors.code?.message}
            >
              <Input id="codigo" {...form.register("code")} placeholder="REP-001" />
            </FormField>
            <FormField
              label="Categoria"
              error={form.formState.errors.category?.message}
            >
              <Input
                id="categoria"
                {...form.register("category")}
                placeholder="Motor, Frenos..."
              />
            </FormField>
          </div>

          <FormField
            label="Nombre"
            error={form.formState.errors.name?.message}
          >
            <Input id="nombre" {...form.register("name")} placeholder="Nombre del repuesto" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Marca"
              error={form.formState.errors.brand?.message}
            >
              <Input id="marca" {...form.register("brand")} placeholder="Marca (opcional)" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Stock Actual"
              error={form.formState.errors.currentStock?.message}
            >
              <Input
                id="stock-actual"
                {...form.register("currentStock")}
                type="number"
                min="0"
              />
            </FormField>
            <FormField
              label="Stock Minimo"
              error={form.formState.errors.minStock?.message}
            >
              <Input
                id="stock-minimo"
                {...form.register("minStock")}
                type="number"
                min="0"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Precio Costo (S/)"
              error={form.formState.errors.costPrice?.message}
            >
              <Input
                id="precio-costo"
                {...form.register("costPrice")}
                type="number"
                min="0"
                step="0.01"
              />
            </FormField>
            <FormField
              label="Precio Venta (S/)"
              error={form.formState.errors.salePrice?.message}
            >
              <Input
                id="precio-venta"
                {...form.register("salePrice")}
                type="number"
                min="0"
                step="0.01"
              />
            </FormField>
          </div>

          <FormField
            label="Descripcion (opcional)"
            error={form.formState.errors.description?.message}
          >
            <textarea
              id="descripcion"
              {...form.register("description")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Descripcion del repuesto..."
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createPart.isPending}>
              {createPart.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </Container>
  );
}
