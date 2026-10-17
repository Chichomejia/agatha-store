"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Loader2, RefreshCw } from "lucide-react";

import { isAuthorizedAdmin, observeAuth, logoutAdmin } from "@/services/authService";
import { getAdminDashboardMetrics } from "@/services/adminDashboardService";
import type { AdminDashboardMetrics } from "@/services/adminDashboardService";

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [refreshingMetrics, setRefreshingMetrics] = useState(false);
  const [metricsLoadError, setMetricsLoadError] = useState("");

  const loadMetrics = useCallback(async (adminUser: User) => {
    setRefreshingMetrics(true);
    setMetricsLoadError("");

    try {
      setMetrics(await getAdminDashboardMetrics(adminUser));
    } catch (error) {
      console.error("No se pudieron cargar las métricas del panel:", error);
      setMetricsLoadError("No fue posible actualizar las métricas. Inténtalo de nuevo.");
    } finally {
      setRefreshingMetrics(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      if (!currentUser || !isAuthorizedAdmin(currentUser)) {
        router.replace("/admin/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
      void loadMetrics(currentUser);
    });

    return () => unsubscribe();
  }, [loadMetrics, router]);

  const handleLogout = async () => {
    await logoutAdmin();

    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />

          <p className="mt-4 font-medium text-gray-500">
            Cargando panel...
          </p>
        </div>
      </main>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);

  const cards = [
    {
      label: "Productos activos",
      value: metrics
        ? metrics.products === null
          ? "—"
          : metrics.products
        : undefined,
    },
    {
      label: "Pedidos",
      value: metrics
        ? metrics.orders === null
          ? "—"
          : metrics.orders
        : undefined,
    },
    {
      label: "Valor de pedidos",
      hint: "Excluye cancelados e incluye pendientes. No suma el envío acordado por WhatsApp.",
      value: metrics
        ? metrics.orderValue === null
          ? "—"
          : formatCurrency(metrics.orderValue)
        : undefined,
    },
    {
      label: "Ventas completadas",
      hint: "Suma ventas con estado completed; otros estados históricos no se incluyen.",
      value: metrics
        ? metrics.completedSalesValue === null
          ? "—"
          : formatCurrency(metrics.completedSalesValue)
        : undefined,
    },
  ];

  return (
    <main className="min-h-screen bg-pink-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              Agatha Store
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Panel administrativo
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Bienvenido, {user?.email}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => user && void loadMetrics(user)}
              disabled={refreshingMetrics}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:text-pink-600 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {refreshingMetrics ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Actualizar métricas
            </button>
            <button
              onClick={handleLogout}
              className="min-h-12 w-full rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 sm:w-auto"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p
                className="mt-3 text-4xl font-bold text-gray-900"
                aria-live="polite"
              >
                {card.value ?? "…"}
              </p>
              {"hint" in card && card.hint && (
                <p className="mt-2 text-xs text-gray-500">{card.hint}</p>
              )}
            </div>
          ))}

          <button
            onClick={() => router.push("/admin/productos")}
            className="min-h-40 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <p className="text-sm font-medium text-gray-500">Gestión</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Administrar productos
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Crear, editar, actualizar precios y controlar stock.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/pedidos")}
            className="min-h-40 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <p className="text-sm font-medium text-gray-500">Gestión</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Gestionar pedidos
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Consultar compras y actualizar su estado.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/ventas")}
            className="min-h-40 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <p className="text-sm font-medium text-gray-500">Gestión</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Consultar ventas
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Revisar montos, productos y ganancias registradas.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/fiados")}
            className="min-h-40 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <p className="text-sm font-medium text-gray-500">Gestión</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Fiados y abonos
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Consulta quién debe, registra abonos y revisa el saldo pendiente.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/portada")}
            className="min-h-40 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <p className="text-sm font-medium text-gray-500">Tienda</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Editar portada
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Cambia el mensaje principal y la imagen de inicio.
            </p>
          </button>
        </section>

        {metricsLoadError && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {metricsLoadError}
          </p>
        )}

        {metrics && Object.keys(metrics.errors).length > 0 && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            Firestore rechazó la lectura de pedidos o ventas. En Firebase Console,
            publica las reglas de Firestore del proyecto agatha-store05 y confirma
            que la función isAdmin permita la cuenta {user?.email}. Luego cierra
            sesión y vuelve a entrar. La consulta del panel ya renueva la sesión
            antes de leer; no habilites estas colecciones para usuarios públicos.
          </p>
        )}
      </div>
    </main>
  );
}
