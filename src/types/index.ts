export type UserRole = "OWNER" | "ADMIN" | "FINANCE" | "MECHANIC" | "TRAINEE" | "CLIENT";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export type OrderStatus =
  | "RECEIVED"
  | "IN_DIAGNOSIS"
  | "BUDGETED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "CASH" | "YAPE" | "PLIN" | "TRANSFER" | "CARD";

export type MovementType = "IN" | "OUT";

export type ExpenseStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISBURSED";

export type CashboxStatus = "OPEN" | "CLOSED";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT";

export type AuditEntity =
  | "ORDER"
  | "CLIENT"
  | "VEHICLE"
  | "EXPENSE"
  | "INVENTORY"
  | "CASHBOX"
  | "ACCOUNT"
  | "PART"
  | "PHOTO";

export interface Account {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  vehicles: Vehicle[];
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string | null;
  clientId: string;
  client?: Client;
  orders: Order[];
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  description: string;
  observations: string | null;
  clientId: string;
  client: Client;
  vehicleId: string;
  vehicle: Vehicle;
  mechanicId: string | null;
  mechanic: Account | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  parts: OrderPart[];
  photos: OrderPhoto[];
  expenses: Expense[];
  timeline: OrderTimelineEntry[];
}

export interface OrderPart {
  id: string;
  orderId: string;
  partId: string;
  part: Part;
  quantity: number;
  unitPrice: number;
}

export interface OrderPhoto {
  id: string;
  orderId: string;
  url: string;
  description: string | null;
  createdAt: string;
}

export interface OrderTimelineEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  comment: string | null;
  changedById: string;
  changedBy?: Account;
  createdAt: string;
}

export interface Part {
  id: string;
  code: string;
  name: string;
  description: string | null;
  brand: string | null;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  partId: string;
  part: Part;
  type: MovementType;
  quantity: number;
  reason: string;
  orderId: string | null;
  createdById: string;
  createdBy?: Account;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  status: ExpenseStatus;
  category: string;
  orderId: string | null;
  order?: Order | null;
  requestedById: string;
  requestedBy: Account;
  approvedById: string | null;
  approvedBy: Account | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashboxSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  finalAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashboxStatus;
  openedById: string;
  openedBy: Account;
  closedById: string | null;
  closedBy: Account | null;
  transactions: CashboxTransaction[];
}

export interface CashboxTransaction {
  id: string;
  sessionId: string;
  description: string;
  amount: number;
  type: MovementType;
  orderId: string | null;
  createdAt: string;
  createdById: string;
  createdBy?: Account;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes: Record<string, unknown> | null;
  userId: string;
  user: Account;
  ipAddress: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  activeOrdersCount: number;
  openCashbox: CashboxSession | null;
  pendingApprovalsCount: number;
  criticalStockCount: number;
  recentAuditLogs: AuditLog[];
}

export interface AuthResponse {
  user: Account;
  accessToken: string;
  refreshToken: string;
  mfaPending?: boolean;
  sessionToken?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MfaRequest {
  code: string;
  mfaToken: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryFilters {
  search?: string;
  lowStock?: boolean;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ClientFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PersonnelFilters {
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FinanceFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
