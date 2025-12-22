import {
    Lightbulb,
    Timer,
    Sparkles,
    Layers,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../layout"
import { Button } from "@/components/ui/button"

export default function ScriptStep() {
    const {
        scriptIdea,
        setScriptIdea,
        duration,
        setDuration,
        segments,
        setSegments,
        visualFormat,
        setVisualFormat
    } = useCreation()

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-8 md:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 md:mb-4">
                    Define your Video Details
                </h1>
                <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-medium px-4">
                    Provide specific instructions to tailor the AI script, choose the duration, and structure the storytelling flow.
                </p>
            </div>

            {/* Section 1: Series Idea & Context */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Series Idea & Context</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Describe what you want the AI to talk about. Be as detailed as possible about tone, style, and specific topics.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={scriptIdea}
                        onChange={(e) => setScriptIdea(e.target.value)}
                        placeholder="Example: Create a series about 'Unsolved Ocean Mysteries'. The tone should be suspenseful and eerie. Start with the Bermuda Triangle, then move to the Mariana Trench anomalies..."
                        className="w-full min-h-[180px] p-4 md:p-6 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none resize-none transition-all text-base leading-relaxed"
                        maxLength={1000}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-400">
                            {scriptIdea.length}/1000
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 gap-2 transition-all shadow-sm"
                        >
                            <Sparkles className="h-4 w-4" />
                            Enhance with AI
                        </Button>
                    </div>
                </div>
            </div>

            {/* Section 2: Duration */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                        <Timer className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Duration</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Target video length: <span className="text-purple-600 font-bold">{duration === 0.5 ? "30 Seconds" : `${duration} Minute${duration > 1 ? 's' : ''}`}</span>
                        </p>
                    </div>
                </div>

                <div className="px-2 md:px-4 py-4">
                    <div className="relative h-12 flex items-center select-none">
                        {/* Track Background */}
                        <div className="absolute w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            {/* Fill Track */}
                            <div
                                className="h-full bg-purple-600 transition-all duration-300 ease-out"
                                style={{
                                    width: `${((([0.5, 1, 2, 3, 4, 5].indexOf(duration) / 5) * 100))}%`
                                }}
                            />
                        </div>

                        {/* Steps */}
                        <div className="absolute w-full flex justify-between items-center">
                            {[0.5, 1, 2, 3, 4, 5].map((step, index) => {
                                const isActive = duration >= step
                                const isSelected = duration === step

                                return (
                                    <div
                                        key={step}
                                        className="relative group cursor-pointer"
                                        onClick={() => setDuration(step)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 relative",
                                            isActive ? "border-purple-600 bg-purple-600" : "border-slate-300 bg-white group-hover:border-purple-300",
                                            isSelected && "scale-150 ring-4 ring-purple-100"
                                        )} />

                                        {/* Label */}
                                        <div className={cn(
                                            "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors whitespace-nowrap",
                                            isSelected ? "text-purple-600" : "text-slate-400"
                                        )}>
                                            {step === 0.5 ? '30s' : `${step}m`}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Visual Format & Structure */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-pink-50 text-pink-600">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Visual Format & Structure</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose your storytelling medium and pacing.
                        </p>
                    </div>
                </div>

                {/* Visual Format Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div
                        onClick={() => setVisualFormat('image')}
                        className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group",
                            visualFormat === 'image'
                                ? "border-purple-600 bg-purple-50/30"
                                : "border-slate-100 bg-slate-50/30 hover:border-slate-300"
                        )}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                            visualFormat === 'image' ? "border-purple-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {visualFormat === 'image' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                        </div>
                        <div>
                            <span className={cn("font-bold block", visualFormat === 'image' ? "text-purple-900" : "text-slate-700")}>
                                Dynamic Image Story
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Rotations & Ken Burns effects</span>
                        </div>
                    </div>

                    <div className="relative p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0" />
                        <div>
                            <span className="font-bold block text-slate-400">
                                Video B-Roll Story
                            </span>
                            <span className="text-xs text-slate-400 font-medium">AI-selected stock footage</span>
                        </div>
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Coming Soon
                        </span>
                    </div>
                </div>

                <div className="h-px w-full bg-slate-100 mb-8" />

                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900">Visual Segments</h4>
                    <span className="text-purple-600 font-bold text-sm bg-purple-50 px-3 py-1 rounded-full">{segments} Scenes</span>
                </div>

                <div className="px-2 md:px-4 py-4">
                    <div className="relative h-12 flex items-center select-none">
                        {/* Track Background */}
                        <div className="absolute w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            {/* Fill Track */}
                            <div
                                className="h-full bg-purple-600 transition-all duration-300 ease-out"
                                style={{
                                    width: `${(((segments - 3) / 9) * 100)}%`
                                }}
                            />
                        </div>

                        {/* Steps */}
                        <div className="absolute w-full flex justify-between items-center">
                            {Array.from({ length: 10 }, (_, i) => i + 3).map((count) => {
                                const isActive = segments >= count
                                const isSelected = segments === count

                                return (
                                    <div
                                        key={count}
                                        className="relative group cursor-pointer"
                                        onClick={() => setSegments(count)}
                                    >
                                        <div className={cn(
                                            "w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-300 z-10 relative",
                                            isActive ? "border-purple-600 bg-purple-600" : "border-slate-300 bg-white group-hover:border-purple-300",
                                            isSelected && "scale-150 ring-4 ring-purple-100"
                                        )} />

                                        {/* Label */}
                                        <div className={cn(
                                            "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors",
                                            isSelected ? "text-purple-600" : "text-slate-400",
                                            "hidden md:block" // Show all on desktop
                                        )}>
                                            {count}
                                        </div>
                                        {/* Mobile: Show only start, mid, end */}
                                        <div className={cn(
                                            "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors md:hidden",
                                            isSelected ? "text-purple-600" : "text-slate-400",
                                            (count === 3 || count === 7 || count === 12 || isSelected) ? "block" : "hidden"
                                        )}>
                                            {count}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 font-medium mt-8">
                        Recommended: 3-5 segments for shorter videos, 8+ for detailed stories.
                    </p>
                </div>
            </div>
        </div>
    )
}
