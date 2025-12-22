import { SquarePlay, Layers, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function OnboardingEmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                What would you like to create?
            </h2>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl">
                Choose your starting point to unleash the power of AI video generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
                {/* Create Single Video Card */}
                <div className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300">
                    <div className="mb-6 p-4 rounded-xl bg-purple-50 text-purple-600">
                        <SquarePlay className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        Create Single Video
                    </h3>
                    <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                        Generate a focused, standalone video perfect for social media clips, advertisements, or quick updates. Optimize for any platform instantly.
                    </p>

                    <Button
                        asChild
                        className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                    >
                        <Link to="/dashboard/create">
                            Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Create Series Card */}
                <div className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300">
                    <div className="absolute top-4 right-4 bg-slate-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">POPULAR</span>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-purple-50 text-purple-600">
                        <Layers className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        Create Series
                    </h3>
                    <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                        Generate a cohesive batch of videos for an entire marketing campaign, educational course, or storytelling series. Maintain consistency across multiple clips.
                    </p>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full mt-auto border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                    >
                        <Link to="/dashboard/create">
                            Create Series <Plus className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mt-16 text-sm text-slate-500">
                Not ready to create?{" "}
                <a href="#" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                    Explore templates
                </a>
            </div>
        </div>
    )
}
