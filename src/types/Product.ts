export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  rating?: number;
  stock: number;
  /** Solo se carga en las pantallas administrativas. */
  cost?: number;
}
