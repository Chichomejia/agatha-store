"use client";

import { CheckCircle2, Heart, X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({
  message,
  onClose,
}: ToastProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-toast-in sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm">
      <div role="status" aria-live="polite" className="flex w-full items-start gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-2xl backdrop-blur-xl">

        {/* Icono */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50">
          <Heart
            size={19}
            className="fill-pink-500 text-pink-500"
          />
        </div>

        {/* Mensaje */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            Stock máximo alcanzado
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {message}
          </p>
        </div>

        {/* Cerrar */}
        <button
          onClick={onClose}
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Cerrar"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
