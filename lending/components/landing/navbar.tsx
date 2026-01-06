import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

import { Sparkles } from "lucide-react"

interface NavbarProps {
    hideNavLinks?: boolean;
}

export function Navbar({ hideNavLinks = false }: NavbarProps) {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                    <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-1.5">
                        <Image src="/logo.svg" alt="Viral Reel Logo" width={32} height={32} className="w-full h-full object-contain" />
                    </div>
                    Viral Reel
                </Link>

                {!hideNavLinks && (
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="/#features" className="hover:text-black transition-colors">Features</Link>
                        <Link href="/#pricing" className="hover:text-black transition-colors">Pricing</Link>
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    <Link href="/blog" className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 text-sm hover:bg-slate-100 text-slate-600 hover:text-slate-900">
                        Blog
                    </Link>
                    <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                        <Button variant="gradient" size="sm">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
