import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL } from "@/lib/storeContact";

export default function Footer() {
  return (
    <footer className="border-t border-pink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-sm font-serif text-2xl font-bold text-pink-600">
            Agatha Store
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
            Productos de belleza seleccionados para acompañar tu rutina y resaltar tu esencia.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">Explora</h2>
          <nav aria-label="Enlaces del pie de página" className="mt-4 flex flex-col items-start gap-3 text-sm text-gray-600">
            <Link href="/productos" className="inline-flex min-h-11 items-center rounded-lg px-1 transition hover:text-pink-600">Productos</Link>
            <Link href="/carrito" className="inline-flex min-h-11 items-center rounded-lg px-1 transition hover:text-pink-600">Mi carrito</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">¿Necesitas ayuda?</h2>
          <p className="mt-4 text-sm text-gray-500">Estamos para atenderte por WhatsApp.</p>
          <a
            href={STORE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-semibold text-pink-700 transition hover:text-pink-800"
          >
            <MessageCircle size={18} /> {STORE_WHATSAPP_DISPLAY}
          </a>
          <div>
            <Link href="/contacto" className="mt-3 inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-gray-600 underline decoration-pink-300 underline-offset-4 transition hover:text-pink-700">
              Ir a contacto
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Agatha Store. Todos los derechos reservados.
      </div>
    </footer>
  );
}
