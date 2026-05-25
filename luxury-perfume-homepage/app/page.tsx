import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { CategorySection } from "@/components/category-section";
import { FeaturedProducts } from "@/components/featured-products";
import { WhyChooseUs } from "@/components/why-choose-us";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedProducts />
        <WhyChooseUs />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
