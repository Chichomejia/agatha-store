"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { User } from "firebase/auth";

import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import { deleteSale, getSales } from "@/services/saleService";
import { getReceivables } from "@/services/receivableService";
import type { Sale } from "@/types/Sale";
import type { Receivable } from "@/types/Receivable";

type SaleStatusFilter = "todos" | "pending" | "completed" | "cancelled";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSaleDate(value: unknown) {
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

function toCsvCell(value: string | number) {
  const text = String(value);
  const safeText = typeof value === "string" && /^[=+@\-\t\r]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

function downloadSalesCsv(sales: Sale[]) {
  const headers = [
    "ID",
    "Pedido relacionado",
    "Cliente",
    "Teléfono",
    "Fecha",
    "Estado",
    "Total",
    "Ganancia",
    "Productos",
    "Notas",
  ];
  const rows = sales.map((sale) => [
    sale.id,
    sale.orderNumber ?? "Venta manual",
    sale.clientName ?? "",
    sale.clientPhone ?? "",
    formatSaleDate(sale.date),
    statusLabels[sale.status] ?? sale.status ?? "",
    Number.isFinite(Number(sale.total)) ? Number(sale.total) : 0,
    Number.isFinite(Number(sale.profit)) ? Number(sale.profit) : 0,
    sale.items
      .map((item) => `${item.quantity} x ${item.productName}${item.tone ? ` (${item.tone})` : ""}`)
      .join("; "),
    sale.notes ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agatha-ventas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminVentasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [receivablesError, setReceivablesError] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>("todos");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSales(await getSales());
      try {
        setReceivables(await getReceivables());
        setReceivablesError(false);
      } catch (receivablesLoadError) {
        console.error("No se pudo cargar el estado de los fiados:", receivablesLoadError);
        setReceivables([]);
        setReceivablesError(true);
      }
    } catch (loadError) {
      console.error("Error cargando ventas:", loadError);
      const code =
        typeof loadError === "object" && loadError !== null && "code" in loadError &&
        typeof loadError.code === "string"
          ? loadError.code
          : "unknown";
      setError(
        code === "permission-denied"
          ? "Firestore rechazó la lectura de sales. Revisa las reglas de acceso para el administrador."
          : `No se pudieron cargar las ventas. Código de Firestore: ${code}.`,
      );
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
      void loadSales();
    });

    return () => unsubscribe();
  }, [loadSales, router]);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-CO");

    return sales.filter((sale) => {
      const matchesStatus =
        statusFilter === "todos" || sale.status === statusFilter;
      const searchableText = [
        sale.id,
        sale.orderNumber,
        sale.clientName,
        sale.clientPhone,
        ...sale.items.map((item) => item.productName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es-CO");

      return matchesStatus && (!term || searchableText.includes(term));
    });
  }, [sales, search, statusFilter]);

  const handleDeleteSale = async (sale: Sale) => {
    const confirmed = window.confirm(
      `¿Eliminar la venta de ${sale.clientName || "este cliente"} por ${formatCurrency(sale.total)}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingSaleId(sale.id);
    setError("");
    setNotice("");
    try {
      await deleteSale(sale);
      setSales((currentSales) => currentSales.filter((entry) => entry.id !== sale.id));
      setNotice("Venta eliminada. No volverá a aparecer al reintentar desde el pedido.");
    } catch (deleteError) {
      console.error("Error eliminando venta:", deleteError);
      const code = typeof deleteError === "object" && deleteError !== null && "code" in deleteError
        ? String(deleteError.code)
        : "";
      setError(code === "permission-denied"
        ? "Firestore rechazó la eliminación. Publica las reglas actualizadas e inténtalo de nuevo."
        : deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la venta.");
    } finally {
      setDeletingSaleId(null);
    }
  };

  if (loading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-pink-600" />
          <p className="mt-4 font-medium text-gray-500">Cargando ventas...</p>
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
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Ventas</h1>
            <p className="mt-2 text-gray-500">
              Historial de ventas registradas en Firestore.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/fiados")}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 sm:w-auto"
            >
              Ver fiados y abonos
            </button>
            <button
              type="button"
              onClick={() => downloadSalesCsv(filteredSales)}
              disabled={loading || filteredSales.length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download size={18} />
              Exportar CSV ({filteredSales.length})
            </button>
            <button
              type="button"
              onClick={() => void loadSales()}
              disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[1fr_240px]">
          <label className="relative block">
            <span className="sr-only">Buscar ventas</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, teléfono, producto o ID"
              className="min-h-12 w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as SaleStatusFilter)
              }
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            >
              <option value="todos">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
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

        {receivablesError && !error && (
          <p role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudo consultar el estado de los fiados. Publica las reglas actualizadas de Firestore para ver esta información.
          </p>
        )}

        {notice && (
          <p role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3">Cargando ventas...</p>
          </div>
        ) : error ? null : filteredSales.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-800">
              {sales.length === 0
                ? "Todavía no hay ventas registradas."
                : "No encontramos ventas con esos filtros."}
            </p>
            {sales.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Prueba con otro cliente, producto, teléfono o estado.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <article
                key={sale.id}
                className="rounded-3xl bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {sale.clientName || "Venta"}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          statusStyles[sale.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabels[sale.status] ?? (sale.status || "Estado sin definir")}
                      </span>
                      {sale.status === "completed" && (() => {
                        const receivable = receivables.find((entry) => entry.saleId === sale.id);
                        const paymentLabel = receivable
                          ? receivable.balance > 0
                            ? `Fiado · abonó ${formatCurrency(receivable.paidTotal)} · resta ${formatCurrency(receivable.balance)}`
                            : `Fiado saldado · ${formatCurrency(receivable.paidTotal)} abonados`
                          : "Sin fiado registrado";
                        const paymentStyle = receivable
                          ? receivable.balance > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600";
                        return <span className={`rounded-full px-3 py-1 text-xs font-bold ${paymentStyle}`}>{paymentLabel}</span>;
                      })()}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {formatSaleDate(sale.date)} · {sale.clientPhone || "Sin teléfono"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {sale.orderNumber
                        ? `Pedido relacionado: ${sale.orderNumber}`
                        : `ID de venta: ${sale.id}`}
                    </p>

                    <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-600">
                      {sale.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`}>
                          {item.quantity} × {item.productName}{item.tone ? ` · Tono: ${item.tone}` : ""} · {formatCurrency(item.priceAtSale * item.quantity)}
                        </li>
                      ))}
                    </ul>
                    {sale.notes && (
                      <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        <span className="font-semibold">Notas:</span> {sale.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 lg:min-w-56 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">Ganancia</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      {formatCurrency(sale.profit)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSale(sale)}
                      disabled={deletingSaleId === sale.id}
                      className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {deletingSaleId === sale.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {deletingSaleId === sale.id ? "Eliminando…" : "Eliminar venta"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
