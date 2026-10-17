import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Agatha Store | Belleza, maquillaje y cuidado personal",
    template: "%s | Agatha Store",
  },
  description:
    "Encuentra maquillaje y productos de cuidado facial, corporal y capilar seleccionados para ti.",
  applicationName: "Agatha Store",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Agatha Store",
    title: "Belleza que inspira confianza | Agatha Store",
    description:
      "Maquillaje y productos de cuidado facial, corporal y capilar seleccionados para ti.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body
        className={`${poppins.variable} ${playfair.variable} antialiased`}
      >
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
