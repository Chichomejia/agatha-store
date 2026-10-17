"use client";


import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { SHIPPING_CONFIRMATION, SHIPPING_ESTIMATE } from "@/lib/shipping";

export default function CarritoPage() {
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-pink-50">

      {/* Header */}
      <section className="border-b border-pink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/productos"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-pink-600"
          >
            <ArrowLeft size={17} />
            Seguir comprando
          </Link>

          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-600">
                Agatha Store
              </span>

              <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                Mi carrito
              </h1>

              <p className="mt-2 text-gray-500">
                {totalItems === 0
                  ? "Tu carrito está esperando nuevos productos."
                  : `${totalItems} ${
                      totalItems === 1
                        ? "producto"
                        : "productos"
                    } en tu carrito`}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="hidden min-h-11 rounded-lg px-2 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 sm:block"
              >
                Vaciar carrito
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">

        {items.length === 0 ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl bg-white px-6 text-center shadow-sm">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-pink-50">
              <ShoppingBag
                size={42}
                className="text-pink-500"
              />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Tu carrito está vacío
            </h2>

            <p className="mt-2 max-w-md text-gray-500">
              Descubre nuestros productos de belleza y
              encuentra algo especial para ti.
            </p>

            <Link
              href="/productos"
              className="mt-7 rounded-full bg-pink-600 px-7 py-3 font-semibold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-1 hover:bg-pink-700"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* Productos */}
            <div className="space-y-4">

              {items.map((item) => {
                const subtotal =
                  item.product.price * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="group rounded-3xl bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
                  >
                    <div className="flex gap-4 sm:gap-6">

                      {/* Imagen */}
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-pink-50 sm:h-36 sm:w-36">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          width={288}
                          height={288}
                          unoptimized
                          sizes="(min-width: 640px) 144px, 112px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-500">
                          Imagen no disponible
                        </div>
                      )}
                      </div>

                      {/* Información */}
                      <div className="min-w-0 flex-1">

                        <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                          {item.product.category}
                        </span>

                        <h2 className="mt-1 truncate text-lg font-bold text-gray-900 sm:text-xl">
                          {item.product.name}
                        </h2>

                        <p className="mt-1 hidden text-sm text-gray-500 sm:block">
                          {item.product.description}
                        </p>

                        <p className="mt-3 text-lg font-bold text-pink-600">
                          $
                          {item.product.price.toLocaleString(
                            "es-CO"
                          )}
                        </p>

                        {item.product.stock <= 0 ? (
                          <p className="mt-2 text-sm font-medium text-red-600">
                            Agotado o no disponible. Elimínalo para continuar.
                          </p>
                        ) : item.quantity > item.product.stock ? (
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Solo quedan {item.product.stock} unidades. Ajusta la cantidad.
                          </p>
                        ) : !Number.isInteger(item.quantity) || item.quantity <= 0 ? (
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            La cantidad no es válida. Elimina el producto y agrégalo de nuevo.
                          </p>
                        ) : null}

                        {/* Controles */}
                        <div className="mt-4 flex items-center justify-between gap-3">

                          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition hover:bg-white hover:text-pink-600 hover:shadow"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={15} />
                            </button>

                            <span aria-live="polite" className="w-9 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >=
                                item.product.stock
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition hover:bg-white hover:text-pink-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={15} />
                            </button>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.product.id
                              )
                            }
                            aria-label={`Eliminar ${item.product.name} del carrito`}
                            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">
                              Eliminar
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-gray-400">
                          Subtotal
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          $
                          {subtotal.toLocaleString(
                            "es-CO"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Resumen */}
            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-28">

              <h2 className="text-xl font-bold text-gray-900">
                Resumen de compra
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Productos
                  </span>

                  <span className="font-medium text-gray-900">
                    $
                    {totalPrice.toLocaleString(
                      "es-CO"
                    )}
                  </span>
                </div>


                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="text-right font-medium text-gray-900">
                    {SHIPPING_CONFIRMATION}
                  </span>
                </div>
                {totalPrice > 0 && (
                  <p className="rounded-xl bg-pink-50 px-4 py-3 text-xs leading-5 text-pink-800">
                    El costo del envío se acuerda contigo por WhatsApp. Entrega estimada: {SHIPPING_ESTIMATE}.
                  </p>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      Total de productos
                    </span>

                    <span className="text-2xl font-bold text-pink-600">
                      $
                      {totalPrice.toLocaleString(
                        "es-CO"
                      )}
                    </span>
                  </div>
                </div>

              </div>


              {/* Comprar */}
            <button
  type="button"
  onClick={() => {
    window.location.href = "/checkout";
  }}
  className="
    mt-8
    w-full
    rounded-full
    bg-pink-600
    px-6
    py-4
    text-white
    font-bold
    text-lg
    shadow-lg
    transition-all
    duration-300
    hover:bg-pink-700
    hover:scale-[1.02]
    active:scale-[0.98]
  "
>
  Finalizar compra
</button>

              <p className="mt-4 text-center text-xs text-gray-400">
                Compra segura · Atención personalizada
              </p>

            </aside>
          </div>
        )}
      </section>
    </main>
    <Footer />
    </>
  );
}
