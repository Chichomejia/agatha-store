"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { createOrder } from "@/services/orderService";
import { getProducts } from "@/services/productService";

import { useCart } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import { SHIPPING_CONFIRMATION, SHIPPING_ESTIMATE } from "@/lib/shipping";
import { getToneStock } from "@/lib/productInventory";
import { STORE_WHATSAPP_NUMBER } from "@/lib/storeContact";

function CheckoutProgress({ currentStep }: { currentStep: 2 | 3 }) {
  const steps = ["Carrito", "Entrega", "WhatsApp"] as const;

  return (
    <ol
      aria-label="Progreso de compra"
      className="grid grid-cols-3 gap-2 text-center"
    >
      {steps.map((label, index) => {
        const step = index + 1;
        const isComplete = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex flex-col items-center gap-2 text-xs font-medium ${
              isCurrent ? "text-pink-700" : isComplete ? "text-gray-700" : "text-gray-400"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                isCurrent
                  ? "border-pink-600 bg-pink-600 text-white"
                  : isComplete
                    ? "border-pink-200 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {isComplete ? <CheckCircle2 size={18} aria-hidden="true" /> : step}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const orderNumberRef = useRef("");

  const {
    items,
    totalPrice,
    clearCart,
    isLoaded,
    syncProducts,
  } = useCart();

  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<{
    items: { productName: string; quantity: number; price: number; tone?: string }[];
    subtotal: number;
    total: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [cartReview, setCartReview] = useState<"loading" | "ready" | "error">("loading");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });

  const refreshCart = useCallback(async () => {
    setCartReview("loading");

    try {
      const products = await getProducts();
      syncProducts(products);
      setCartReview("ready");
    } catch (error) {
      console.error("No se pudo actualizar el carrito antes del checkout:", error);
      setCartReview("error");
    }
  }, [syncProducts]);

  useEffect(() => {
    if (!isLoaded) return;

    if (items.length === 0) {
      setCartReview("ready");
      return;
    }

    void refreshCart();
  }, [isLoaded, items.length, refreshCart]);

  const quantitiesByVariant = new Map<string, number>();
  for (const item of items) {
    const variantKey = JSON.stringify([item.product.id, item.tone ?? null]);
    quantitiesByVariant.set(variantKey, (quantitiesByVariant.get(variantKey) ?? 0) + item.quantity);
  }
  const hasStockIssues = items.some((item) => {
    const variantQuantity = quantitiesByVariant.get(JSON.stringify([item.product.id, item.tone ?? null])) ?? 0;
    const variantStock = item.product.tones?.length
      ? getToneStock(item.product, item.tone)
      : item.product.stock;
    return !Number.isInteger(item.quantity) || item.quantity <= 0 ||
      (item.product.tones?.length
        ? !item.tone || !item.product.tones.includes(item.tone)
        : Boolean(item.tone)) || variantQuantity > variantStock;
  });

  if (!isLoaded || cartReview === "loading") {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-pink-50 px-6">
          <p role="status" aria-live="polite" className="font-medium text-gray-600">
            Revisando precios y disponibilidad...
          </p>
        </main>
        <Footer />
      </>
    );
  }

  // Si el carrito está vacío
  if (items.length === 0 && !isSuccess) {
    return (
      <>
      <Navbar />
      <main className="min-h-screen bg-pink-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Tu carrito está vacío
          </h1>

          <p className="mt-3 text-gray-500">
            Agrega algunos productos antes de finalizar tu compra.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-pink-600 px-8 py-3 font-semibold text-white transition hover:bg-pink-700"
          >
            Seguir comprando
          </button>
        </div>
      </main>
      <Footer />
      </>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSubmitError("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  if (isSubmitting) return;

  setSubmitError("");

  if (
    !form.name.trim() ||
    !form.phone.trim() ||
    !form.city.trim() ||
    !form.address.trim()
  ) {
    setSubmitError("Completa tu nombre, WhatsApp, ciudad y dirección para continuar.");
    return;
  }

  const phoneDigits = form.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    setSubmitError("Ingresa un número de WhatsApp válido con entre 7 y 15 dígitos.");
    return;
  }

  try {
    setIsSubmitting(true);

    if (!orderNumberRef.current) {
      orderNumberRef.current = `AG-${crypto.randomUUID()
        .replaceAll("-", "")
        .slice(0, 8)
        .toUpperCase()}`;
    }
    const generatedOrderNumber = orderNumberRef.current;

    const createdOrder = await createOrder({
      orderNumber: generatedOrderNumber,

      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      },

      items,

      status: "pendiente",
    });

    /*
     * El pedido y el descuento del stock
     * ya fueron realizados en Firestore.
     */

    setOrderNumber(generatedOrderNumber);
    setConfirmedOrder(createdOrder);

    setIsSuccess(true);

  } catch (error) {
    console.error(
      "Error guardando pedido:",
      error
    );

    const message = error instanceof Error ? error.message : "";
    const isInventoryIssue = /stock insuficiente|ya no está disponible|no se encontró el producto/i.test(message);
    const isPriceIssue = /el precio de .* cambió/i.test(message);
    const isAppCheckIssue = /validar esta solicitud|validación segura/i.test(message);

    setSubmitError(
      isInventoryIssue
        ? `${message} Revisa el carrito y vuelve a intentarlo.`
        : isPriceIssue
          ? `${message} Quita ese producto del carrito y agrégalo nuevamente desde el catálogo para aceptar el precio vigente.`
          : isAppCheckIssue
            ? "No pudimos validar la seguridad de esta compra y el pedido no se registró. Actualiza la página e inténtalo de nuevo."
        : "No pudimos registrar tu pedido. Verifica tu conexión e inténtalo de nuevo. Si el problema continúa, contáctanos por WhatsApp."
    );

  } finally {
    setIsSubmitting(false);
  }
};

  const getOrderMessage = () => {
  const confirmedItems = confirmedOrder?.items ?? items.map((item) => ({
    productName: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    ...(item.tone ? { tone: item.tone } : {}),
  }));
  const confirmedSubtotal = confirmedOrder?.subtotal ?? totalPrice;
  const confirmedTotal = confirmedOrder?.total ?? totalPrice;
  const productsMessage = confirmedItems
    .map(
      (item) =>
        `• ${item.productName}${item.tone ? ` — Tono: ${item.tone}` : ""} x${item.quantity} — $${(
          item.price * item.quantity
        ).toLocaleString("es-CO")}`
    )
    .join("\n");

  const message = `
💗 *NUEVO PEDIDO — AGATHA STORE*

🧾 *Pedido:* ${orderNumber}

👤 *Cliente:* ${form.name}
📱 *WhatsApp:* ${form.phone}
🏙️ *Ciudad:* ${form.city}
📍 *Dirección:* ${form.address}

🛍️ *PRODUCTOS*

${productsMessage}

🛍️ *Subtotal de productos:* $${confirmedSubtotal.toLocaleString("es-CO")}
🚚 *Envío:* Por confirmar por WhatsApp — entrega estimada ${SHIPPING_ESTIMATE}
💰 *Total de productos (sin envío):* $${confirmedTotal.toLocaleString("es-CO")}

📝 *Observaciones:*
${form.notes || "Ninguna"}

✨ Gracias por comprar en Agatha Store.
`;

  return message;
};

  const copyOrderSummary = async () => {
    try {
      await navigator.clipboard.writeText(getOrderMessage());
      setCopyFeedback("Resumen copiado. Puedes pegarlo en WhatsApp.");
    } catch {
      setCopyFeedback("No se pudo copiar automáticamente. Intenta enviar el pedido por WhatsApp.");
    }
  };

  // ==========================================
  // PANTALLA DE ÉXITO
  // ==========================================

  if (isSuccess) {
    return (
      <>
      <Navbar />
      <main className="min-h-screen bg-pink-50 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-pink-100/80 bg-white p-5 text-center shadow-lg sm:p-10">
          <CheckoutProgress currentStep={3} />
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
            <CheckCircle2
              size={45}
              className="text-pink-600"
            />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-pink-600">
            Agatha Store
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            ¡Pedido registrado!
          </h1>

          <p className="mt-4 text-gray-500">
            Tu pedido quedó registrado y el inventario reservado. En WhatsApp confirmaremos el costo del envío, la entrega y el pago.
          </p>

          <div className="mt-6 rounded-2xl bg-pink-50 p-5">
            <p className="text-sm text-gray-500">
              Número de pedido
            </p>

            <p className="mt-1 text-2xl font-bold text-pink-600">
              {orderNumber}
            </p>
          </div>

          {confirmedOrder && (
            <div className="mt-5 rounded-2xl border border-gray-100 p-5 text-left">
              <h2 className="font-semibold text-gray-900">Resumen del pedido</h2>
              <dl className="mt-3 grid gap-2 border-b border-gray-100 pb-4 text-sm text-gray-600 sm:grid-cols-2">
                <div>
                  <dt className="inline font-semibold text-gray-800">Cliente: </dt>
                  <dd className="inline">{form.name}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-gray-800">WhatsApp: </dt>
                  <dd className="inline">{form.phone}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-gray-800">Ciudad: </dt>
                  <dd className="inline">{form.city}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-gray-800">Dirección: </dt>
                  <dd className="inline">{form.address}</dd>
                </div>
              </dl>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {confirmedOrder.items.map((item, index) => (
                  <li key={`${item.productName}-${index}`} className="flex justify-between gap-4">
                    <span>{item.quantity} × {item.productName}{item.tone ? ` · Tono: ${item.tone}` : ""}</span>
                    <span className="shrink-0">${(item.price * item.quantity).toLocaleString("es-CO")}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between gap-4 text-gray-600">
                  <span>Productos</span>
                  <span>${confirmedOrder.subtotal.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between gap-4 text-gray-600">
                  <span>Envío</span>
                  <span className="max-w-[60%] text-right">{SHIPPING_CONFIRMATION}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-gray-100 pt-3 font-bold text-gray-900">
                  <span>Total de productos</span>
                  <span>${confirmedOrder.subtotal.toLocaleString("es-CO")}</span>
                </div>
                <p className="text-xs leading-5 text-gray-500">
                  Entrega estimada: {SHIPPING_ESTIMATE}. El total mostrado no incluye el envío; te confirmaremos su valor por WhatsApp.
                </p>
              </div>
              {form.notes.trim() && (
                <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Observaciones: </span>
                  {form.notes.trim()}
                </p>
              )}
            </div>
          )}

          <a
            href={`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(getOrderMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={clearCart}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-green-600 px-6 py-4 font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-green-700"
          >
            <MessageCircle size={22} />
            Abrir WhatsApp con mi pedido
          </a>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            WhatsApp abrirá el mensaje preparado. Revísalo y pulsa Enviar para completar la conversación con la tienda.
          </p>

          <button
            type="button"
            onClick={copyOrderSummary}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Copy size={18} />
            Copiar resumen del pedido
          </button>
          {copyFeedback && (
            <p role="status" aria-live="polite" className="mt-2 text-sm text-gray-600">
              {copyFeedback}
            </p>
          )}

          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-full border border-gray-200 px-6 py-4 font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Seguir comprando
          </button>
        </div>
      </main>
      <Footer />
      </>
    );
  }

  // ==========================================
  // CHECKOUT
  // ==========================================

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-pink-50 px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <CheckoutProgress currentStep={2} />

        {/* VOLVER */}
        <Link
          href="/carrito"
          className="mb-8 flex items-center gap-2 text-gray-600 transition hover:text-pink-600"
        >
          <ArrowLeft size={18} />
          Volver al carrito
        </Link>

        {/* ENCABEZADO */}
        <div className="mb-10">
          <p className="text-sm font-semibold tracking-[0.3em] text-pink-600">
            AGATHA STORE
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Finalizar compra
          </h1>

          <p className="mt-2 text-gray-500">
            Completa tus datos para preparar tu pedido.
          </p>
        </div>

        {submitError && (
          <FeedbackMessage tone="error" className="mb-6">
            <p>
              {submitError}{" "}
              {/stock insuficiente|ya no está disponible|no se encontró el producto|el precio de .* cambió/i.test(
                submitError
              ) ? (
                <Link
                  href="/carrito"
                  className="font-semibold underline underline-offset-2"
                >
                  Revisar el carrito.
                </Link>
              ) : (
                <a
                  href={`https://wa.me/${STORE_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  Escríbenos por WhatsApp.
                </a>
              )}
            </p>
          </FeedbackMessage>
        )}

        {cartReview === "error" && (
          <FeedbackMessage tone="warning" role="alert" className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>No pudimos revisar los precios y las existencias. Vuelve a intentarlo para confirmar el pedido.</p>
              <button
                type="button"
                onClick={() => void refreshCart()}
                className="button-secondary min-h-11 shrink-0 px-4 py-2"
              >
                Reintentar
              </button>
            </div>
          </FeedbackMessage>
        )}

        {cartReview === "ready" && hasStockIssues && (
          <FeedbackMessage tone="warning" role="alert" className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>Revisa que cada producto tenga un tono disponible y que la cantidad total no supere el stock. Corrige el carrito antes de confirmar.</p>
              <Link href="/carrito" className="button-secondary min-h-11 shrink-0 px-4 py-2">
                Revisar carrito
              </Link>
            </div>
          </FeedbackMessage>
        )}

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_380px]"
        >

          {/* DATOS DEL CLIENTE */}
          <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-sm sm:p-8">

            <h2 className="text-2xl font-bold text-gray-900">
              Datos de entrega
            </h2>

            <div className="mt-6 space-y-5">

              {/* NOMBRE */}
              <div>
                <label htmlFor="checkout-name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Nombre completo *
                </label>

                <input
                  id="checkout-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: María López"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                  required
                />
              </div>

              {/* TELEFONO */}
              <div>
                <label htmlFor="checkout-phone" className="mb-2 block text-sm font-semibold text-gray-700">
                  WhatsApp *
                </label>

                <input
                  id="checkout-phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={24}
                  pattern="[0-9+() -]{7,24}"
                  title="Ingresa un teléfono válido, con números y opcionalmente +, espacios o guiones."
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ej: 3001234567"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                  required
                />
              </div>

              {/* CIUDAD */}
              <div>
                <label htmlFor="checkout-city" className="mb-2 block text-sm font-semibold text-gray-700">
                  Ciudad *
                </label>

                <input
                  id="checkout-city"
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  autoCapitalize="words"
                  maxLength={100}
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ej: Medellín"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                  required
                />
              </div>

              {/* DIRECCION */}
              <div>
                <label htmlFor="checkout-address" className="mb-2 block text-sm font-semibold text-gray-700">
                  Dirección *
                </label>

                <input
                  id="checkout-address"
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  autoCapitalize="words"
                  maxLength={200}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej: Calle 10 #20-30"
                  className="min-h-12 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                  required
                />
              </div>

              {/* OBSERVACIONES */}
              <div>
                <label htmlFor="checkout-notes" className="mb-2 block text-sm font-semibold text-gray-700">
                  Observaciones
                </label>

                <textarea
                  id="checkout-notes"
                  name="notes"
                  maxLength={500}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Alguna indicación para tu pedido..."
                  rows={4}
                  className="min-h-28 w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
                />
              </div>

            </div>
          </div>

          {/* RESUMEN */}
          <div className="h-fit rounded-3xl border border-pink-100/80 bg-white p-5 shadow-sm sm:p-8 lg:sticky lg:top-28">

            <h2 className="text-2xl font-bold text-gray-900">
              Resumen
            </h2>

            <div className="mt-6 space-y-4">

              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.tone ?? "default"}`}
                  className="flex justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.product.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Cantidad: {item.quantity}
                    </p>
                    {item.tone && <p className="text-sm font-medium text-pink-700">Tono: {item.tone}</p>}
                  </div>

                  <p className="font-semibold text-gray-900">
                    $
                    {(
                      item.product.price * item.quantity
                    ).toLocaleString("es-CO")}
                  </p>
                </div>
              ))}

            </div>

            <div className="my-6 border-t border-gray-100" />

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Productos</span>
                <span className="font-medium text-gray-900">${totalPrice.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Envío</span>
                <span className="text-right font-medium text-gray-900">
                  {SHIPPING_CONFIRMATION}
                </span>
              </div>
              {totalPrice > 0 && (
                <p className="rounded-xl bg-pink-50 px-4 py-3 text-xs leading-5 text-pink-800">
                  Entrega estimada: {SHIPPING_ESTIMATE}. El valor final del envío se confirma por WhatsApp.
                </p>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-lg font-bold">Subtotal de productos</span>
                <span className="text-2xl font-bold text-pink-600">${totalPrice.toLocaleString("es-CO")}</span>
              </div>
            </div>

          <button
  type="submit"
  disabled={isSubmitting || cartReview !== "ready" || hasStockIssues}
  className="liquid-btn mt-8 w-full px-6 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-60"
>
  {isSubmitting
    ? "Registrando pedido..."
    : "Confirmar pedido"}
</button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Al confirmar registramos tu pedido y reservamos el stock. El envío y el pago se coordinan por WhatsApp; no se realiza ningún cobro en línea.
            </p>

          </div>

        </form>
      </div>
    </main>
    <Footer />
    </>
  );
}
