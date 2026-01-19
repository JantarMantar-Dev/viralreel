"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { Sparkles, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface NavbarProps {
    hideNavLinks?: boolean;
}

export function Navbar({ hideNavLinks = false }: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 w-full z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                    <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-1.5">
                        <Image src="/logo.svg" alt="Viral Reel Logo" width={32} height={32} className="w-full h-full object-contain" />
                    </div>
                    Viral Reel
                </Link>

                {!hideNavLinks && (
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="/#how-it-works" className="hover:text-black transition-colors">How It Works</Link>
                        <Link href="/#examples" className="hover:text-black transition-colors">Examples</Link>
                        <Link href="/#features" className="hover:text-black transition-colors">Features</Link>
                        <Link href="/#pricing" className="hover:text-black transition-colors">Pricing</Link>
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/blog" className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 text-sm hover:bg-slate-100 text-slate-600 hover:text-slate-900">
                            Blog
                        </Link>
                        <div className="flex flex-col items-center">
                            <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                                <Button variant="gradient" size="sm">
                                    Start Free Trial
                                </Button>
                            </Link>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">No credit card required</span>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-slate-100 bg-white"
                    >
                        <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                            {!hideNavLinks && (
                                <>
                                    <Link href="/#how-it-works" className="text-lg font-medium text-slate-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>How It Works</Link>
                                    <Link href="/#examples" className="text-lg font-medium text-slate-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>Examples</Link>
                                    <Link href="/#features" className="text-lg font-medium text-slate-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
                                    <Link href="/#pricing" className="text-lg font-medium text-slate-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
                                </>
                            )}
                            <Link href="/blog" className="text-lg font-medium text-slate-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
                            <div className="pt-4 border-t border-slate-100">
                                <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                                    <Button variant="gradient" className="w-full" size="lg">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <p className="text-center text-xs text-slate-500 mt-2">No credit card required</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
