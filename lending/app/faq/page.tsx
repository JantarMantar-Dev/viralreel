import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { FAQ } from "@/components/landing/faq";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Viral Reel",
  description: "Find answers to common questions about Viral Reel, AI video creation, and account management.",
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 relative">
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10">
            <Navbar />
            
            <div className="pt-24 pb-12">
                <FAQ />
            </div>

            <Footer />
        </div>
    </main>
  );
}
