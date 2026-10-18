"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import LoadingState from "@/components/ui/LoadingState";
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

        {error && <FeedbackMessage tone="error" className="mt-8">{error}</FeedbackMessage>}

        {loading ? (
          <LoadingState label="Cargando tus favoritos…" className="mt-10" />
        ) : favoriteProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : !error ? (
          <div className="mt-10 rounded-3xl border border-pink-100/80 bg-white px-6 py-12 text-center shadow-sm sm:py-14">
            <Heart className="mx-auto text-pink-300" size={40} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {favoriteIds.length > 0 ? "Esos productos ya no están disponibles" : "Aún no tienes favoritos"}
            </h2>
            <p className="mt-2 text-gray-600">Explora el catálogo y toca el corazón de los productos que te gusten.</p>
            <Link href="/productos" className="liquid-btn mt-6 min-h-12 gap-2 px-6 py-3 font-semibold">
              Explorar productos <ArrowRight size={18} />
            </Link>
          </div>
        ) : null}
      </section>
      <Footer />
    </main>
  );
}
