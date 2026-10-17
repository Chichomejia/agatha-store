"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { Product } from "@/types/Product";
import { getAdminProducts, migrateLegacyProductCosts } from "@/services/productService";
import { isAuthorizedAdmin, observeAuth } from "@/services/authService";

export default function AdminProductosPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [migratingCosts, setMigratingCosts] = useState(false);
  const [costMigrationMessage, setCostMigrationMessage] = useState("");
  const [productLoadError, setProductLoadError] = useState("");

  useEffect(() => {
    const unsubscribe = observeAuth((user) => {
      if (!isAuthorizedAdmin(user)) {
        router.replace("/admin/login");
        return;
      }

      loadProducts();
    });

    return () => unsubscribe();
  }, [router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setProductLoadError("");

      const data = await getAdminProducts();
      data.sort((first, second) =>
        first.name.localeCompare(second.name, "es", {
          sensitivity: "base",
          numeric: true,
        }),
      );

      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
      setProductLoadError(code === "permission-denied"
        ? "No se pudieron leer los costos privados. Publica las reglas de Firestore actualizadas e inicia sesión con la cuenta administradora."
        : "No se pudieron cargar los productos y sus costos. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const protectExistingCosts = async () => {
    setMigratingCosts(true);
    setCostMigrationMessage("");
    try {
      const migrated = await migrateLegacyProductCosts();
      setCostMigrationMessage(
        migrated === 0
          ? "Los costos ya están protegidos; no quedan costos públicos por migrar."
          : `Se protegieron los costos de ${migrated} productos.`,
      );
    } catch (migrationError) {
      console.error("Error protegiendo costos de productos:", migrationError);
      setCostMigrationMessage(
        "No se pudo completar. Publica primero las reglas nuevas de Firestore y vuelve a intentarlo.",
      );
    } finally {
      setMigratingCosts(false);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
    });

    setFilteredProducts(filtered);
  }, [search, products]);

  return (
    <main className="min-h-screen bg-pink-50 px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-600 transition hover:bg-pink-100 hover:text-pink-700"
          >
            <ArrowLeft size={18} />
            Volver al panel
          </button>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                Agatha Store
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                Productos
              </h1>

              <p className="mt-2 text-gray-500">
                Administra el catálogo y el inventario.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void protectExistingCosts()}
                disabled={migratingCosts}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-5 py-3 font-bold text-pink-700 shadow-sm transition hover:bg-pink-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {migratingCosts ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                {migratingCosts ? "Protegiendo costos…" : "Proteger costos existentes"}
              </button>
              <button
                onClick={() => router.push("/admin/productos/nuevo")}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-700 sm:w-auto"
              >
                <Plus size={18} />
                Nuevo producto
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-500">
            Después de publicar las reglas de Firestore, usa esta opción una vez para retirar los costos antiguos de los documentos públicos.
          </p>
        </div>

        {costMigrationMessage && (
          <p role="status" className="mb-6 rounded-2xl border border-pink-100 bg-white px-5 py-4 text-sm text-gray-700 shadow-sm">
            {costMigrationMessage}
          </p>
        )}

        {productLoadError && (
          <p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {productLoadError}
          </p>
        )}

        {/* BUSCADOR */}
        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="min-h-12 w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-base outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
            />
          </div>
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />

              <p className="mt-4 text-sm font-medium text-gray-500">
                Cargando productos...
              </p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl bg-white text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50">
              <Package
                size={28}
                className="text-pink-600"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No encontramos productos
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Prueba con otro término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

            {/* CABECERA TABLA */}
            <div className="hidden grid-cols-[80px_1.4fr_1fr_110px_110px_90px_120px] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 md:grid">
              <span>Imagen</span>
              <span>Producto</span>
              <span>Categoría</span>
              <span>Precio</span>
              <span>Costo</span>
              <span>Stock</span>
              <span>Acciones</span>
            </div>

            {/* FILAS */}
            <div className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-pink-50/40 md:grid-cols-[80px_1.4fr_1fr_110px_110px_90px_120px] md:items-center md:px-6"
                >
                  {/* Imagen */}
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Producto */}
                  <div>
                    <p className="font-bold text-gray-900">
                      {product.name}
                    </p>

                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                      {product.description || "Sin descripción"}
                    </p>
                    {product.tones?.length ? (
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-pink-700">
                        Tonos: {product.tones.join(", ")}
                      </p>
                    ) : null}
                  </div>

                  {/* Categoría */}
                  <div>
                    <span className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                      {product.category}
                    </span>
                  </div>

                  {/* Precio */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 md:hidden">Precio de venta</p>
                    <p className="font-bold text-gray-900">
                      ${product.price.toLocaleString("es-CO")}
                    </p>
                  </div>

                  {/* Costo privado */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 md:hidden">Costo de compra</p>
                    <p className="font-semibold text-gray-700">
                      {typeof product.cost === "number"
                        ? `$${product.cost.toLocaleString("es-CO")}`
                        : <span className="text-amber-700">Sin registrar</span>}
                    </p>
                  </div>

                  {/* Stock */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 md:hidden">Stock</p>
                    {product.stock > 5 ? (
                      <span className="font-bold text-green-600">
                        {product.stock}
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="font-bold text-orange-500">
                        {product.stock}
                      </span>
                    ) : (
                      <span className="font-bold text-red-500">
                        Agotado
                      </span>
                    )}
                  </div>

                 {/* Acción */}
<div>
  <button
    onClick={() =>
      router.push(
        `/admin/productos/${product.id}/editar`
      )
    }
    className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
  >
    <Pencil size={15} />
    Editar
  </button>
</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
