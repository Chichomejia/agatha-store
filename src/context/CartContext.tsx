"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { Product } from "@/types/Product";
import Toast from "@/components/ui/Toast";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  syncProducts: (products: Product[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
removeFromCart: (productId: string) => void;
updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [stockMessage, setStockMessage] =
    useState<string | null>(null);

  const syncProducts = useCallback((products: Product[]) => {
    const productsById = new Map(products.map((product) => [product.id, product]));

    setItems((currentItems) =>
      currentItems.map((item) => {
        const currentProduct = productsById.get(item.product.id);

        return {
          ...item,
          product: currentProduct ?? { ...item.product, stock: 0 },
        };
      }),
    );
  }, []);

  // =========================
  // CARGAR CARRITO
  // =========================

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("agatha-cart");

      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error(
        "Error cargando carrito:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // =========================
  // GUARDAR CARRITO
  // =========================

  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(
        "agatha-cart",
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Error guardando carrito:",
        error
      );
    }
  }, [items, isLoaded]);

  // =========================
  // MOSTRAR TOAST
  // =========================

  const showStockToast = (message: string) => {
    setStockMessage(message);

    setTimeout(() => {
      setStockMessage(null);
    }, 3500);
  };

  // =========================
  // AGREGAR PRODUCTO
  // =========================

  const addToCart = (
    product: Product,
    quantity: number = 1
  ) => {
    setItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item.product.id === product.id
        );

      const currentQuantity =
        existingItem?.quantity ?? 0;

      const newQuantity =
        currentQuantity + quantity;

      if (newQuantity > product.stock) {
        showStockToast(
          `Solo quedan ${product.stock} unidades disponibles de ${product.name}.`
        );

        return currentItems;
      }

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity,
        },
      ];
    });
  };

  // =========================
  // ELIMINAR
  // =========================

 const removeFromCart = (
  productId: string
) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.product.id !== productId
      )
    );
  };

  // =========================
  // CAMBIAR CANTIDAD
  // =========================

 const updateQuantity = (
  productId: string,
  quantity: number
) => {
    setItems((currentItems) => {
      const item = currentItems.find(
        (item) =>
          item.product.id === productId
      );

      if (!item) {
        return currentItems;
      }

      if (quantity > item.product.stock) {
        showStockToast(
          `Solo quedan ${item.product.stock} unidades disponibles de ${item.product.name}.`
        );

        return currentItems;
      }

      if (quantity <= 0) {
        return currentItems.filter(
          (item) =>
            item.product.id !== productId
        );
      }

      return currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      );
    });
  };

  // =========================
  // VACIAR
  // =========================

  const clearCart = () => {
    setItems([]);
  };

  // =========================
  // TOTALES
  // =========================

  const totalItems = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (total, item) =>
      total +
      item.product.price *
        item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoaded,
        syncProducts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}

      {/* Toast */}
      {stockMessage && (
        <Toast
          message={stockMessage}
          onClose={() =>
            setStockMessage(null)
          }
        />
      )}
    </CartContext.Provider>
  );
}

// =========================
// HOOK
// =========================

export function useCart() {
  const context = useContext(
    CartContext
  );

  if (!context) {
    throw new Error(
      "useCart debe utilizarse dentro de CartProvider"
    );
  }

  return context;
}
