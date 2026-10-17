export interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  tone?: string;
  price: number;
  costAtSale?: number;
  quantity: number;
  subtotal: number;
}

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

export interface Order {
  id?: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt?: unknown;
}
