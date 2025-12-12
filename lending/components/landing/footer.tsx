import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50 py-12">
            <div className="container px-6 mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-1.5">
                            <img src="/logo.svg" alt="Viral Reel Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-slate-900">Viral Reel</span>
                    </div>

                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-use" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Support</Link>
                    </div>

                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Viral Reel AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
