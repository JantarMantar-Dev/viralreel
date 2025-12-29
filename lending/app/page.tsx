import { FAQ } from "@/components/landing/faq"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { Navbar } from "@/components/landing/navbar"
import { Pricing } from "@/components/landing/pricing"
import { RealExamples } from "@/components/landing/real-examples"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <RealExamples />
        <Features />
        <Pricing />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
