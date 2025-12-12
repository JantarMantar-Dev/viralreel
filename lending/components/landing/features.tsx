import { Card } from "@/components/ui/card"
import { Clock, Share2, TrendingUp, Zap, Globe, Layers } from "lucide-react"

const features = [
    {
        icon: Clock,
        title: "Works 24/7 Autopilot",
        description: "Your AI agent never sleeps. It researches, edits, and posts content while you dream.",
    },
    {
        icon: Share2,
        title: "Multi-Platform Posting",
        description: "One click to publish to TikTok, Instagram Reels, and YouTube Shorts simultaneously.",
    },
    {
        icon: TrendingUp,
        title: "Trend Analysis",
        description: "Our AI scans millions of videos to identify viral hooks and trending audio real-time.",
    },
    {
        icon: Zap,
        title: "Instant Generation",
        description: "Go from idea to fully edited video in under 60 seconds. Speed is your competitive advantage.",
    },
    {
        icon: Globe,
        title: "Global Reach",
        description: "Auto-translate and dub your content into 30+ languages to reach a worldwide audience.",
    },
    {
        icon: Layers,
        title: "Niche Domination",
        description: "Perfect for any niche: True Crime, History, Facts, Motivation, Finance, and more.",
    },
]

export function Features() {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 size-96 bg-purple-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 size-96 bg-blue-900/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="container px-6 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Built for Viral Growth</h2>
                    <p className="text-slate-600 text-lg">
                        Everything you need to automate your content empire without showing your face.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="p-6 hover:shadow-lg transition-all border-slate-200 bg-white/50 hover:bg-white">
                            <div className="size-12 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                                <feature.icon className="size-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                            <p className="text-slate-600">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
