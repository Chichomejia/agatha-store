import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import StoreBenefits from "@/components/sections/StoreBenefits";
import FeaturedProducts from "@/components/sections/FeaturedProducts";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fff8fb]">
        <Navbar />
      <Hero />
      <StoreBenefits />
      <FeaturedProducts />
      <Footer />
    </main>
  );
}
