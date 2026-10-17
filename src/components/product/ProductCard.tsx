"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Eye, Heart } from "lucide-react";

import LiquidButton from "@/components/ui/LiquidButton";
import GlowCard from "@/components/ui/GlowCard";
import ProductModal from "@/components/product/ProductModal";

import { Product } from "@/types/Product";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { addToCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(product.id);

  useEffect(() => {
    setImageFailed(false);
  }, [product.image]);

  return (
    <>
      <GlowCard>
        <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">

          {/* =========================
              IMAGEN
          ========================== */}
          <div className="relative h-56 overflow-hidden sm:h-64">

            {product.stock <= 0 && (
              <span className="absolute left-4 top-4 z-20 rounded-full bg-gray-900/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                Agotado
              </span>
            )}

            {/* Favoritos */}
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={isFavorite}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Heart
                size={19}
                className={
                  isFavorite
                    ? "fill-pink-600 text-pink-600"
                    : "text-gray-700"
                }
              />
            </button>

            {/* Imagen */}
            {product.image && !imageFailed ? (
              <Image
                src={product.image}
                alt={product.name}
                width={800}
                height={800}
                unoptimized
                onError={() => setImageFailed(true)}
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-pink-50 px-5 text-center text-sm text-gray-500">
                Imagen no disponible
              </div>
            )}

            {/* Overlay */}
            <div
              className="
                absolute
                inset-0
                bg-black/0
                transition-all
                duration-500
                group-hover:bg-black/20
              "
            />

            {/* =========================
                VISTA RÁPIDA
            ========================== */}
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                opacity-100
                transition-all
                duration-300
              "
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="
                  quick-view-btn
                  flex
                  min-h-11
                  items-center
                  gap-2
                  rounded-full
                  bg-white
                  px-5
                  py-2
                  font-semibold
                  text-pink-600
                  shadow-xl
                  transition-all
                  duration-300
                  hover:bg-pink-50
                "
              >
                <Eye size={18} />

                Vista rápida
              </button>
            </div>
          </div>

          {/* =========================
              INFORMACIÓN
          ========================== */}
          <div className="product-content p-6">

            {/* Categoría */}
            {product.category && (
              <span className="text-sm font-semibold text-pink-600">
                {product.category}
              </span>
            )}

            {/* Nombre */}
            <h3 className="mt-2 text-xl font-bold text-gray-900">
              {product.name}
            </h3>


            {/* =========================
                PRECIO + COMPRAR
            ========================== */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-2xl font-bold text-pink-600">
                ${product.price.toLocaleString("es-CO")}
              </span>

              <div className="buy-button w-full sm:w-auto">
                <LiquidButton
                  disabled={product.stock <= 0}
                  className="w-full sm:w-auto"
                  onClick={() => addToCart(product)}
                >
                  {product.stock <= 0 ? "Agotado" : "Agregar"}
                </LiquidButton>
              </div>

            </div>
            <p className={`mt-3 text-xs font-medium ${product.stock > 0 ? "text-emerald-700" : "text-gray-500"}`}>
              {product.stock > 0
                ? product.stock <= 3
                  ? `${product.stock} ${product.stock === 1 ? "unidad disponible" : "unidades disponibles"}`
                  : "Disponible"
                : "Sin unidades disponibles"}
            </p>
          </div>
        </div>
      </GlowCard>

      {/* =========================
          MODAL
      ========================== */}
      {isModalOpen && (
        <ProductModal
          product={product}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
