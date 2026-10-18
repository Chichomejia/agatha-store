"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();
  const { favoriteIds } = useFavorites();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const menuOpen = openMenuPath === pathname;

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuPath(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:min-h-20 sm:px-6 sm:py-0">
        <Link
          href="/"
          onClick={() => setOpenMenuPath(null)}
          className="rounded-sm font-[var(--font-playfair)] text-xl font-bold tracking-tight text-pink-600 transition hover:text-pink-700 sm:text-2xl"
        >
          Agatha Store
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 font-medium text-gray-700 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 transition ${pathname === link.href ? "bg-pink-50 text-pink-700" : "text-gray-700 hover:bg-pink-50/70 hover:text-pink-600"}`}>
              {link.label === "Favoritos" && <Heart size={16} aria-hidden="true" />}
              {link.label}
              {link.label === "Favoritos" && favoriteIds.length > 0 && (
                <span className="text-xs text-pink-600">({favoriteIds.length})</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/carrito" aria-label={`Mi carrito: ${totalItems} ${totalItems === 1 ? "producto" : "productos"}, total $${totalPrice.toLocaleString("es-CO")}`} className="group relative flex min-h-11 items-center gap-2 rounded-full sm:gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-pink-50 transition-colors group-hover:bg-pink-100">
              <ShoppingBag size={21} className="text-pink-600" />
              {totalItems > 0 && (
                <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white shadow-md">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400">Mi carrito</p>
              <p className="text-sm font-bold text-gray-800">${totalPrice.toLocaleString("es-CO")}</p>
            </div>
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setOpenMenuPath(menuOpen ? null : pathname)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pink-100 text-gray-700 transition hover:bg-pink-50 hover:text-pink-700 md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Navegación móvil"
        className={`${menuOpen ? "block" : "hidden"} border-t border-pink-100 bg-white px-6 py-3 shadow-lg md:hidden`}
      >
        <div className="mx-auto flex max-w-7xl flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpenMenuPath(null)}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-xl px-3 py-3 font-medium transition ${pathname === link.href ? "bg-pink-50 text-pink-700" : "text-gray-700 hover:bg-pink-50 hover:text-pink-700"}`}
            >
              <span className="inline-flex items-center gap-2">
                {link.label === "Favoritos" && <Heart size={16} aria-hidden="true" />}
                {link.label}
                {link.label === "Favoritos" && favoriteIds.length > 0 && ` (${favoriteIds.length})`}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
