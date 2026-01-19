import Link from "next/link"
import { Sparkles } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Footer() {
    return (
        <footer className="bg-slate-50 pt-24 pb-12">
            <div className="container px-6 mx-auto">
                {/* Final CTA */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center mb-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[100px]" />
                    </div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Start Your Viral Empire?
                        </h2>
                        <p className="text-slate-300 text-lg mb-8">
                            Join the next generation of creators using AI to dominate social media. Start your free trial today.
                        </p>
                        <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                            <Button size="lg" variant="gradient" className="min-w-[200px]">
                                Start Creating Free
                            </Button>
                        </Link>
                        <p className="text-slate-400 text-sm mt-4">No credit card required</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-slate-200 pb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-1.5">
                                <Image src="/logo.svg" alt="Viral Reel Logo" width={32} height={32} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tighter text-slate-900">Viral Reel</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            The #1 AI tool for creating viral faceless videos. Automate your growth on TikTok, YouTube, and Instagram.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/#features" className="hover:text-slate-900 transition-colors">Features</Link></li>
                            <li><Link href="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link></li>
                            <li><Link href="/#examples" className="hover:text-slate-900 transition-colors">Examples</Link></li>
                            <li><Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/about" className="hover:text-slate-900 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-slate-900 transition-colors">Careers</Link></li>
                            <li><Link href="/legal" className="hover:text-slate-900 transition-colors">Legal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Support</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="mailto:support@viralreel.ai" className="hover:text-slate-900 transition-colors">Contact Support</Link></li>
                            <li><Link href="/help" className="hover:text-slate-900 transition-colors">Help Center</Link></li>
                            <li><Link href="/status" className="hover:text-slate-900 transition-colors">System Status</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Viral Reel AI. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-use" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
