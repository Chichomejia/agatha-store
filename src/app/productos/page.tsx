"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import LoadingState from "@/components/ui/LoadingState";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/Product";

type AvailabilityFilter = "all" | "available" | "sold-out";
type SortOption = "name-asc" | "recommended" | "price-asc" | "price-desc";

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      setProducts(await getProducts());
    } catch (loadError) {
      console.error("Error cargando productos:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category.trim()).filter(Boolean)),
      ).sort((first, second) => first.localeCompare(second, "es")),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-CO");
    const minimum = minPrice.trim() === "" ? null : Number(minPrice);
    const maximum = maxPrice.trim() === "" ? null : Number(maxPrice);

    const filtered = products.filter((product) => {
      const matchesSearch =
        !term ||
        [product.name, product.category, product.description]
          .join(" ")
          .toLocaleLowerCase("es-CO")
          .includes(term);
      const matchesCategory =
        categoryFilter === "all" || product.category.trim() === categoryFilter;
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && product.stock > 0) ||
        (availability === "sold-out" && product.stock <= 0);
      const matchesMinimum = minimum === null || product.price >= minimum;
      const matchesMaximum = maximum === null || product.price <= maximum;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesMinimum &&
        matchesMaximum
      );
    });

    if (sort === "name-asc") {
      filtered.sort((first, second) =>
        first.name.localeCompare(second.name, "es", {
          sensitivity: "base",
          numeric: true,
        }),
      );
    }
    if (sort === "price-asc") filtered.sort((first, second) => first.price - second.price);
    if (sort === "price-desc") filtered.sort((first, second) => second.price - first.price);

    return filtered;
  }, [products, search, categoryFilter, availability, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setAvailability("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("name-asc");
  };

  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <Navbar />

      <section className="bg-gradient-to-br from-pink-100 via-[#fff3f8] to-white px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-14 sm:pt-16">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-700 sm:text-sm">
          Agatha Store
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
          Encuentra tus <span className="text-pink-600">favoritos</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
          Explora el catálogo, compara opciones y elige lo que acompaña mejor tu rutina.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-7 rounded-3xl border border-pink-100/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50">
                <SlidersHorizontal size={17} className="text-pink-600" />
              </span>
              Filtra el catálogo
            </div>
            {(search || categoryFilter !== "all" || availability !== "all" || minPrice || maxPrice) && (
              <button type="button" onClick={clearFilters} className="min-h-10 rounded-full px-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-100">
                Limpiar
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
            <label className="relative block xl:col-span-2">
              <span className="sr-only">Buscar producto</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="min-h-12 w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-base outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </label>
            <label>
              <span className="sr-only">Categoría</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="all">Todas las categorías</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Disponibilidad</span>
              <select value={availability} onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)} className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="all">Cualquier disponibilidad</option>
                <option value="available">Disponible</option>
                <option value="sold-out">Agotado</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Precio mínimo</span>
              <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Precio desde" className="min-h-12 w-full rounded-xl border border-gray-200 px-3 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label>
              <span className="sr-only">Precio máximo</span>
              <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Precio hasta" className="min-h-12 w-full rounded-xl border border-gray-200 px-3 py-3 text-base outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <span className="sr-only">Ordenar productos</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="name-asc">Nombre: A–Z</option>
                <option value="recommended">Orden del catálogo</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Cargando productos..." />
        ) : error ? (
          <FeedbackMessage tone="error" className="flex-col items-center text-center sm:flex-row sm:text-left">
            <div>
              <p>No pudimos cargar el catálogo en este momento.</p>
              <button type="button" onClick={() => void loadProducts()} className="button-secondary mt-3">Intentar de nuevo</button>
            </div>
          </FeedbackMessage>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-pink-100/80 bg-white p-8 text-center shadow-sm sm:p-12">
            <p className="text-lg font-semibold text-gray-800">No hay productos disponibles por ahora.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-pink-100/80 bg-white p-8 text-center shadow-sm sm:p-12">
            <p className="text-lg font-semibold text-gray-800">No encontramos productos con esos filtros.</p>
            <button type="button" onClick={clearFilters} className="mt-4 font-semibold text-pink-700 underline underline-offset-4">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <p className="mb-4 inline-flex min-h-9 items-center rounded-full border border-pink-100 bg-white px-4 text-sm text-gray-600 shadow-sm sm:mb-5" aria-live="polite">
              {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"} de {products.length}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
