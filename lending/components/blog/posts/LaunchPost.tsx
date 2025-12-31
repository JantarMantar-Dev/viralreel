import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Zap, Mic, Type } from "lucide-react";
import Link from "next/link";

export default function LaunchPost() {
    return (
        <article className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Article Header */}
            <header className="text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/50 border border-purple-200 text-purple-700 text-sm font-medium mb-4">
                    <Sparkles className="size-3.5" />
                    <span>Product Launch</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                    The Future of Short-Form <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        Video is Here
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Say goodbye to hours of editing. Meet the AI that turns your ideas into viral-worthy shorts in minutes.
                </p>
            </header>

            {/* Main Content */}
            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">
                <p className="lead text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
                    We are thrilled to announce the launch of <strong className="text-purple-600">GetViralReel.com</strong>, a groundbreaking platform designed to democratize video creation.
                </p>

                <p>
                    In an era where TikTok, Instagram Reels, and YouTube Shorts dominate attention spans, the ability to produce high-quality, engaging content consistently is a superpower. But for too long, this superpower was reserved for those with expensive software, professional editing skills, and hours of free time.
                </p>

                <div className="my-12 p-8 bg-slate-50 border border-slate-200 rounded-2xl md:p-10 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                    <div className="relative z-10 text-center">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 mt-0">ViralReel changes that today.</h3>
                        <p className="text-lg text-slate-600 mb-0">
                            It's not just a tool; it's your 24/7 video production team.
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <h2 className="flex items-center gap-3 text-3xl font-bold text-slate-900 mt-16 mb-8 group">
                    <span className="flex items-center justify-center size-10 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                        <Zap className="size-6" />
                    </span>
                    Key Features at Launch
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mb-16">
                    <FeatureCard
                        icon={<Type className="size-5 text-blue-600" />}
                        title="Script-to-Video AI"
                        description="Just describe your video idea, and our AI writes a compelling script, selects relevant stock footage, and syncs everything perfectly."
                        color="bg-blue-50 border-blue-100"
                    />
                    <FeatureCard
                        icon={<Mic className="size-5 text-purple-600" />}
                        title="AI Voiceovers"
                        description="Choose from a library of hyper-realistic AI voices to narrate your content with the perfect tone and emotion."
                        color="bg-purple-50 border-purple-100"
                    />
                    <FeatureCard
                        icon={<CheckCircle2 className="size-5 text-green-600" />}
                        title="Automated Captions"
                        description="Maximize engagement with auto-generated, stylish captions that keep viewers hooked even with sound off."
                        color="bg-green-50 border-green-100"
                    />
                    <FeatureCard
                        icon={<Sparkles className="size-5 text-amber-600" />}
                        title="Dynamic Editing"
                        description="Our engine applies professional transitions and pacing techniques to ensure high retention rates without you lifting a finger."
                        color="bg-amber-50 border-amber-100"
                    />
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Why We Built This</h2>
                <p>
                    We noticed a huge gap in the market. Tools were either too complex (Premiere Pro, DaVinci) or too basic (templates that all look the same). We wanted to build something that offered <em>creative freedom</em> without the <em>technical barrier</em>. ViralReel maintains the quality of professional editing but creates it algorithmically.
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Getting Started</h2>
                <p>
                    The platform is live right now. You can sign up for a free account, explore our dashboard, and create your first AI-generated video in under 5 minutes.
                </p>
            </div>

            {/* CTA Section */}
            <div className="mt-20 text-center bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-slate-900 z-0"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h3 className="text-3xl md:text-4xl font-bold">Ready to go viral?</h3>
                    <p className="text-slate-300 text-lg">
                        Join thousands of creators who are scaling their content creation with ViralReel.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 hover:text-purple-600 transition-all w-full sm:w-auto font-semibold rounded-full whitespace-nowrap" asChild>
                            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                                Get Started for Free <ArrowRight className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
    return (
        <div className={`p-6 rounded-2xl border ${color} transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-600 text-[15px] leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}
