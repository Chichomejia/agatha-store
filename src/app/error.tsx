"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Error inesperado en la tienda:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8fb] px-6 py-12">
      <section role="alert" className="w-full max-w-lg rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle size={30} aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-pink-600">Agatha Store</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Tuvimos un inconveniente</h1>
        <p className="mt-3 leading-7 text-gray-600">
          No se pudo mostrar esta página. Intenta cargarla de nuevo o vuelve al inicio de la tienda.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => unstable_retry()} className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700">
            <RefreshCw size={18} /> Intentar de nuevo
          </button>
          <Link href="/" className="inline-flex items-center justify-center rounded-full border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:border-pink-200 hover:text-pink-700">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
