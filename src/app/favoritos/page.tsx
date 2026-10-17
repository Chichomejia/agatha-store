"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Loader2 } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/Product";

export default function FavoritesPage() {
  const { favoriteIds, isLoaded: favoritesLoaded } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!favoritesLoaded) return;
    let cancelled = false;

    if (favoriteIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    getProducts()
      .then((allProducts) => {
        if (!cancelled) setProducts(allProducts);
      })
      .catch((loadError) => {
        console.error("No se pudieron cargar los productos favoritos:", loadError);
        if (!cancelled) setError("No pudimos cargar tus favoritos. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [favoriteIds.length, favoritesLoaded]);

  const favoriteProducts = useMemo(() => {
    const ids = new Set(favoriteIds);
    return products.filter((product) => ids.has(product.id));
  }, [favoriteIds, products]);

  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-700">Agatha Store</p>
        <div className="mt-3 flex items-center gap-3">
          <Heart className="fill-pink-600 text-pink-600" size={30} aria-hidden="true" />
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mis favoritos</h1>
        </div>
        <p className="mt-3 text-gray-600">Guarda aquí los productos que quieres volver a encontrar.</p>

        {error && <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div role="status" className="mt-10 rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />
            <p className="mt-3">Cargando tus favoritos…</p>
          </div>
        ) : favoriteProducts.length > 0 ? (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : !error ? (
          <div className="mt-10 rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
            <Heart className="mx-auto text-pink-300" size={40} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {favoriteIds.length > 0 ? "Esos productos ya no están disponibles" : "Aún no tienes favoritos"}
            </h2>
            <p className="mt-2 text-gray-600">Explora el catálogo y toca el corazón de los productos que te gusten.</p>
            <Link href="/productos" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700">
              Explorar productos <ArrowRight size={18} />
            </Link>
          </div>
        ) : null}
      </section>
      <Footer />
    </main>
  );
}
