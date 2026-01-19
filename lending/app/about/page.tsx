import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Viral Reel",
  description: "Learn about Viral Reel's mission to empower creators with AI tools for faceless video creation.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 relative">
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10">
            <Navbar />
            
            <div className="container mx-auto px-6 py-24 md:py-32 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                    About Viral Reel
                </h1>
                
                <div className="prose prose-lg prose-slate mx-auto">
                    <p className="lead text-xl text-slate-600 mb-12 text-center">
                        We're on a mission to democratize content creation. We believe anyone should be able to build an audience and share their message, regardless of their video editing skills or desire to be on camera.
                    </p>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900">Our Story</h2>
                        <p className="text-slate-600 mb-6">
                            Viral Reel was born from a simple observation: content creation is hard, but it doesn't have to be. We saw talented people struggling with complex editing software and the pressure of being "camera-ready." We knew there had to be a better way.
                        </p>
                        <p className="text-slate-600">
                            By leveraging cutting-edge AI technology, we've built a platform that turns ideas into viral-ready videos in minutes. Whether you're a marketer, entrepreneur, or storyteller, Viral Reel gives you the power to compete with big studios from your laptop.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Speed</h3>
                            <p className="text-slate-500 text-sm">From idea to video in minutes, not hours.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💡</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Innovation</h3>
                            <p className="text-slate-500 text-sm">Powered by the latest advancements in AI.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📈</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Growth</h3>
                            <p className="text-slate-500 text-sm">Designed to maximize engagement and reach.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    </main>
  );
}
