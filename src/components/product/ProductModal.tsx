"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  X,
  Truck,
  MessageCircle,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Product } from "@/types/Product";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { getAvailableStock, getToneStock } from "@/lib/productInventory";

import QuantitySelector from "@/components/ui/QuantitySelector";
import LiquidButton from "@/components/ui/LiquidButton";
import { SHIPPING_CONFIRMATION, SHIPPING_ESTIMATE } from "@/lib/shipping";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({
  product,
  onClose,
}: ProductModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const zoomDialogRef = useRef<HTMLDivElement>(null);
  const zoomCloseButtonRef = useRef<HTMLButtonElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const wasZoomedRef = useRef(false);
  const { addToCart } = useCart();

  /* ==================================================
     GALERÍA
  ================================================== */

  const images = (product.images?.length
    ? product.images
    : [product.image]
  ).filter(Boolean);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImage, setFailedImage] = useState("");

  /* ==================================================
     COMPRA
  ================================================== */

  const [quantity, setQuantity] = useState(1);
  const [toneQuantities, setToneQuantities] = useState<Record<string, number>>({});
  const availableStock = getAvailableStock(product);
  const hasTones = Boolean(product.tones?.length);
  const selectedToneUnits = Object.values(toneQuantities).reduce((sum, count) => sum + count, 0);
  const purchasableStock = hasTones ? availableStock : product.stock;

  /* ==================================================
     FAVORITOS
  ================================================== */

  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(product.id);

  /* ==================================================
     VISOR / ZOOM
  ================================================== */

  const [isImageZoomed, setIsImageZoomed] =
    useState(false);

  const [zoom, setZoom] = useState(1);

  const selectedImage = images[selectedIndex] ?? "";
  const selectedImageFailed = failedImage === selectedImage;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    closeButtonRef.current?.focus();

    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;

      const activeDialog = document.querySelector<HTMLElement>("[data-product-lightbox='true']") ?? dialog;
      const focusable = Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInDialog);
    return () => {
      document.removeEventListener("keydown", keepFocusInDialog);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    if (isImageZoomed) {
      zoomCloseButtonRef.current?.focus();
    } else if (wasZoomedRef.current) {
      zoomTriggerRef.current?.focus();
    }
    wasZoomedRef.current = isImageZoomed;
  }, [isImageZoomed]);

  const total = product.price * (hasTones ? selectedToneUnits : quantity);

  /* ==================================================
     CAMBIAR IMAGEN
  ================================================== */

  const nextImage = () => {
    setSelectedIndex((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );

    setZoom(1);
  };

  const previousImage = () => {
    setSelectedIndex((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );

    setZoom(1);
  };

  /* ==================================================
     ABRIR VISOR
  ================================================== */

  const openImageZoom = () => {
    setZoom(1);
    setIsImageZoomed(true);
  };

  /* ==================================================
     CERRAR VISOR
  ================================================== */

  const closeImageZoom = () => {
    setIsImageZoomed(false);
    setZoom(1);
  };

  /* ==================================================
     ZOOM
  ================================================== */

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(current + 0.25, 3)
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(current - 0.25, 1)
    );
  };

  /* ==================================================
     TECLADO
  ================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      /* Cerrar */

      if (event.key === "Escape") {
        if (isImageZoomed) {
          closeImageZoom();
        } else {
          onClose();
        }

        return;
      }

      /* Las flechas solamente funcionan
         cuando el visor está abierto */

      if (!isImageZoomed) {
        return;
      }

      if (event.key === "ArrowRight") {
        nextImage();
      }

      if (event.key === "ArrowLeft") {
        previousImage();
      }

      /* Zoom con teclado */

      if (event.key === "+" || event.key === "=") {
        zoomIn();
      }

      if (event.key === "-") {
        zoomOut();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isImageZoomed, images.length, onClose]);

  /* ==================================================
     COMPRAR AHORA
  ================================================== */

  const handleBuyNow = () => {
    if (hasTones) {
      const selection = Object.entries(toneQuantities).filter(([, count]) => count > 0);
      if (!selection.length) return;
      selection.forEach(([tone, count]) => addToCart(product, count, tone));
    } else {
      if (purchasableStock <= 0) return;
      addToCart(product, quantity);
    }

    onClose();

    router.push("/carrito");
  };

  const setToneQuantity = (tone: string, count: number) => {
    const stock = getToneStock(product, tone);
    setToneQuantities((current) => ({
      ...current,
      [tone]: Math.max(0, Math.min(stock, count)),
    }));
  };

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <>
      {/* ==================================================
          MODAL PRINCIPAL
      ================================================== */}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${product.name}`}
        className="
          fixed
          inset-0
          z-[100]
          flex
          items-center
          justify-center
          bg-black/70
          p-3
          backdrop-blur-lg
          animate-fade-in
          md:p-6
        "
        onClick={onClose}
      >
        {/* ==================================================
            CONTENEDOR DEL MODAL
        ================================================== */}

        <div
          className="
            relative
            flex
            max-h-[94vh]
            max-h-[94dvh]
            w-full
            max-w-6xl
            flex-col
            overflow-y-auto
            rounded-[2rem]
            border
            border-white/60
            bg-white
            shadow-[0_30px_100px_rgba(0,0,0,0.35)]
            animate-modal-in
            md:flex-row
          "
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* ==================================================
              BOTÓN CERRAR
          ================================================== */}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="
              absolute
              right-4
              top-4
              z-50
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-gray-100
              bg-white/95
              text-gray-600
              shadow-lg
              backdrop-blur-md
              transition-all
              duration-300
              hover:scale-105
              hover:bg-pink-50
              hover:text-pink-600
            "
          >
            <X size={20} />
          </button>

          {/* ==================================================
              GALERÍA
          ================================================== */}

          <div
            className="
              relative
              flex
              min-h-[280px]
              flex-1
              flex-col
              bg-gradient-to-br
              from-pink-50
              via-white
              to-rose-50
              p-5
              sm:min-h-[430px]
              md:min-h-[650px]
              md:p-8
            "
          >
            {/* ==================================================
                IMAGEN PRINCIPAL
            ================================================== */}

            <div
              className="
                relative
                flex
                flex-1
                items-center
                justify-center
                overflow-hidden
                rounded-[1.5rem]
                bg-white/50
              "
            >
              {/* Glow */}

              <div
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  h-[65%]
                  w-[65%]
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-pink-200/30
                  blur-3xl
                "
              />

              {/* Imagen */}

              <button
                ref={zoomTriggerRef}
                type="button"
                onClick={openImageZoom}
                disabled={!selectedImage || selectedImageFailed}
                aria-label="Ver imagen ampliada"
                className="
                  group
                  relative
                  z-10
                  flex
                  h-full
                  w-full
                  cursor-zoom-in
                  items-center
                  justify-center
                  border-0
                  bg-transparent
                  outline-none
                "
              >
                {selectedImage && !selectedImageFailed ? (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    width={1000}
                    height={1000}
                    unoptimized
                    onError={() => setFailedImage(selectedImage)}
                    sizes="(min-width: 768px) 50vw, 90vw"
                    className="
                    max-h-[430px]
                    max-w-[90%]
                    object-contain
                    drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)]
                    transition-all
                    duration-500
                    group-hover:scale-[1.03]
                  "
                  />
                ) : (
                  <span className="rounded-2xl bg-pink-50 px-6 py-10 text-center text-sm font-medium text-gray-500">Imagen no disponible</span>
                )}

                {/* Indicador */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-4
                    left-1/2
                    flex
                    -translate-x-1/2
                    items-center
                    gap-2
                    rounded-full
                    bg-black/60
                    px-4
                    py-2
                    text-xs
                    font-medium
                    text-white
                    opacity-0
                    backdrop-blur-md
                    transition-all
                    duration-300
                    group-hover:opacity-100
                  "
                >
                  🔍 Haz clic para ampliar
                </div>
              </button>

              {/* ==================================================
                  FLECHAS GALERÍA
              ================================================== */}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Imagen anterior"
                    className="
                      absolute
                      left-4
                      top-1/2
                      z-20
                      flex
                      h-11
                      w-11
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      bg-white/90
                      text-gray-700
                      shadow-md
                      backdrop-blur
                      transition-all
                      hover:scale-110
                      hover:text-pink-600
                    "
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Siguiente imagen"
                    className="
                      absolute
                      right-4
                      top-1/2
                      z-20
                      flex
                      h-11
                      w-11
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      bg-white/90
                      text-gray-700
                      shadow-md
                      backdrop-blur
                      transition-all
                      hover:scale-110
                      hover:text-pink-600
                    "
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* ==================================================
                MINIATURAS
            ================================================== */}

            {images.length > 1 && (
              <div className="mt-4 flex justify-center gap-3 overflow-x-auto pb-1" role="group" aria-label="Elegir imagen del producto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() =>
                      setSelectedIndex(index)
                    }
                    aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                    aria-pressed={selectedIndex === index}
                    className={`
                      relative
                      h-16
                      w-16
                      shrink-0
                      overflow-hidden
                      rounded-xl
                      border-2
                      bg-white
                      transition-all
                      duration-300
                      ${
                        selectedIndex === index
                          ? "scale-105 border-pink-500 shadow-lg shadow-pink-200"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }
                    `}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={128}
                      height={128}
                      unoptimized
                      sizes="64px"
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ==================================================
              INFORMACIÓN DEL PRODUCTO
          ================================================== */}

          <div
            className="
              flex
              w-full
              flex-col
              overflow-y-auto
              bg-white
              p-4
              sm:p-6
              md:w-[48%]
              md:p-10
            "
          >
            {/* Categoría */}

            <div className="pr-12">
              <span
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.25em]
                  text-pink-600
                "
              >
                {product.category}
              </span>

              {/* Nombre */}

              <h2
                className="
                  mt-3
                  text-2xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                  md:text-4xl
                "
              >
                {product.name}
              </h2>
            </div>

            {/* ==================================================
                PRECIO
            ================================================== */}

            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Precio
              </p>

              <p
                className="
                  mt-1
                  text-3xl
                  font-extrabold
                  tracking-tight
                  text-pink-600
                "
              >
                ${product.price.toLocaleString("es-CO")}
              </p>
            </div>

            {/* Separador */}

            <div className="my-7 h-px bg-gray-100" />

            {/* ==================================================
                DESCRIPCIÓN
            ================================================== */}

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Sobre el producto
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-gray-600">
                {product.description}
              </p>
            </div>

            {/* ==================================================
                STOCK
            ================================================== */}

            <div className="mt-6">
              {availableStock > 0 ? (
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-green-50
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-green-700
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  Disponible

                  <span className="text-green-600/60">
                    ·
                  </span>

                  {availableStock} {availableStock === 1 ? "unidad" : "unidades"}
                </div>
              ) : (
                <div
                  className="
                    inline-flex
                    rounded-full
                    bg-red-50
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-red-600
                  "
                >
                  Producto agotado
                </div>
              )}
            </div>

            {/* ==================================================
                TONO
            ================================================== */}

            {product.tones && product.tones.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-900" id="product-tone-heading">
                  Elige tonos y cantidades
                </p>
                <div className="space-y-2" role="group" aria-labelledby="product-tone-heading">
                  {product.tones.map((tone) => {
                    const stock = getToneStock(product, tone);
                    const toneQuantity = toneQuantities[tone] ?? 0;
                    return (
                      <div key={tone} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{tone}</p>
                          <p className="text-xs text-gray-500">{stock > 0 ? `${stock} disponibles` : "Agotado"}</p>
                        </div>
                        <div className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-pink-200 bg-white">
                          <button type="button" onClick={() => setToneQuantity(tone, toneQuantity - 1)} disabled={toneQuantity <= 0} aria-label={`Quitar una unidad del tono ${tone}`} className="flex h-10 w-10 items-center justify-center text-lg text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-30">−</button>
                          <span aria-live="polite" aria-label={`${toneQuantity} unidades del tono ${tone}`} className="min-w-9 text-center text-sm font-semibold text-gray-800">{toneQuantity}</span>
                          <button type="button" onClick={() => setToneQuantity(tone, toneQuantity + 1)} disabled={toneQuantity >= stock} aria-label={`Agregar una unidad del tono ${tone}`} className="flex h-10 w-10 items-center justify-center text-lg text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-30">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">Puedes combinar varios tonos. Seleccionados: {selectedToneUnits}.</p>
              </div>
            )}

            {/* ==================================================
                CANTIDAD
            ================================================== */}

            {!hasTones && purchasableStock > 0 && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    Cantidad
                  </p>

                  <span className="text-xs text-gray-400">
                    Máximo {purchasableStock} {purchasableStock === 1 ? "unidad" : "unidades"}
                  </span>
                </div>

                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={purchasableStock}
                />
              </div>
            )}

            {/* ==================================================
                TOTAL
            ================================================== */}

            {((!hasTones && purchasableStock > 0) || (hasTones && selectedToneUnits > 0)) && (
              <div
                className="
                  mt-6
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  bg-gray-50
                  px-5
                  py-4
                "
              >
                <span className="text-sm font-medium text-gray-500">
                  Total
                </span>

                <span className="text-xl font-bold text-slate-900">
                  ${total.toLocaleString("es-CO")}
                </span>
              </div>
            )}

            {/* ==================================================
                BOTONES
            ================================================== */}

            <div className="mt-6 flex items-center gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <LiquidButton
                  disabled={hasTones ? selectedToneUnits <= 0 : purchasableStock <= 0}
                  className="w-full px-2 text-sm leading-tight sm:px-4 sm:text-base"
                  onClick={handleBuyNow}
                >
                  <span className="flex flex-wrap items-center justify-center gap-2 text-center">
                    <ShoppingBag size={18} />
                    {hasTones ? "Agregar selección al carrito" : "Comprar ahora"}
                  </span>
                </LiquidButton>
              </div>

              {/* Favoritos */}

              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                aria-pressed={isFavorite}
                className={`
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  transition-all
                  duration-300
                  ${
                    isFavorite
                      ? "border-pink-200 bg-pink-50 text-pink-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-pink-200 hover:text-pink-600"
                  }
                `}
              >
                <Heart
                  size={20}
                  fill={
                    isFavorite
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>

            {/* ==================================================
                BENEFICIOS
            ================================================== */}

            <div
              className="
                mt-7
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
              "
            >
              {/* Envíos */}

              <div
                className="
                  rounded-2xl
                  border
                  border-gray-100
                  bg-gray-50/70
                  p-3
                  sm:p-4
                "
              >
                <Truck
                  size={20}
                  className="text-pink-600"
                />

                <p className="mt-3 text-sm font-bold text-slate-900">
                  Envíos
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Entrega estimada: {SHIPPING_ESTIMATE}. {SHIPPING_CONFIRMATION}.
                </p>
              </div>

              {/* Atención al cliente */}

              <div
                className="
                  rounded-2xl
                  border
                  border-gray-100
                  bg-gray-50/70
                  p-3
                  sm:p-4
                "
              >
                <MessageCircle
                  size={20}
                  className="text-pink-600"
                />

                <p className="mt-3 text-sm font-bold text-slate-900">
                  Atención directa
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Continúa tu pedido con nosotros por WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          VISOR DE IMAGEN / LIGHTBOX
      ================================================== */}

      {isImageZoomed && (
        <div
          ref={zoomDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${product.name}`}
          data-product-lightbox="true"
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            bg-black/90
            p-4
            backdrop-blur-md
            animate-fade-in
          "
          onClick={closeImageZoom}
        >
          {/* ==================================================
              BOTÓN CERRAR
          ================================================== */}

          <button
            ref={zoomCloseButtonRef}
            type="button"
            onClick={closeImageZoom}
            aria-label="Cerrar imagen"
            className="
              absolute
              right-5
              top-5
              z-50
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              backdrop-blur-md
              transition-all
              hover:scale-110
              hover:bg-white/20
            "
          >
            <X size={24} />
          </button>

          {/* ==================================================
              CONTADOR
          ================================================== */}

          <div
            role="status"
            aria-live="polite"
            className="
              absolute
              left-1/2
              top-6
              z-50
              -translate-x-1/2
              rounded-full
              bg-white/10
              px-4
              py-2
              text-sm
              font-medium
              text-white
              backdrop-blur-md
            "
          >
            {selectedIndex + 1} / {images.length}
          </div>

          {/* ==================================================
              IMAGEN AMPLIADA
          ================================================== */}

          <div
            className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              overflow-hidden
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {selectedImage && !selectedImageFailed ? <Image
              src={selectedImage}
              alt={product.name}
              width={1600}
              height={1600}
              unoptimized
              onError={() => setFailedImage(selectedImage)}
              sizes="90vw"
              className="
                max-h-[90vh]
                max-w-[90vw]
                select-none
                object-contain
                transition-transform
                duration-300
              "
              style={{
                transform: `scale(${zoom})`,
              }}
            /> : (
              <div role="img" aria-label="Imagen del producto no disponible" className="rounded-2xl bg-white/10 px-8 py-12 text-center text-sm font-medium text-white/80 backdrop-blur-sm">
                Imagen no disponible
              </div>
            )}
          </div>

          {/* ==================================================
              IMAGEN ANTERIOR
          ================================================== */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              aria-label="Imagen anterior"
              className="
                absolute
                left-5
                top-1/2
                z-50
                flex
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                backdrop-blur-md
                transition-all
                hover:scale-110
                hover:bg-white/20
              "
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* ==================================================
              SIGUIENTE IMAGEN
          ================================================== */}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              aria-label="Siguiente imagen"
              className="
                absolute
                right-5
                top-1/2
                z-50
                flex
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                backdrop-blur-md
                transition-all
                hover:scale-110
                hover:bg-white/20
              "
            >
              <ChevronRight size={26} />
            </button>
          )}

          {/* ==================================================
              CONTROLES DE ZOOM
          ================================================== */}

          <div
            className="
              absolute
              bottom-6
              left-1/2
              z-50
              flex
              -translate-x-1/2
              items-center
              gap-2
              rounded-2xl
              bg-white/10
              p-2
              backdrop-blur-xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Zoom out */}

            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 1}
              aria-label="Alejar"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-xl
                text-white
                transition-all
                hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              −
            </button>

            {/* Porcentaje */}

            <span
              className="
                min-w-[55px]
                text-center
                text-sm
                font-medium
                text-white
              "
            >
              {Math.round(zoom * 100)}%
            </span>

            {/* Zoom in */}

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 3}
              aria-label="Acercar"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-xl
                text-white
                transition-all
                hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              +
            </button>
          </div>
        </div>
      )}
    </>
  );
}
