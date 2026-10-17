import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import { getAppCheckToken } from "@/services/appCheck";
import { CartItem } from "@/context/CartContext";
import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } from "@/types/Order";
import type { Order, OrderStatus } from "@/types/Order";

export type OrderStatusUpdateResult =
  | "updated"
  | "sale-created"
  | "sale-already-exists"
  | "sale-excluded"
  | "sale-skipped-missing-cost";

export async function getOrders(): Promise<Order[]> {
  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((orderDoc) => ({
    ...orderDoc.data(),
    id: orderDoc.id,
  }) as Order);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<OrderStatusUpdateResult> {
  const orderRef = doc(db, "orders", orderId);
  const saleId = `sale_${orderId}`;
  const saleRef = doc(db, "sales", saleId);
  const saleDate = new Date().toISOString();

  return runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("No se encontró el pedido.");
    }

    const orderData = orderSnapshot.data();
    const currentStatus = String(orderData.status ?? "");
    const isSameStatus = currentStatus === status;

    if (
      !isSameStatus &&
      (!ORDER_STATUSES.includes(currentStatus as OrderStatus) ||
        !ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatus].includes(status))
    ) {
      throw new Error("Ese cambio de estado no está permitido.");
    }

    let result: OrderStatusUpdateResult = "updated";

    if (status === "entregado") {
      const customer = orderData.customer ?? {};
      const items = Array.isArray(orderData.items) ? orderData.items : [];
      const productIds = Array.from(
        new Set(items.map((item) => String(item.productId ?? ""))),
      ).filter(Boolean);
      const privateCostRefs = productIds.map((productId) =>
        doc(db, "productCosts", productId),
      );
      const deletionRef = doc(db, "deletedSales", saleId);
      const [existingSale, saleDeletion] = await Promise.all([
        transaction.get(saleRef),
        transaction.get(deletionRef),
      ]);
      if (saleDeletion.exists()) {
        result = "sale-excluded";
      } else if (existingSale.exists()) {
        result = "sale-already-exists";
      } else {
        const privateCostSnapshots = await Promise.all(
          privateCostRefs.map((costRef) => transaction.get(costRef)),
        );
      const costByProductId = new Map<string, number>();
      privateCostSnapshots.forEach((snapshot, index) => {
        if (snapshot.exists()) {
          const cost = Number(snapshot.data().cost);
          if (Number.isFinite(cost)) {
            costByProductId.set(productIds[index], cost);
          }
        }
      });
      const saleItems = items.map((item) => ({
        ...item,
        costAtSale: costByProductId.get(String(item.productId ?? "")),
      }));
      const saleItemsAreComplete =
        items.length > 0 &&
        typeof orderData.total === "number" &&
        Number.isFinite(orderData.total) &&
        saleItems.every(
          (item) =>
            typeof item.productId === "string" &&
            typeof item.productName === "string" &&
            typeof item.price === "number" &&
            Number.isFinite(item.price) &&
            typeof item.costAtSale === "number" &&
            Number.isFinite(item.costAtSale) &&
            typeof item.quantity === "number" &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0,
        );

        if (!saleItemsAreComplete) {
          result = "sale-skipped-missing-cost";
        } else {
          const profit = saleItems.reduce(
            (totalProfit, item) =>
              totalProfit + (item.price - item.costAtSale) * item.quantity,
            0,
          );

          transaction.set(saleRef, {
            id: saleId,
            orderNumber: String(orderData.orderNumber ?? orderId),
            clientName: customer.name ?? "",
            clientPhone: customer.phone ?? "",
            date: saleDate,
            items: saleItems.map((item) => ({
              costAtSale: item.costAtSale,
              priceAtSale: item.price,
              productId: item.productId,
              productName: item.productName,
              ...(typeof item.tone === "string" ? { tone: item.tone } : {}),
              quantity: item.quantity,
            })),
            notes: customer.notes ?? "",
            profit,
            status: "completed",
            total: orderData.total,
          });
          result = "sale-created";
        }
      }
    }

    if (status === "cancelado" && !isSameStatus) {
      const quantitiesByProduct = new Map<string, number>();
      const items = Array.isArray(orderData.items) ? orderData.items : [];

      if (items.length === 0) {
        throw new Error(
          `No se pudo cancelar el pedido ${orderData.orderNumber ?? orderId}: no tiene productos para validar y devolver al inventario.`,
        );
      }

      for (const [index, item] of items.entries()) {
        const productId = typeof item.productId === "string"
          ? item.productId.trim()
          : "";
        const quantity = typeof item.quantity === "number"
          ? item.quantity
          : typeof item.quantity === "string" && item.quantity.trim() !== ""
            ? Number(item.quantity)
            : Number.NaN;

        if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
          const itemName = typeof item.productName === "string" && item.productName.trim()
            ? item.productName
            : `producto ${index + 1}`;
          throw new Error(
            `No se pudo cancelar: ${itemName} tiene un identificador o una cantidad inválida en el pedido. No se modificó el inventario.`,
          );
        }

        quantitiesByProduct.set(
          productId,
          (quantitiesByProduct.get(productId) ?? 0) + quantity,
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
          throw new Error(
            `No se pudo cancelar: la cantidad acumulada del producto ${productId} no es válida. No se modificó el inventario.`,
          );
        }
      }

      const productEntries = Array.from(quantitiesByProduct.entries());
      const productRefs = productEntries.map(([productId]) =>
        doc(db, "products", productId),
      );
      const productSnapshots = await Promise.all(
        productRefs.map((productRef) => transaction.get(productRef)),
      );

      productSnapshots.forEach((productSnapshot, index) => {
        if (!productSnapshot.exists()) {
          throw new Error(
            `No se pudo cancelar: no se encontró en Productos el artículo ${productEntries[index][0]}. No se modificó el inventario.`,
          );
        }

        const [, quantity] = productEntries[index];
        const currentStock = Number(productSnapshot.data().stock ?? 0);
        if (!Number.isSafeInteger(currentStock) || currentStock < 0) {
          throw new Error(
            `No se pudo cancelar: el stock actual del producto ${productEntries[index][0]} no es válido. No se modificó el inventario.`,
          );
        }
        const restoredStock = currentStock + quantity;
        if (!Number.isSafeInteger(restoredStock)) {
          throw new Error(
            `No se pudo cancelar: el stock resultante del producto ${productEntries[index][0]} supera el límite válido. No se modificó el inventario.`,
          );
        }

        transaction.update(productRefs[index], {
          stock: restoredStock,
        });
      });
    }

    if (!isSameStatus) {
      transaction.update(orderRef, { status });
    }
    return result;
  });
}

interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

interface CreateOrderData {
  orderNumber: string;
  customer: Customer;
  items: CartItem[];
  status: string;
}

export async function createOrder({
  orderNumber,
  customer,
  items,
  status,
}: CreateOrderData) {
  if (status !== "pendiente") {
    throw new Error("El pedido debe iniciar como pendiente.");
  }
  if (items.length === 0 || items.length > 20) {
    throw new Error("El pedido debe incluir entre 1 y 20 productos.");
  }

  const requestBody = JSON.stringify({
    orderNumber,
    customer,
    items: items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      expectedPrice: item.product.price,
      ...(item.tone ? { tone: item.tone } : {}),
    })),
  });
  const sendOrder = async (forceTokenRefresh: boolean) => {
    const appCheckToken = await getAppCheckToken(forceTokenRefresh);
    return fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": appCheckToken,
      },
      body: requestBody,
    });
  };

  let response = await sendOrder(false);
  if (response.status === 401) {
    response = await sendOrder(true);
  }

  const result = (await response.json()) as {
    error?: string;
    id?: string;
    orderNumber?: string;
    subtotal?: number;
    total?: number;
    items?: { productName: string; price: number; quantity: number; tone?: string }[];
  };

  if (!response.ok) {
    throw new Error(result.error ?? "No pudimos registrar tu pedido.");
  }

  if (
    typeof result.id !== "string" ||
    typeof result.orderNumber !== "string" ||
    typeof result.subtotal !== "number" ||
    typeof result.total !== "number" ||
    !Array.isArray(result.items)
  ) {
    throw new Error("El servidor devolvió una confirmación de pedido no válida.");
  }

  return result as {
    id: string;
    orderNumber: string;
    subtotal: number;
    total: number;
    items: { productName: string; price: number; quantity: number; tone?: string }[];
  };
}
