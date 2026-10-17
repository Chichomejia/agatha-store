"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Search } from "lucide-react";
import { User } from "firebase/auth";

import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import { getOrders, updateOrderStatus } from "@/services/orderService";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
} from "@/types/Order";
import type { Order, OrderStatus } from "@/types/Order";

type StatusFilter = "todos" | OrderStatus;

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const statusStyles: Record<OrderStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  enviado: "bg-violet-100 text-violet-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOrderDate(value: unknown) {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") date = timestamp.toDate();
  }

  if (!date || Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setOrders(await getOrders());
    } catch (loadError) {
      console.error("Error cargando pedidos:", loadError);
      setError("No se pudieron cargar los pedidos. Revisa Firestore e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      if (!isAuthorizedAdmin(currentUser)) {
        router.replace("/admin/login");
        return;
      }

      setUser(currentUser);
      void loadOrders();
    });

    return () => unsubscribe();
  }, [loadOrders, router]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-CO");

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "todos" || order.status === statusFilter;
      const searchableText = [
        order.orderNumber,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es-CO");

      return matchesStatus && (!term || searchableText.includes(term));
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (
    orderId: string,
    status: OrderStatus,
  ) => {
    if (
      status === "cancelado" &&
      !window.confirm(
        "¿Cancelar este pedido? Se devolverán sus unidades al inventario y no podrás reabrirlo desde esta pantalla.",
      )
    ) {
      return;
    }

    setUpdatingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const result = await updateOrderStatus(orderId, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
      if (result === "sale-created") {
        setNotice("Pedido entregado y venta registrada correctamente.");
      } else if (result === "sale-already-exists") {
        setNotice("Pedido entregado. La venta ya estaba registrada.");
      } else if (result === "sale-excluded") {
        setNotice("El pedido sigue entregado; la venta fue eliminada y no se volverá a crear automáticamente.");
      } else if (result === "sale-skipped-missing-cost") {
        setNotice(
          "El pedido sigue entregado, pero falta el costo privado de uno o más productos. Complétalo en administración y reintenta el registro de la venta.",
        );
      } else if (status === "cancelado") {
        setNotice("Pedido cancelado y unidades devueltas al inventario.");
      }
    } catch (updateError) {
      console.error("Error actualizando estado del pedido:", updateError);
      const code = typeof updateError === "object" && updateError !== null && "code" in updateError
        ? String(updateError.code)
        : "";
      setError(code === "permission-denied"
        ? "Firestore rechazó el cambio. Publica las reglas actualizadas y vuelve a intentarlo. El pedido y el inventario no se modificaron."
        : updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el estado del pedido.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-pink-600" />
          <p className="mt-4 font-medium text-gray-500">Cargando pedidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.push("/admin")}
          className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-600 transition hover:bg-pink-100 hover:text-pink-700"
        >
          <ArrowLeft size={18} />
          Volver al panel
        </button>

        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              Agatha Store
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Pedidos</h1>
            <p className="mt-2 text-gray-500">
              Revisa las compras y actualiza su estado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </header>

        <section className="mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[1fr_240px]">
          <label className="relative block">
            <span className="sr-only">Buscar pedidos</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por número, cliente o teléfono"
              className="min-h-12 w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            >
              <option value="todos">Todos los estados</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-800">
              {orders.length === 0
                ? "Todavía no hay pedidos."
                : "No encontramos pedidos con esos filtros."}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {orders.length > 0 && "Prueba con otro término o estado."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const orderId = order.id ?? order.orderNumber;
              const knownStatus = ORDER_STATUSES.includes(
                order.status as OrderStatus,
              );
              const status = knownStatus
                ? (order.status as OrderStatus)
                : "pendiente";
              const availableStatuses = knownStatus
                ? [status, ...ORDER_STATUS_TRANSITIONS[status]]
                : [];

              return (
                <article
                  key={orderId}
                  className="rounded-3xl bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                          Pedido {order.orderNumber}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[status]}`}
                        >
                          {knownStatus
                            ? statusLabels[status]
                            : order.status || "Estado sin definir"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {formatOrderDate(order.createdAt)}
                      </p>

                      <div className="mt-4 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold">Cliente:</span>{" "}
                          {order.customer?.name || "Sin nombre"}
                        </p>
                        <p>
                          <span className="font-semibold">Teléfono:</span>{" "}
                          {order.customer?.phone || "Sin teléfono"}
                        </p>
                        <p>
                          <span className="font-semibold">Ciudad:</span>{" "}
                          {order.customer?.city || "Sin ciudad"}
                        </p>
                        <p>
                          <span className="font-semibold">Dirección:</span>{" "}
                          {order.customer?.address || "Sin dirección"}
                        </p>
                      </div>

                      <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-600">
                        {order.items.map((item, index) => (
                          <li key={`${item.productId}-${index}`}>
                            {item.quantity} × {item.productName} ·{" "}
                            {formatCurrency(item.subtotal)}
                          </li>
                        ))}
                      </ul>
                      {order.customer?.notes && (
                        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                          <span className="font-semibold">Notas:</span>{" "}
                          {order.customer.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 lg:min-w-56 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <p className="text-sm font-medium text-gray-500">
                        Total del pedido
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <label className="mt-2 text-sm font-semibold text-gray-700">
                        Estado
                        <select
                          value={knownStatus ? status : order.status}
                          disabled={
                            !order.id ||
                            availableStatuses.length === 1 ||
                            !knownStatus ||
                            updatingOrderId === order.id
                          }
                          onChange={(event) =>
                            void handleStatusChange(
                              order.id!,
                              event.target.value as OrderStatus,
                            )
                          }
                          className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base font-normal outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          {!knownStatus && (
                            <option value={order.status}>
                              {order.status || "Estado sin definir"}
                            </option>
                          )}
                          {availableStatuses.map((option) => (
                            <option key={option} value={option}>
                              {statusLabels[option]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {updatingOrderId === order.id && (
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 size={14} className="animate-spin" />
                          Guardando estado...
                        </p>
                      )}
                      {(order.status === "cancelado" ||
                        order.status === "entregado") && (
                        <p className="text-xs text-gray-500">
                          {order.status === "cancelado"
                            ? "El inventario del pedido fue restaurado."
                            : "El pedido queda en Pedidos; la venta se registra por separado."}
                        </p>
                      )}
                      {order.status === "entregado" && order.id && (
                        <>
                          <p className="text-xs text-gray-500">
                            Antes de reintentar, confirma que el costo privado actual sea el correcto para esta venta.
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleStatusChange(order.id!, "entregado")}
                            disabled={updatingOrderId === order.id}
                            className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
                          >
                            {updatingOrderId === order.id
                              ? "Verificando venta…"
                              : "Verificar o reintentar venta"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
