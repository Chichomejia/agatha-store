export interface SaleItem {
  costAtSale: number;
  priceAtSale: number;
  productId: string;
  productName: string;
  quantity: number;
}

export interface Sale {
  id: string;
  documentId?: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  orderNumber?: string;
  date: unknown;
  items: SaleItem[];
  notes?: string;
  profit: number;
  status: string;
  total: number;
}
