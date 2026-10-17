import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { z } from "zod";

import { getAdminAppCheck, getAdminDb } from "@/services/firebaseAdmin";

export const runtime = "nodejs";

const customerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().regex(/^[0-9+() -]{7,24}$/),
    city: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(200),
    notes: z.string().max(500).optional(),
  })
  .strict();

const orderSchema = z
  .object({
    orderNumber: z.string().regex(/^AG-[A-Z0-9]{8}$/),
    customer: customerSchema,
    items: z
      .array(
        z
          .object({
            productId: z.string().regex(/^[^/]{1,128}$/),
            quantity: z.number().int().positive().max(1000).refine(Number.isSafeInteger),
            expectedPrice: z.number().finite().nonnegative(),
            tone: z.string().trim().min(1).max(50).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function matchesExistingOrder(
  savedOrder: DocumentData | undefined,
  customer: z.infer<typeof customerSchema>,
  items: z.infer<typeof orderSchema>['items'],
) {
  const savedCustomer = savedOrder?.customer;
  const savedItems = savedOrder?.items;

  return (
    savedCustomer?.name === customer.name &&
    savedCustomer?.phone === customer.phone &&
    savedCustomer?.city === customer.city &&
    savedCustomer?.address === customer.address &&
    (savedCustomer?.notes ?? "") === (customer.notes ?? "") &&
    Array.isArray(savedItems) &&
    savedItems.length === items.length &&
    savedItems.every((savedItem: DocumentData, index: number) => {
      const submittedItem = items[index];
      return (
        savedItem.productId === submittedItem.productId &&
        savedItem.quantity === submittedItem.quantity &&
        savedItem.price === submittedItem.expectedPrice
        && (savedItem.tone ?? undefined) === submittedItem.tone
      );
    })
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_768) {
    return jsonError("La información del pedido supera el tamaño permitido.", 413);
  }

  const appCheckToken = request.headers.get("X-Firebase-AppCheck");
  if (!appCheckToken) {
    return jsonError("No se pudo validar esta solicitud. Recarga la tienda e inténtalo de nuevo.", 401);
  }

  let appCheck;
  try {
    appCheck = getAdminAppCheck();
  } catch (error) {
    console.error("Firebase Admin no está configurado:", error);
    return jsonError("El registro seguro de pedidos aún no está configurado en el servidor.", 503);
  }

  try {
    await appCheck.verifyToken(appCheckToken);
  } catch {
    return jsonError("No se pudo validar esta solicitud. Recarga la tienda e inténtalo de nuevo.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("La información del pedido no es válida.", 400);
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Revisa los datos del pedido e inténtalo de nuevo.", 400);
  }

  const { orderNumber, customer, items } = parsed.data;
  const quantitiesByProduct = new Map<string, number>();
  const quantitiesByTone = new Map<string, number>();
  for (const item of items) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
    );
    if (item.tone) {
      const key = JSON.stringify([item.productId, item.tone]);
      quantitiesByTone.set(key, (quantitiesByTone.get(key) ?? 0) + item.quantity);
    }
  }

  const productIds = Array.from(quantitiesByProduct.keys());
  let adminDb: ReturnType<typeof getAdminDb>;
  try {
    adminDb = getAdminDb();
  } catch (error) {
    console.error("Firebase Admin no está configurado:", error);
    return jsonError("El registro seguro de pedidos aún no está configurado en el servidor.", 503);
  }

  const productRefs = productIds.map((productId) =>
    adminDb.collection("products").doc(productId),
  );
  const orderRef = adminDb.collection("orders").doc(orderNumber);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const [existingOrder, ...productSnapshots] = await Promise.all([
        transaction.get(orderRef),
        ...productRefs.map((productRef) => transaction.get(productRef)),
      ]);

      if (existingOrder.exists) {
        const savedOrder = existingOrder.data();
        if (
          savedOrder?.orderNumber !== orderNumber ||
          !matchesExistingOrder(savedOrder, customer, items)
        ) {
          throw new Error("ORDER_NUMBER_CONFLICT");
        }

        return {
          id: existingOrder.id,
          orderNumber,
          subtotal: Number(savedOrder.total ?? 0),
          total: Number(savedOrder.total ?? 0),
          items: Array.isArray(savedOrder.items) ? savedOrder.items : [],
        };
      }

      const productDataById = new Map<string, DocumentData>();
      productSnapshots.forEach((snapshot, index) => {
        const productId = productIds[index];
        const quantity = quantitiesByProduct.get(productId) ?? 0;
        if (!snapshot.exists) {
          throw new Error(`No se encontró el producto ${productId}.`);
        }

        const product = snapshot.data()!;
        if (product.isActive !== true) {
          throw new Error(`El producto ${product.name ?? productId} ya no está disponible.`);
        }

        const stock = Number(product.stock);
        if (!Number.isSafeInteger(stock) || stock < quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name ?? productId}. Disponible: ${Number.isFinite(stock) ? stock : 0}`,
          );
        }

        productDataById.set(productId, product);
      });

      const validatedItems = items.map((item) => {
        const product = productDataById.get(item.productId)!;
        const price = Number(product.price);
        const availableTones = Array.isArray(product.tones)
          ? product.tones.filter((tone: unknown): tone is string => typeof tone === "string")
          : [];
        if (availableTones.length > 0 && (!item.tone || !availableTones.includes(item.tone))) {
          throw new Error(`Elige un tono disponible para ${product.name ?? item.productId}.`);
        }
        if (availableTones.length === 0 && item.tone) {
          throw new Error(`El producto ${product.name ?? item.productId} no tiene tonos configurados.`);
        }
        if (availableTones.length > 0) {
          const savedToneStock = product.toneStock && typeof product.toneStock === "object"
            ? product.toneStock as Record<string, unknown>
            : {};
          for (const tone of availableTones) {
            const stock = Number(savedToneStock[tone] ?? 0);
            if (!Number.isSafeInteger(stock) || stock < 0) {
              throw new Error(`El inventario del tono ${tone} de ${product.name ?? item.productId} no es válido.`);
            }
          }
          const availableToneStock = Number(savedToneStock[item.tone ?? ""] ?? 0);
          const requestedToneStock = quantitiesByTone.get(JSON.stringify([item.productId, item.tone])) ?? 0;
          if (!Number.isSafeInteger(availableToneStock) || availableToneStock < requestedToneStock) {
            throw new Error(`Stock insuficiente para el tono ${item.tone ?? "seleccionado"} de ${product.name ?? item.productId}. Disponible: ${Number.isSafeInteger(availableToneStock) ? availableToneStock : 0}`);
          }
        }
        if (!Number.isSafeInteger(price) || price < 0) {
          throw new Error(`El precio de ${product.name ?? item.productId} no es válido.`);
        }
        if (price !== item.expectedPrice) {
          throw new Error(
            `El precio de ${product.name ?? item.productId} cambió. Actualiza el carrito antes de confirmar.`,
          );
        }

        return {
          productId: item.productId,
          productName: String(product.name ?? "Producto"),
          ...(item.tone ? { tone: item.tone } : {}),
          price,
          quantity: item.quantity,
          subtotal: price * item.quantity,
        };
      });

      const total = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      if (!Number.isSafeInteger(total) || total > 100_000_000) {
        throw new Error("El valor total del pedido no es válido.");
      }

      productSnapshots.forEach((snapshot, index) => {
        const productId = productIds[index];
        const quantity = quantitiesByProduct.get(productId) ?? 0;
        const product = snapshot.data()!;
        const availableTones = Array.isArray(product.tones)
          ? product.tones.filter((tone: unknown): tone is string => typeof tone === "string")
          : [];
        const stockUpdate: DocumentData = { stock: Number(product.stock) - quantity };
        if (availableTones.length > 0) {
          const savedToneStock = product.toneStock && typeof product.toneStock === "object"
            ? product.toneStock as Record<string, unknown>
            : {};
          const nextToneStock: Record<string, number> = {};
          for (const tone of availableTones) {
            const currentToneStock = Number(savedToneStock[tone] ?? 0);
            if (!Number.isSafeInteger(currentToneStock) || currentToneStock < 0) {
              throw new Error(`El inventario del tono ${tone} de ${product.name ?? productId} no es válido.`);
            }
            const reserved = quantitiesByTone.get(JSON.stringify([productId, tone])) ?? 0;
            nextToneStock[tone] = currentToneStock - reserved;
          }
          stockUpdate.toneStock = nextToneStock;
        }
        transaction.update(productRefs[index], {
          ...stockUpdate,
        });
      });

      transaction.create(orderRef, {
        orderNumber,
        customer,
        items: validatedItems,
        total,
        status: "pendiente",
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        id: orderRef.id,
        orderNumber,
        subtotal: total,
        total,
        items: validatedItems,
      };
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ORDER_NUMBER_CONFLICT") {
      return jsonError("No se pudo confirmar el número del pedido. Inténtalo de nuevo.", 409);
    }
    if (/stock insuficiente|ya no está disponible|no se encontró el producto|cambió|no es válido|tono/i.test(message)) {
      return jsonError(message, 409);
    }

    console.error("No se pudo registrar el pedido de forma segura:", error);
    return jsonError("No pudimos registrar tu pedido. Inténtalo de nuevo o contáctanos por WhatsApp.", 500);
  }
}
