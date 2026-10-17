"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Download, Loader2, MessageCircle, Plus, RefreshCw, Search } from "lucide-react";
import type { FormEvent } from "react";
import type { User } from "firebase/auth";

import { isAuthorizedAdmin, observeAuth } from "@/services/authService";
import { addReceivablePayment, createReceivableFromSale, getReceivablePayments, getReceivables } from "@/services/receivableService";
import { getSales } from "@/services/saleService";
import type { Receivable, ReceivablePayment } from "@/types/Receivable";
import type { Sale } from "@/types/Sale";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: unknown) {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === "string" || typeof value === "number") date = new Date(value);
  else if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") date = timestamp.toDate();
  }
  if (!date || Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function toCsvCell(value: string | number) {
  const text = String(value);
  const safeText = typeof value === "string" && /^[=+@\-\t\r]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function downloadReceivablesCsv(receivables: Receivable[]) {
  const headers = ["Cliente", "Teléfono", "ID de venta", "Fecha de registro", "Total", "Abonado", "Saldo", "Estado"];
  const rows = receivables.map((entry) => [
    entry.clientName,
    entry.clientPhone,
    entry.saleId,
    formatDate(entry.createdAt),
    Number(entry.total) || 0,
    Number(entry.paidTotal) || 0,
    Number(entry.balance) || 0,
    entry.balance > 0 ? "Debe" : "Saldado",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agatha-fiados.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getWhatsAppUrl(phone: string, clientName: string, balance: number) {
  const digits = phone.replace(/\D/g, "");
  const internationalPhone = digits.length === 10 ? `57${digits}` : digits;
  if (internationalPhone.length < 10 || internationalPhone.length > 15) return null;
  const message = `Hola ${clientName}, te escribo de Agatha Store para compartirte el saldo pendiente de ${formatCurrency(balance)}. Si ya realizaste el pago, por favor ignora este mensaje. ¡Gracias!`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

export default function AdminFiadosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "paid">("all");
  const [sortBy, setSortBy] = useState<"recent" | "balance">("recent");
  const [saleId, setSaleId] = useState("");
  const [initialPayment, setInitialPayment] = useState("0");
  const [paymentFor, setPaymentFor] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [expandedReceivableId, setExpandedReceivableId] = useState<string | null>(null);
  const [paymentsByReceivable, setPaymentsByReceivable] = useState<Record<string, ReceivablePayment[]>>({});
  const [loadingPaymentsId, setLoadingPaymentsId] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState("");

  const togglePaymentHistory = async (receivableId: string) => {
    if (expandedReceivableId === receivableId) {
      setExpandedReceivableId(null);
      setPaymentsError("");
      return;
    }
    setExpandedReceivableId(receivableId);
    setPaymentsError("");
    if (paymentsByReceivable[receivableId]) return;
    setLoadingPaymentsId(receivableId);
    try {
      const payments = await getReceivablePayments(receivableId);
      setPaymentsByReceivable((current) => ({ ...current, [receivableId]: payments }));
    } catch (historyError) {
      console.error("Error cargando historial de abonos:", historyError);
      setPaymentsError("No se pudo cargar el historial. Revisa los permisos de lectura de Fiados en Firestore.");
    } finally {
      setLoadingPaymentsId(null);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextReceivables, nextSales] = await Promise.all([getReceivables(), getSales()]);
      setReceivables(nextReceivables);
      setSales(nextSales);
    } catch (loadError) {
      console.error("Error cargando fiados:", loadError);
      const code = typeof loadError === "object" && loadError !== null && "code" in loadError
        ? String(loadError.code)
        : "unknown";
      setError(code === "permission-denied"
        ? "Firestore rechazó la lectura. Revisa que las reglas de acceso estén publicadas para la cuenta administradora."
        : `No se pudieron cargar los fiados. Código: ${code}.`);
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
      void loadData();
    });
    return () => unsubscribe();
  }, [loadData, router]);

  const registeredSaleIds = useMemo(() => new Set(receivables.map((entry) => entry.saleId)), [receivables]);
  const eligibleSales = useMemo(() => sales.filter((sale) => sale.status === "completed" && !registeredSaleIds.has(sale.id)), [sales, registeredSaleIds]);
  const selectedSale = eligibleSales.find((sale) => sale.id === saleId);
  const filteredReceivables = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-CO");
    const matchingReceivables = receivables.filter((entry) => {
      const matchesSearch = `${entry.clientName} ${entry.clientPhone} ${entry.saleId}`.toLocaleLowerCase("es-CO").includes(term);
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "open" && entry.balance > 0)
        || (statusFilter === "paid" && entry.balance <= 0);
      return matchesSearch && matchesStatus;
    });
    if (sortBy === "balance") {
      return matchingReceivables.sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
    }
    return matchingReceivables;
  }, [receivables, search, sortBy, statusFilter]);
  const debtorSummaries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-CO");
    const matchingAccounts = receivables.filter((entry) =>
      `${entry.clientName} ${entry.clientPhone} ${entry.saleId}`.toLocaleLowerCase("es-CO").includes(term),
    );
    const summaries = new Map<string, {
      clientName: string;
      clientPhone: string;
      total: number;
      paidTotal: number;
      balance: number;
      accountCount: number;
    }>();
    matchingAccounts.forEach((entry) => {
      const phone = entry.clientPhone.replace(/\D/g, "");
      const key = phone || entry.clientName.trim().toLocaleLowerCase("es-CO");
      const summary = summaries.get(key) ?? {
        clientName: entry.clientName,
        clientPhone: entry.clientPhone,
        total: 0,
        paidTotal: 0,
        balance: 0,
        accountCount: 0,
      };
      summary.total += Number(entry.total) || 0;
      summary.paidTotal += Number(entry.paidTotal) || 0;
      summary.balance += Number(entry.balance) || 0;
      summary.accountCount += 1;
      summaries.set(key, summary);
    });
    return Array.from(summaries.values())
      .filter((summary) => summary.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [receivables, search]);
  const outstanding = receivables.reduce((sum, entry) => sum + (Number(entry.balance) || 0), 0);
  const totalPaid = receivables.reduce((sum, entry) => sum + (Number(entry.paidTotal) || 0), 0);
  const openAccountsCount = receivables.filter((entry) => entry.balance > 0).length;
  const openDebtorCount = new Set(
    receivables
      .filter((entry) => entry.balance > 0)
      .map((entry) => entry.clientPhone.replace(/\D/g, "") || entry.clientName.trim().toLocaleLowerCase("es-CO")),
  ).size;
  const paidAccountsCount = receivables.length - openAccountsCount;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSale) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createReceivableFromSale(selectedSale, Number(initialPayment));
      setNotice(`Fiado de ${selectedSale.clientName} registrado.`);
      setSaleId("");
      setInitialPayment("0");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo registrar el fiado.");
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentFor) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await addReceivablePayment(paymentFor, Number(paymentAmount), paymentNote);
      try {
        const updatedPayments = await getReceivablePayments(paymentFor);
        setPaymentsByReceivable((current) => ({ ...current, [paymentFor]: updatedPayments }));
        setPaymentsError("");
      } catch (historyError) {
        console.error("Abono guardado, pero no se pudo actualizar el historial:", historyError);
        setPaymentsError("El abono se guardó, pero no se pudo actualizar el historial. Cierra y vuelve a abrirlo.");
        setPaymentsByReceivable((current) => {
          const next = { ...current };
          delete next[paymentFor];
          return next;
        });
      }
      setNotice("Abono registrado correctamente.");
      setPaymentFor(null);
      setPaymentAmount("");
      setPaymentNote("");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo registrar el abono.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return <main className="flex min-h-screen items-center justify-center bg-pink-50"><Loader2 className="h-10 w-10 animate-spin text-pink-600" /></main>;
  }

  return (
    <main className="min-h-screen bg-pink-50 px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => router.push("/admin")} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-600 transition hover:bg-pink-100 hover:text-pink-700"><ArrowLeft size={18} />Volver al panel</button>
        <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">Agatha Store</p><h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Fiados y abonos</h1><p className="mt-2 text-gray-500">Controla los pagos pendientes de tus ventas entregadas.</p></div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => downloadReceivablesCsv(filteredReceivables)} disabled={loading || filteredReceivables.length === 0} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:opacity-50 sm:w-auto"><Download size={18} />Exportar CSV ({filteredReceivables.length})</button>
            <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:opacity-60 sm:w-auto"><RefreshCw size={18} className={loading ? "animate-spin" : ""} />Actualizar</button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Saldo por cobrar</p><p className="mt-2 text-2xl font-bold text-pink-700">{formatCurrency(outstanding)}</p></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Abonos recibidos</p><p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Clientes con saldo pendiente</p><p className="mt-2 text-2xl font-bold text-gray-900">{openDebtorCount}</p></div>
        </section>

        {error && <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

        <form onSubmit={handleCreate} className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Registrar una venta fiada</h2>
          <p className="mt-1 text-sm text-gray-500">Selecciona una venta completada que todavía no esté en este control.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <label className="text-sm font-semibold text-gray-700">Venta
              <select required value={saleId} onChange={(event) => setSaleId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base font-normal outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="">Seleccionar cliente y venta</option>
                {eligibleSales.map((sale) => <option key={sale.id} value={sale.id}>{sale.clientName} · {sale.clientPhone || "Sin teléfono"} · {formatCurrency(sale.total)}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">Abono inicial
              <input type="number" inputMode="numeric" min="0" step="1" max={selectedSale?.total ?? undefined} value={initialPayment} onChange={(event) => setInitialPayment(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 px-3 py-3 text-base font-normal outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
            </label>
            <button type="submit" disabled={!selectedSale || saving} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}Registrar fiado</button>
          </div>
          {selectedSale && <p className="mt-3 text-sm text-gray-500">Saldo inicial: <strong className="text-gray-800">{formatCurrency(selectedSale.total - (Number(initialPayment) || 0))}</strong></p>}
          {eligibleSales.length === 0 && <p className="mt-3 text-sm text-gray-500">No hay ventas completadas nuevas para registrar. Las ventas deben estar entregadas y aparecer en Ventas.</p>}
        </form>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <label className="relative block"><span className="sr-only">Buscar fiados</span><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente o teléfono" className="min-h-12 w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100" /></label>
          <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-gray-700 sm:flex-row sm:items-center sm:justify-end">Ordenar por
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recent" | "balance")} className="min-h-12 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
              <option value="recent">Más recientes</option>
              <option value="balance">Mayor saldo primero</option>
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar cuentas por estado">
            {([
              ["all", `Todas las cuentas (${receivables.length})`],
              ["open", `Cuentas pendientes (${openAccountsCount})`],
              ["paid", `Cuentas saldadas (${paidAccountsCount})`],
            ] as const).map(([filter, label]) => <button key={filter} type="button" aria-pressed={statusFilter === filter} onClick={() => setStatusFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === filter ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-700"}`}>{label}</button>)}
          </div>
        </section>

        {debtorSummaries.length > 0 && <details open className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <summary className="cursor-pointer list-none font-bold text-gray-900">Resumen por cliente · {debtorSummaries.length} con saldo <span className="ml-2 text-sm font-normal text-gray-500">Consolida por teléfono y, si falta, por nombre</span></summary>
          <div className="mt-4 divide-y divide-gray-100">
            {debtorSummaries.map((debtor) => <div key={debtor.clientPhone.replace(/\D/g, "") || debtor.clientName} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-gray-900">{debtor.clientName}</p><p className="text-sm text-gray-500">{debtor.clientPhone || "Sin teléfono"} · {debtor.accountCount} {debtor.accountCount === 1 ? "cuenta" : "cuentas"}</p></div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="grid grid-cols-3 gap-4 text-sm sm:min-w-[390px]"><div><p className="text-gray-500">Total</p><p className="font-semibold text-gray-900">{formatCurrency(debtor.total)}</p></div><div><p className="text-gray-500">Abonado</p><p className="font-semibold text-emerald-700">{formatCurrency(debtor.paidTotal)}</p></div><div><p className="text-gray-500">Debe</p><p className="font-bold text-pink-700">{formatCurrency(debtor.balance)}</p></div></div>{getWhatsAppUrl(debtor.clientPhone, debtor.clientName, debtor.balance) && <a href={getWhatsAppUrl(debtor.clientPhone, debtor.clientName, debtor.balance) ?? undefined} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-50"><MessageCircle size={16} />Contactar</a>}</div>
            </div>)}
          </div>
        </details>}

        {loading ? <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm"><Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" /><p className="mt-3">Cargando fiados...</p></div> : filteredReceivables.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-lg font-semibold text-gray-800">{receivables.length === 0 ? "Todavía no hay fiados registrados." : "No encontramos fiados con esa búsqueda."}</p><p className="mt-2 text-sm text-gray-500">Registra una venta completada arriba para empezar a controlar sus abonos.</p></div> : (
          <div className="space-y-4">
            {filteredReceivables.map((entry) => (
              <article key={entry.id} className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-gray-900">{entry.clientName}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${entry.balance > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{entry.balance > 0 ? "Debe" : "Saldado"}</span></div><p className="mt-2 text-sm text-gray-500">{entry.clientPhone || "Sin teléfono"} · Registrado {formatDate(entry.createdAt)}</p><p className="mt-1 text-xs text-gray-400">Venta: {entry.saleId}</p></div>
                  <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-sm sm:min-w-[420px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><div><p className="text-gray-500">Total</p><p className="mt-1 font-bold text-gray-900">{formatCurrency(entry.total)}</p></div><div><p className="text-gray-500">Abonado</p><p className="mt-1 font-bold text-emerald-700">{formatCurrency(entry.paidTotal)}</p></div><div><p className="text-gray-500">Resta</p><p className="mt-1 font-bold text-pink-700">{formatCurrency(entry.balance)}</p></div></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                  {entry.balance > 0 && <>
                    {getWhatsAppUrl(entry.clientPhone, entry.clientName, entry.balance) && <a href={getWhatsAppUrl(entry.clientPhone, entry.clientName, entry.balance) ?? undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 font-semibold text-emerald-800 transition hover:bg-emerald-50"><MessageCircle size={17} />Contactar por WhatsApp</a>}
                    {paymentFor === entry.id ? <form onSubmit={(event) => void handlePayment(event)} className="grid w-full gap-3 sm:grid-cols-[180px_1fr_auto_auto]"><label className="text-sm font-semibold text-gray-700">Valor del abono<input required type="number" min="1" step="1" max={entry.balance} value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Ej. 10000" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-pink-400" /></label><label className="text-sm font-semibold text-gray-700">Nota (opcional)<input maxLength={160} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder="Ej. Abono en efectivo" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-pink-400" /></label><button type="submit" disabled={saving} className="self-end rounded-xl bg-pink-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Guardando…" : "Guardar abono"}</button><button type="button" onClick={() => setPaymentFor(null)} className="self-end rounded-xl bg-gray-100 px-4 py-2.5 font-semibold text-gray-700">Cancelar</button></form> : <button type="button" onClick={() => { setPaymentFor(entry.id); setPaymentAmount(""); }} className="rounded-xl border border-pink-200 px-4 py-2.5 font-semibold text-pink-700 transition hover:bg-pink-50">Registrar abono</button>}
                  </>}
                  <button type="button" aria-expanded={expandedReceivableId === entry.id} onClick={() => void togglePaymentHistory(entry.id)} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-200">
                    {expandedReceivableId === entry.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    {expandedReceivableId === entry.id ? "Ocultar historial" : "Ver historial de abonos"}
                  </button>
                </div>
                {expandedReceivableId === entry.id && <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <h3 className="font-bold text-gray-800">Historial de pagos</h3>
                  {paymentsError && <p role="alert" className="mt-3 text-sm text-red-700">{paymentsError}</p>}
                  {loadingPaymentsId === entry.id ? <p className="mt-3 text-sm text-gray-500">Cargando historial…</p> : paymentsByReceivable[entry.id]?.length ? <ul className="mt-3 divide-y divide-gray-200">{paymentsByReceivable[entry.id].map((payment) => <li key={payment.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-gray-800">{formatCurrency(payment.amount)}</p><p className="text-sm text-gray-500">{formatDate(payment.date)}</p></div>{payment.note && <p className="text-sm text-gray-600">{payment.note}</p>}</li>)}</ul> : !paymentsError && <p className="mt-3 text-sm text-gray-500">Aún no hay abonos registrados para esta cuenta.</p>}
                </div>}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
