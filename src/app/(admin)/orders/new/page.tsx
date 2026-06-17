"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Spinner,
  Container,
  Alert,
  Badge,
  EmptyState,
  Select,
  FormField,
} from "@arellan-hnos-core-ecosystem/ui";
import { api } from "@/lib/api";
import { useClients } from "@/hooks/use-clients";
import { useCreateOrder } from "@/hooks/use-orders";
import { usePersonnel } from "@/hooks/use-personnel";
import { useInventory } from "@/hooks/use-inventory";
import { useUIStore } from "@/stores/ui";

const STEPS = ["Cliente", "Vehículo", "Orden", "Repuestos"] as const;

const ORDER_TYPES = [
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "DIAGNOSTIC", label: "Diagnóstico" },
  { value: "EMERGENCY", label: "Emergencia" },
];

const PRIORITIES = [
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const FUEL_LEVELS = [
  { value: "E", label: "E — Vacío" },
  { value: "1/4", label: "1/4" },
  { value: "1/2", label: "1/2" },
  { value: "3/4", label: "3/4" },
  { value: "F", label: "F — Lleno" },
];

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
}

interface VehicleData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

interface PartSelection {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [step, setStep] = useState(0);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [searchClient, setSearchClient] = useState("");
  const [clientVehicles, setClientVehicles] = useState<VehicleData[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Order form
  const [description, setDescription] = useState("");
  const [orderType, setOrderType] = useState("CORRECTIVE");
  const [priority, setPriority] = useState("NORMAL");
  const [odometer, setOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [mechanicId, setMechanicId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Parts
  const [partsSearch, setPartsSearch] = useState("");
  const [selectedParts, setSelectedParts] = useState<PartSelection[]>([]);
  const [partQty, setPartQty] = useState(1);

  // New client / vehicle modals
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientLast, setNewClientLast] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientDni, setNewClientDni] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newColor, setNewColor] = useState("");
  const [creatingVehicle, setCreatingVehicle] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  const { data: clientResults, isLoading: searchingClients } = useClients(
    searchClient.length >= 2 ? { search: searchClient } : { page: 1, limit: 5 } as any
  );

  const { data: mechanicData } = usePersonnel({ role: "MECHANIC" } as any);
  const mechanics = mechanicData?.data || [];

  const { data: inventoryData } = useInventory(
    partsSearch.length >= 2 ? { search: partsSearch } as any : { limit: 10 } as any
  );
  const inventoryItems = inventoryData?.data || [];

  const loadVehicles = useCallback(async (clientId: string) => {
    setLoadingVehicles(true);
    try {
      const { data } = await api.get(`/vehicles?search=&limit=50`);
      const allVehicles = data?.data || data || [];
      const filtered = Array.isArray(allVehicles)
        ? allVehicles.filter((v: any) => v.clientId === clientId)
        : [];
      setClientVehicles(filtered);
    } catch {
      setClientVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    loadVehicles(client.id);
    setStep(1);
  };

  const handleCreateClient = async () => {
    if (!newClientName || !newClientLast) return;
    setCreatingClient(true);
    try {
      const { data } = await api.post("/clients", {
        firstName: newClientName,
        lastName: newClientLast,
        phone: newClientPhone || undefined,
        dni: newClientDni || undefined,
      });
      setSelectedClient(data);
      loadVehicles(data.id);
      setShowNewClient(false);
      setStep(1);
      addToast({ type: "success", title: "Cliente creado", message: `${data.firstName} ${data.lastName}` });
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message || "No se pudo crear el cliente" });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateVehicle = async () => {
    if (!newPlate || !newBrand || !newModel || !newYear || !selectedClient) return;
    setCreatingVehicle(true);
    try {
      const { data } = await api.post("/vehicles", {
        plate: newPlate,
        brand: newBrand,
        model: newModel,
        year: parseInt(newYear),
        color: newColor || "Blanco",
        clientId: selectedClient.id,
      });
      setSelectedVehicle(data);
      setShowNewVehicle(false);
      setStep(2);
      addToast({ type: "success", title: "Vehículo creado", message: `${data.plate}` });
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message || "No se pudo crear el vehículo" });
    } finally {
      setCreatingVehicle(false);
    }
  };

  const handleSelectVehicle = (v: VehicleData) => {
    setSelectedVehicle(v);
    setStep(2);
  };

  const canAdvanceStep3 = description.trim().length > 0 && mechanicId;

  const addPart = (item: any) => {
    if (selectedParts.find((p) => p.itemId === item.id)) return;
    setSelectedParts([
      ...selectedParts,
      { itemId: item.id, name: item.name, sku: item.sku, quantity: partQty, unitPrice: item.unitPrice || 0 },
    ]);
    setPartsSearch("");
    setPartQty(1);
  };

  const removePart = (itemId: string) => {
    setSelectedParts(selectedParts.filter((p) => p.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle || !description || !mechanicId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        clientId: selectedClient.id,
        vehicleId: selectedVehicle.id,
        mechanicId,
        description,
      };
      const { data } = await api.post("/orders", payload);

      // Add parts if any
      if (selectedParts.length > 0) {
        await Promise.all(
          selectedParts.map((p) =>
            api.post(`/orders/${data.id}/items`, {
              itemId: p.itemId,
              type: "PART",
              quantity: p.quantity,
              description: p.name,
            }).catch(() => {})
          )
        );
      }

      addToast({
        type: "success",
        title: "Orden creada",
        message: `OT ${data.number || data.id} creada correctamente`,
      });
      router.push(`/orders/${data.id}`);
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message || "No se pudo crear la orden" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="full" className="px-4 py-6">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx <= step
                      ? "bg-brand-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-xs mt-1 ${idx <= step ? "text-brand-primary font-semibold" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${idx < step ? "bg-brand-primary" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0 — Select or create client */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Buscar Cliente</h2>
            <p className="text-sm text-gray-500">Busque un cliente existente o cree uno nuevo.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchClient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchClient(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => setShowNewClient(true)}>
                + Nuevo
              </Button>
            </div>

            {searchingClients && searchClient.length >= 2 && (
              <div className="flex justify-center py-4"><Spinner /></div>
            )}

            {clientResults?.data && clientResults.data.length > 0 && (
              <div className="space-y-2">
                {clientResults.data.map((c: ClientData) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectClient(c)}
                  >
                    <div>
                      <p className="font-semibold">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-500">
                        {c.dni && `DNI: ${c.dni}`}{c.dni && c.phone && " · "}{c.phone && `📞 ${c.phone}`}
                      </p>
                    </div>
                    <Badge variant="brand">Seleccionar</Badge>
                  </div>
                ))}
              </div>
            )}

            {searchClient.length >= 2 && !searchingClients && (!clientResults?.data || clientResults.data.length === 0) && (
              <EmptyState
                title="Sin resultados"
                description={`No se encontraron clientes para "${searchClient}". Cree uno nuevo.`}
                action={
                  <Button variant="outline" onClick={() => setShowNewClient(true)}>
                    Crear cliente
                  </Button>
                }
              />
            )}

            {/* New client inline form */}
            {showNewClient && (
              <div className="border rounded-lg p-4 space-y-3 mt-4">
                <h3 className="font-semibold text-sm">Nuevo Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Nombre" required>
                    <Input value={newClientName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)} placeholder="Nombres" />
                  </FormField>
                  <FormField label="Apellido" required>
                    <Input value={newClientLast} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientLast(e.target.value)} placeholder="Apellidos" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Teléfono">
                    <Input value={newClientPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientPhone(e.target.value)} placeholder="987654321" />
                  </FormField>
                  <FormField label="DNI">
                    <Input value={newClientDni} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientDni(e.target.value)} placeholder="12345678" />
                  </FormField>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowNewClient(false)}>Cancelar</Button>
                  <Button onClick={handleCreateClient} disabled={creatingClient}>
                    {creatingClient ? <Spinner size="sm" /> : "Crear y continuar"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 1 — Select or create vehicle */}
      {step === 1 && selectedClient && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Vehículo del Cliente</h2>
                <p className="text-sm text-gray-500">
                  {selectedClient.firstName} {selectedClient.lastName}
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowNewVehicle(true)}>
                + Agregar vehículo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingVehicles ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : clientVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clientVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 border rounded-lg cursor-pointer hover:border-brand-primary hover:bg-blue-50/30"
                    onClick={() => handleSelectVehicle(v)}
                  >
                    <p className="font-bold text-lg">{v.plate}</p>
                    <p className="text-sm text-gray-600">{v.brand} {v.model} {v.year}</p>
                    <p className="text-xs text-gray-400">{v.color}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin vehículos"
                description="Este cliente no tiene vehículos registrados. Agregue uno."
              />
            )}

            {/* New vehicle inline form */}
            {showNewVehicle && (
              <div className="border rounded-lg p-4 space-y-3 mt-4">
                <h3 className="font-semibold text-sm">Nuevo Vehículo</h3>
                <FormField label="Placa" required>
                  <Input value={newPlate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlate(e.target.value.toUpperCase())} placeholder="ABC-123" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Marca" required>
                    <Input value={newBrand} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBrand(e.target.value)} placeholder="Toyota" />
                  </FormField>
                  <FormField label="Modelo" required>
                    <Input value={newModel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewModel(e.target.value)} placeholder="Corolla" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Año" required>
                    <Input value={newYear} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewYear(e.target.value)} placeholder="2020" />
                  </FormField>
                  <FormField label="Color">
                    <Input value={newColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColor(e.target.value)} placeholder="Blanco" />
                  </FormField>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowNewVehicle(false)}>Cancelar</Button>
                  <Button onClick={handleCreateVehicle} disabled={creatingVehicle}>
                    {creatingVehicle ? <Spinner size="sm" /> : "Crear y continuar"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>← Anterior</Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2 — Order details */}
      {step === 2 && selectedVehicle && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Datos de la Orden</h2>
            <p className="text-sm text-gray-500">{selectedVehicle.plate} — {selectedVehicle.brand} {selectedVehicle.model}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Descripción del servicio" required>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[100px] text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa el trabajo a realizar..."
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo de orden">
                <Select value={orderType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrderType(e.target.value)} options={ORDER_TYPES} />
              </FormField>
              <FormField label="Prioridad">
                <Select value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)} options={PRIORITIES} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kilometraje">
                <Input value={odometer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOdometer(e.target.value)} placeholder="45000" type="number" />
              </FormField>
              <FormField label="Nivel de combustible">
                <Select value={fuelLevel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFuelLevel(e.target.value)} options={FUEL_LEVELS} />
              </FormField>
            </div>

            <FormField label="Mecánico asignado" required>
              <Select value={mechanicId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMechanicId(e.target.value)} options={[
                { value: "", label: "Seleccionar mecánico..." },
                ...mechanics.map((m: any) => ({ value: m.id, label: `${m.name} (${m.role})` })),
              ]} />
            </FormField>

            <FormField label="Notas del cliente">
              <textarea
                className="w-full border rounded-lg p-3 min-h-[60px] text-sm"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Anterior</Button>
            <Button onClick={() => setStep(3)} disabled={!canAdvanceStep3}>
              Siguiente →
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3 — Optional parts */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Repuestos Iniciales</h2>
            <p className="text-sm text-gray-500">Opcional — Busque y agregue repuestos a la orden.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar repuesto por nombre..."
                value={partsSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartsSearch(e.target.value)}
                className="flex-1"
              />
            </div>

            {partsSearch.length >= 2 && inventoryItems.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {inventoryItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => addPart(item)}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400">SKU: {item.sku} · Stock: {item.currentStock ?? item.stock}</p>
                    </div>
                    <Badge variant="brand">+ Agregar</Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedParts.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Repuestos seleccionados ({selectedParts.length})</p>
                <div className="space-y-2">
                  {selectedParts.map((p) => (
                    <div key={p.itemId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-400">x{p.quantity} · S/ {p.unitPrice.toFixed(2)} c/u</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removePart(p.itemId)}>✕</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Anterior</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSubmit} disabled={submitting}>
                Sin repuestos, crear orden
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : "Crear orden"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </Container>
  );
}
