import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s | Administración Agatha Store",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
