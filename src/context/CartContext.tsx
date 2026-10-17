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
import { getToneStock } from "@/lib/productInventory";
import Toast from "@/components/ui/Toast";

export interface CartItem {
  product: Product;
  quantity: number;
  tone?: string;
}

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  syncProducts: (products: Product[]) => void;
  addToCart: (product: Product, quantity?: number, tone?: string) => void;
  removeFromCart: (productId: string, tone?: string) => void;
  updateQuantity: (productId: string, quantity: number, tone?: string) => void;
  changeTone: (productId: string, currentTone: string | undefined, nextTone: string) => void;
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
    quantity: number = 1,
    tone?: string,
  ) => {
    if (product.tones?.length && (!tone || !product.tones.includes(tone))) {
      showStockToast(`Elige un tono para ${product.name} antes de agregarlo.`);
      return;
    }
    setItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item.product.id === product.id && item.tone === tone
        );

      const newQuantity = (existingItem?.quantity ?? 0) + quantity;
      const availableStock = product.tones?.length
        ? getToneStock(product, tone)
        : product.stock;

      if (newQuantity > availableStock) {
        showStockToast(
          `Solo quedan ${availableStock} unidades disponibles${tone ? ` del tono ${tone}` : ""} de ${product.name}.`
        );

        return currentItems;
      }

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id && item.tone === tone
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
          ...(tone ? { tone } : {}),
        },
      ];
    });
  };

  // =========================
  // ELIMINAR
  // =========================

 const removeFromCart = (productId: string, tone?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.product.id !== productId || item.tone !== tone
      )
    );
  };

  // =========================
  // CAMBIAR CANTIDAD
  // =========================

 const updateQuantity = (
  productId: string,
  quantity: number,
  tone?: string,
) => {
    setItems((currentItems) => {
      const item = currentItems.find(
        (item) =>
          item.product.id === productId && item.tone === tone
      );

      if (!item) {
        return currentItems;
      }

      const availableStock = item.product.tones?.length
        ? getToneStock(item.product, tone)
        : item.product.stock;
      if (quantity > availableStock) {
        showStockToast(
          `Solo quedan ${availableStock} unidades disponibles${tone ? ` del tono ${tone}` : ""} de ${item.product.name}.`
        );

        return currentItems;
      }

      if (quantity <= 0) {
        return currentItems.filter(
          (item) =>
            item.product.id !== productId || item.tone !== tone
        );
      }

      return currentItems.map((item) =>
        item.product.id === productId && item.tone === tone
          ? {
              ...item,
              quantity,
            }
          : item
      );
    });
  };

  const changeTone = (productId: string, currentTone: string | undefined, nextTone: string) => {
    if (currentTone === nextTone) return;
    setItems((currentItems) => {
      const item = currentItems.find((entry) => entry.product.id === productId && entry.tone === currentTone);
      if (!item || !item.product.tones?.includes(nextTone)) return currentItems;
      const destination = currentItems.find((entry) => entry.product.id === productId && entry.tone === nextTone);
      const targetQuantity = (destination?.quantity ?? 0) + item.quantity;
      const nextToneStock = getToneStock(item.product, nextTone);
      if (targetQuantity > nextToneStock) {
        showStockToast(`Solo quedan ${nextToneStock} unidades disponibles del tono ${nextTone} de ${item.product.name}.`);
        return currentItems;
      }
      if (destination) {
        return currentItems
          .filter((entry) => !(entry.product.id === productId && entry.tone === currentTone))
          .map((entry) => entry === destination ? { ...entry, quantity: entry.quantity + item.quantity } : entry);
      }
      return currentItems.map((entry) => entry === item ? { ...entry, tone: nextTone } : entry);
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
        changeTone,
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
