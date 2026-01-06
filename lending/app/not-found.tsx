import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 relative flex flex-col">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
            </div>

            <Navbar hideNavLinks />

            <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-32">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="mb-8">
                        <span className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 opacity-20">
                            404
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                        Lost in the Reel?
                    </h1>

                    <p className="text-lg text-slate-600 mb-12 max-w-md mx-auto">
                        The page you're looking for has gone viral in another dimension. Let's get you back to creating.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/">
                            <Button size="lg" variant="gradient" className="min-w-[200px] group">
                                <Home className="mr-2 size-4" />
                                Back to Home
                            </Button>
                        </Link>
                        <Link href="/blog">
                            <Button size="lg" variant="outline" className="min-w-[200px] border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                                Read our Blog
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12 pt-12 border-t border-slate-200">
                        <p className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-widest">
                            Quick Links
                        </p>
                        <div className="flex justify-center gap-8 text-sm text-slate-600">
                            <Link href="/#features" className="hover:text-purple-600 transition-colors">Features</Link>
                            <Link href="/#pricing" className="hover:text-purple-600 transition-colors">Pricing</Link>
                            <Link href="/terms-of-use" className="hover:text-purple-600 transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
