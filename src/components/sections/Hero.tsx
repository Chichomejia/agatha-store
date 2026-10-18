"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DEFAULT_HOMEPAGE_SETTINGS,
  getHomepageSettings,
  type HomepageSettings,
} from "@/services/homepageService";

export default function Hero() {
  const [content, setContent] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageFailed = failedImageUrl === content.imageUrl;

  useEffect(() => {
    getHomepageSettings().then(setContent).catch((error) => {
      console.error("No se pudo cargar la portada personalizada:", error);
    });
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#fff8fc] via-pink-50 to-rose-100">
      <div aria-hidden="true" className="absolute -left-28 top-10 -z-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 bottom-0 -z-10 h-96 w-96 rounded-full bg-fuchsia-200/40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-pink-700 shadow-sm sm:px-4 sm:text-xs sm:tracking-[0.2em]">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            {content.eyebrow}
          </p>
          <h1 className="break-words text-[clamp(1.875rem,8vw,3rem)] font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {content.headline}{" "}
            <span className="bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
              {content.highlight}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8">
            {content.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/productos" className="liquid-btn w-full px-7 py-3.5 sm:w-auto">
              Comprar ahora
            </Link>
            <Link href="#productos-destacados" className="button-secondary w-full bg-white/70 px-7 py-3.5 sm:w-auto">
              Ver productos
            </Link>
          </div>
          <p className="mt-7 text-sm font-medium text-gray-500">Belleza y cuidado seleccionados para ti</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-pink-300 to-fuchsia-200 opacity-70 blur-[1px] sm:-inset-5" />
          <div className="relative overflow-hidden rounded-[2rem] bg-pink-100 shadow-2xl shadow-pink-900/20 ring-1 ring-white/70">
            {imageFailed ? (
              <div
                role="img"
                aria-label="Imagen de portada no disponible"
                className="flex h-[min(45vh,420px)] w-full items-center justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-fuchsia-200 px-6 text-center text-base font-semibold text-pink-800 sm:h-[min(72vh,640px)] sm:px-8 sm:text-lg"
              >
                Belleza y cuidado seleccionados para ti
              </div>
            ) : (
              <Image
                src={content.imageUrl || DEFAULT_HOMEPAGE_SETTINGS.imageUrl}
                alt="Belleza y productos de cuidado de Agatha Store"
                width={900}
                height={1100}
                priority
                unoptimized
                onError={() => setFailedImageUrl(content.imageUrl)}
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 70vw, 90vw"
                className="h-[min(45vh,420px)] w-full object-cover object-center sm:h-[min(72vh,640px)]"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/50 to-transparent p-4 pt-16 text-white sm:p-6 sm:pt-20">
              <p className="text-sm font-medium tracking-wide text-white/85">AGATHA STORE</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl">Tu belleza, a tu manera</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
