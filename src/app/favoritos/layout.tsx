import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis favoritos",
  description: "Encuentra de nuevo los productos de Agatha Store que guardaste.",
};

export default function FavoritesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
