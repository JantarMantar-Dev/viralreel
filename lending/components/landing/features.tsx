import { Card } from "@/components/ui/card"
import { Clock, Share2, TrendingUp, Zap, Globe, Layers } from "lucide-react"

const features = [
    {
        icon: Clock,
        title: "Wake Up to Growth",
        description: "Your AI agent creates and posts while you sleep. Wake up to new followers and revenue every single morning.",
    },
    {
        icon: Share2,
        title: "Triple Your Reach",
        description: "Don't limit yourself. One click publishes to TikTok, Instagram, and YouTube simultaneously for 3x the traffic.",
    },
    {
        icon: TrendingUp,
        title: "Go Viral on Command",
        description: "Stop guessing. Our AI analyzes millions of videos to predict exactly what hooks and sounds will go viral next.",
    },
    {
        icon: Zap,
        title: "100 Videos in Minutes",
        description: "Create a month's worth of content in one sitting. Dominate your niche with consistency that humans can't match.",
    },
    {
        icon: Globe,
        title: "Global Empire",
        description: "Unlock 8 billion viewers. Automatically translate and dub your videos into 30+ languages to reach the world.",
    },
    {
        icon: Layers,
        title: "Dominate Any Niche",
        description: "Whether it's True Crime, History, or Finance, our AI adapts to create the perfect style for your audience.",
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
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Why Creators Choose ViralReel</h2>
                    <p className="text-slate-600 text-lg">
                        The unfair advantage that lets you build a content empire without the burnout.
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
