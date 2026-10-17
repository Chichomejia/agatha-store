import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <Navbar />
      <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">Agatha Store</p>
        <p className="mt-5 text-7xl font-bold tracking-tight text-pink-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">No encontramos esta página</h1>
        <p className="mt-3 max-w-lg leading-7 text-gray-600">
          El enlace pudo cambiar o la página ya no está disponible. Puedes volver al inicio o buscar algo en el catálogo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-pink-200 hover:text-pink-700">
            <ArrowLeft size={18} /> Ir al inicio
          </Link>
          <Link href="/productos" className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700">
            <Search size={18} /> Ver productos
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
