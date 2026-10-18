"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ProductCard from "@/components/product/ProductCard";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import LoadingState from "@/components/ui/LoadingState";
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
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-20"
    >
      <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-600 sm:text-sm">Agatha Store</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Productos <span className="text-pink-600">disponibles</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:mt-3 sm:text-base">
            Una muestra actual de nuestro catálogo.
          </p>
        </div>
        <Link
          href="/productos"
          className="button-secondary min-h-11 w-fit px-4"
        >
          Ver todo el catálogo <ArrowRight size={18} />
        </Link>
      </div>

      {loading ? (
        <LoadingState label="Cargando productos..." />
      ) : error ? (
        <FeedbackMessage tone="error" className="flex-col items-center text-center sm:flex-row sm:text-left">
          <div>
            <p>No pudimos cargar los productos ahora. Puedes ver el catálogo completo e intentarlo de nuevo.</p>
            <Link href="/productos" className="button-secondary mt-3">
              Abrir catálogo <ArrowRight size={17} />
            </Link>
          </div>
        </FeedbackMessage>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-pink-100/80 bg-white p-8 text-center text-gray-500 shadow-sm sm:p-10">
          Pronto agregaremos productos al catálogo.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
