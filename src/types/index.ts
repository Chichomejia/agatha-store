export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;       // Retail price (precio al público)
  cost: number;        // Cost price (precio de costo, para calcular ganancia)
  stock: number;
  imageUrl: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number; // Retail price at the time of sale
  costAtSale: number;  // Cost price at the time of sale
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: SaleItem[];
  total: number;
  profit: number;      // Calculated profit (total retail - total cost)
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}
