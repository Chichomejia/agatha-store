"use client";

import { useState } from "react";
import Image from "next/image";

import { Eye, Heart, Palette } from "lucide-react";

import LiquidButton from "@/components/ui/LiquidButton";
import GlowCard from "@/components/ui/GlowCard";
import ProductModal from "@/components/product/ProductModal";

import { Product } from "@/types/Product";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { getAvailableStock, getToneStock } from "@/lib/productInventory";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [failedImage, setFailedImage] = useState("");
  const { addToCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(product.id);
  const availableStock = getAvailableStock(product);
  const availableTones = product.tones?.filter((tone) => getToneStock(product, tone) > 0) ?? [];

  const imageFailed = failedImage === product.image;

  return (
    <>
      <GlowCard className="h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-pink-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          {/* =========================
              IMAGEN
          ========================== */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#fff5f9] via-white to-rose-50 p-2 sm:p-3">

            {availableStock <= 0 && (
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

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label={`Vista rápida de ${product.name}`}
              className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md backdrop-blur-md transition hover:bg-white hover:text-pink-600 sm:hidden"
            >
              <Eye size={19} />
            </button>

            {/* Imagen */}
            {product.image && !imageFailed ? (
              <Image
                src={product.image}
                alt={product.name}
                width={800}
                height={800}
                onError={() => setFailedImage(product.image)}
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
                className="product-image h-full w-full rounded-2xl object-contain p-1 drop-shadow-[0_8px_16px_rgba(31,41,55,0.12)] sm:p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-pink-100/80 bg-white/70 px-5 text-center text-sm text-gray-500">
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
                group-hover:bg-black/10
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
                hidden
                transition-all
                duration-300
                sm:flex
                sm:opacity-100
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
          <div className="product-content flex flex-1 flex-col p-3 sm:p-5">

            {/* Categoría */}
            {product.category && (
              <span className="inline-flex min-h-6 w-fit items-center rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-pink-700 sm:text-xs">
                {product.category}
              </span>
            )}

            {/* Nombre */}
            <h3 className="mt-2 line-clamp-2 min-h-10 text-[15px] font-bold leading-snug text-gray-900 sm:min-h-14 sm:text-lg">
              {product.name}
            </h3>

            <div className="mt-3 min-h-[3.25rem]" aria-label={product.tones?.length ? `${availableTones.length} tonos disponibles` : undefined}>
              {product.tones?.length ? (
                <>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[11px]">
                    <Palette size={13} className="text-pink-500" aria-hidden="true" />
                    {availableTones.length > 0 ? `${availableTones.length} tonos disponibles` : "Tonos agotados"}
                  </p>
                  {availableTones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {availableTones.slice(0, 2).map((tone) => (
                        <span key={tone} className="max-w-full truncate rounded-full border border-pink-100 bg-pink-50/80 px-2 py-0.5 text-[10px] font-medium text-pink-800 sm:px-2.5 sm:py-1 sm:text-xs">
                          {tone}
                        </span>
                      ))}
                      {availableTones.length > 2 && (
                        <span className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 sm:px-2.5 sm:py-1 sm:text-xs">
                          +{availableTones.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>


            {/* =========================
                PRECIO + COMPRAR
            ========================== */}
            <div className="mt-auto border-t border-gray-100 pt-3 sm:pt-4">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-lg font-bold tracking-tight text-pink-700 sm:text-xl">
                  ${product.price.toLocaleString("es-CO")}
                </span>
                <span className={`max-w-[52%] truncate rounded-full px-2 py-1 text-[10px] font-semibold sm:max-w-none sm:px-2.5 sm:text-xs ${availableStock <= 0 ? "bg-gray-100 text-gray-500" : availableStock <= 3 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
                  {availableStock <= 0
                    ? "Agotado"
                    : availableStock <= 3
                      ? `${availableStock} disp.`
                      : "Disponible"}
                </span>
              </div>

              <div className="buy-button mt-3 w-full">
                <LiquidButton
                  disabled={availableStock <= 0}
                  className="w-full px-2 py-2.5 text-xs sm:py-3 sm:text-sm"
                  onClick={() => product.tones?.length ? setIsModalOpen(true) : addToCart(product)}
                >
                  {availableStock <= 0 ? "Agotado" : product.tones?.length ? "Elegir tono" : "Agregar"}
                </LiquidButton>
              </div>
            </div>
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
