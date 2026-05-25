# arellan-frontend-web

Panel administrativo web de la Clínica Automotriz Arellan Hnos. Interfaz principal para gerencia, administración y finanzas. Acceso desde laptop y tablet de oficina.

## Descripción

`arellan-frontend-web` es la plataforma central de gestión para los roles `owner`, `admin` y `finance`. Desde aquí se controlan órdenes de trabajo, inventario, finanzas, personal y auditoría. Consume exclusivamente la API de `arellan-platform`.

## Audiencia

| Rol | Usuario | Acceso |
|-----|---------|--------|
| `owner` | Edgar, Juan | Acceso total — todas las secciones |
| `admin` | Ana | OTs, clientes, inventario, personal — sin finanzas sensibles |
| `finance` | Hija (encargada de finanzas) | Módulo financiero completo |

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ con TypeScript |
| Estilos | Tailwind CSS + `@arellan/ui` (design system propio) |
| Estado global | Zustand |
| Fetching / caché | TanStack Query (React Query v5) |
| Formularios | React Hook Form + Zod |
| Routing | Next.js App Router |
| Testing | Vitest + React Testing Library |
| Build | Turbopack |

## Estructura de Carpetas

```
src/
├── app/
│   └── (admin)/
│       ├── dashboard/          # Resumen ejecutivo del día
│       ├── orders/             # Gestión de OTs
│       ├── inventory/          # Stock, movimientos, alertas
│       ├── finance/            # Caja, ingresos, egresos, aprobaciones
│       ├── clients/            # Clientes y vehículos
│       ├── personnel/          # Personal, roles, asistencia
│       ├── approvals/          # Panel de autorizaciones pendientes
│       ├── audit/              # Audit log con filtros
│       └── settings/           # Configuración del sistema
├── features/
│   ├── caja/                   # Apertura, cierre, conciliación diaria
│   ├── autorizaciones/         # Flujo de aprobaciones por umbral
│   ├── ot/                     # Ciclo de vida de órdenes de trabajo
│   ├── inventario/             # Kardex, reservas, alertas de stock
│   ├── vehiculos/              # Ficha técnica, control de uso
│   ├── rrhh/                   # Asistencia, incidencias, roles
│   ├── clientes/               # Historial y vehículos asociados
│   └── auditoria/              # Visualización de audit logs
├── components/
│   ├── layout/                 # Sidebar, topbar, breadcrumbs
│   └── shared/                 # Componentes locales del admin
├── hooks/                      # useAuth, useOrders, useInventory...
├── stores/                     # Zustand: auth, ui, notifications
├── lib/
│   └── api/                    # Clientes HTTP hacia arellan-platform
└── types/                      # Interfaces TypeScript del dominio
```

## Módulos MVP

- **Dashboard ejecutivo** — métricas del día, alertas activas, actividad reciente
- **Gestión de OTs** — lista, detalle, creación, seguimiento por estado
- **Inventario** — stock actual, movimientos, alertas de nivel mínimo
- **Finanzas** — caja diaria, ingresos/egresos, gastos pendientes de aprobación
- **Personal** — roles, permisos, registros de movimiento y asistencia
- **Autorizaciones** — panel de aprobaciones pendientes (gastos, salidas, solicitudes de repuestos)
- **Auditoría** — log filtrable por usuario, módulo y fecha
- **Clientes y vehículos** — ficha completa con historial de servicios

## Módulos Fase 2

- Reportes exportables (PDF, Excel) — finanzas mensual, inventario, OTs cerradas
- Cotizaciones con plantillas y conversión automática a OT
- Panel de importaciones con historial y margen de comisión declarado
- Calendario de vencimientos (seguros, contratos, mantenimientos programados)

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://api.arellan.pe
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

## Scripts de Desarrollo

```bash
npm install
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run test         # Correr tests
npm run lint         # ESLint
npm run type-check   # TypeScript check sin emit
```

## Dominio

`app.arellan.pe` — Panel administrativo (acceso restringido, requiere VPN o IP whitelist en producción)

## Repos Relacionados

- `arellan-platform` — API REST que consume este frontend
- `arellan-design-system` — Componentes `@arellan/ui` que usa
- `arellan-mobile-app` — Complemento móvil para aprobaciones en tiempo real

## Licencia

Privado — © 2026 Arellan Hnos. Todos los derechos reservados.
