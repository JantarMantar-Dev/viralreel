import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { WaitlistModal } from "@/components/waitlist-modal"

export function Pricing() {
    return (
        <section id="pricing" className="py-24 relative">
            <div className="container px-6 mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose Your Plan</h2>
                    <p className="text-zinc-400 text-lg">
                        Select a plan to continue creating your series
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Creator Plan */}
                    <Card className="p-8 relative bg-white border-slate-200 shadow-lg flex flex-col hover:border-purple-200 transition-all duration-300">
                        <div className="mb-0 text-center">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Creator</h3>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-lg text-slate-400 line-through">$39</span>
                                <span className="text-4xl font-bold text-slate-900">$29</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <div className="flex justify-center mb-4">
                                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100">Launch Pricing</Badge>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">Perfect for daily creators.</p>
                            <p className="text-xs font-medium text-slate-400 mb-8">Effective cost: <span className="text-slate-900">$0.96 per video</span></p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                '30 premium videos per month',
                                'All voices & styles',
                                'High-speed generation',
                                'Auto-post to YouTube',
                                'TikTok/IG auto-post (coming soon)',
                                'Create unlimited niches',
                                'Full copyright-safe music',
                                'Commercial use included'
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-slate-700 text-sm">
                                    <Check className="size-4 text-purple-600 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <WaitlistModal>
                            <Button className="w-full bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 hover:border-purple-200">Start Monthly Plan</Button>
                        </WaitlistModal>
                    </Card>

                    {/* Creator Plus Plan */}
                    <Card className="p-8 relative border-2 border-purple-500 bg-white shadow-xl shadow-purple-100 flex flex-col transform md:-translate-y-4">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none px-4 py-1.5 shadow-lg">MOST POPULAR</Badge>
                        </div>
                        <div className="mb-0 text-center">
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">Creator Plus</h3>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-lg text-slate-400 line-through">$59</span>
                                <span className="text-4xl font-bold text-slate-900">$39</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <div className="flex justify-center mb-4">
                                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100">Launch Pricing</Badge>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">Double the videos. Best deal.</p>
                            <p className="text-xs font-medium text-slate-400 mb-8">Effective cost: <span className="text-slate-900">$0.65 per video</span></p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                '60 premium videos per month',
                                'Priority generation',
                                'Auto-post to YouTube',
                                'TikTok/IG auto-post (coming soon)',
                                'All voices, styles, transitions',
                                'Multi-niche workflows',
                                'Early access to new features'
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-slate-700 text-sm">
                                    <div className="mt-0.5 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-[2px]">
                                        <Check className="size-3 text-white" strokeWidth={3} />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <WaitlistModal>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-200">
                                Join Creator Plus
                            </Button>
                        </WaitlistModal>
                    </Card>

                    {/* Starter Pack */}
                    <Card className="p-8 relative bg-white border-slate-200 shadow-lg flex flex-col hover:border-purple-200 transition-all duration-300">
                        <div className="mb-0 text-center">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter Pack</h3>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="text-4xl font-bold text-slate-900">$14.99</span>
                                <span className="text-slate-500 text-sm">(one-time)</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-12">Perfect for testing the tool or trying multiple niches. No commitment.</p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                '10 premium videos',
                                'All voices & styles included',
                                'Videos never expire',
                                'No subscription required',
                                'Upgrade anytime'
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-slate-700 text-sm">
                                    <Check className="size-4 text-purple-600 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <WaitlistModal>
                            <Button className="w-full bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 hover:border-purple-200">Try the Starter Pack</Button>
                        </WaitlistModal>
                    </Card>
                </div>
            </div>
        </section>
    )
}
