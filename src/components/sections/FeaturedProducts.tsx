"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/Product";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    getProducts()
      .then((items) => {
        if (active) setProducts(items.filter((item) => item.stock > 0).slice(0, 4));
      })
      .catch((loadError: unknown) => {
        console.error("Error cargando productos de inicio:", loadError);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      id="productos-destacados"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-600">Agatha Store</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Productos <span className="text-pink-600">disponibles</span>
          </h2>
          <p className="mt-3 text-gray-500">
            Una muestra actual de nuestro catálogo.
          </p>
        </div>
        <Link
          href="/productos"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 font-semibold text-pink-700 transition hover:gap-3 hover:text-pink-800"
        >
          Ver todo el catálogo <ArrowRight size={18} />
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-white/70 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="mt-3">Cargando productos...</p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-3xl border border-pink-100 bg-white p-8 text-center text-gray-600">
          No pudimos cargar los productos ahora. Puedes ver el catálogo completo e intentarlo de nuevo.
          <div>
            <Link href="/productos" className="mt-4 inline-flex items-center gap-2 font-semibold text-pink-700 hover:text-pink-800">
              Abrir catálogo <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-gray-500">
          Pronto agregaremos productos al catálogo.
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
