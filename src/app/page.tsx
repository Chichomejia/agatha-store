import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import FeaturedProducts from "@/components/sections/FeaturedProducts";

export default function Home() {
  return (
    <main className="min-h-screen bg-pink-100">
        <Navbar />
      <Hero />
      <FeaturedProducts />
      <Footer />
    </main>
  );
}
