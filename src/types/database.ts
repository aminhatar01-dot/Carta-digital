export type UserRole = "super_admin" | "admin" | "mozo" | "cocina" | "caja";
export type SubscriptionStatus = "active" | "past_due" | "suspended" | "canceled";
export type TableStatus = "libre" | "ocupada" | "por_cobrar";
export type OrderType = "salon" | "mostrador" | "delivery" | "retiro";
export type OrderSource = "mozo" | "qr";
export type OrderStatus = "pendiente" | "en_preparacion" | "lista" | "entregada" | "cancelada";
export type PaymentMethod = "efectivo" | "tarjeta" | "mercadopago" | "transferencia";
export type ReservationStatus = "confirmada" | "cancelada" | "no_show" | "completada";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  opening_hours: string | null;
  waiter_call_enabled: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  status: SubscriptionStatus;
  mp_preapproval_id: string | null;
  amount: number;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  amount: number;
  status: string;
  mp_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Zone {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  name: string;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  zone_id: string | null;
  number: number;
  capacity: number;
  status: TableStatus;
  qr_token: string;
  opened_at: string | null;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  sort_order: number;
  created_at: string;
}

export interface MenuItemAddon {
  id: string;
  tenant_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  table_id: string | null;
  order_type: OrderType;
  source: OrderSource;
  status: OrderStatus;
  customer_name: string | null;
  notes: string | null;
  total: number;
  paid: boolean;
  delayed: boolean;
  created_at: string;
  started_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  tenant_id: string;
  addon_name: string;
  price: number;
}

export interface OrderPayment {
  id: string;
  tenant_id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  cash_closure_id: string | null;
  paid_at: string;
  created_by: string | null;
}

export interface CashClosure {
  id: string;
  tenant_id: string;
  opened_at: string;
  closed_at: string | null;
  total_efectivo: number;
  total_otros: number;
  totals_by_method: Record<string, number>;
  closed_by: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  customer_name: string;
  phone: string | null;
  reservation_date: string;
  reservation_time: string;
  people_count: number;
  table_id: string | null;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
}

// Placeholder mínimo de Database para tipar los clientes de Supabase.
// (No usamos el generador de tipos de Supabase CLI en este entorno;
// las tablas se tipan explícitamente arriba y se castea al usarlas.)
export type Database = any;
