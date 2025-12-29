import {
    Lightbulb,
    Timer,
    Sparkles,
    Layers,
    Check,
    Palette,
    Zap,
    Ghost,
    Cloud,
    Sword,
    Moon,
    Box,
    Camera,
    Stars,
    Aperture,
    PlayCircle,
    Clapperboard,
    FileText,
    Lock,
    Smartphone,
    Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../components/step-header"

export const IMAGE_STYLES = [
    { id: "comic", name: "Comic", description: "Bold comic-book style, thick outlines", icon: Zap },
    { id: "creepy-comic", name: "Creepy Comic", description: "Horror-comic style, exaggerated shades", icon: Ghost },
    { id: "painting", name: "Painting", description: "Detailed traditional painting style", icon: Palette },
    { id: "ghibli", name: "Ghibli", description: "Studio Ghibli-inspired, soft colors", icon: Cloud },
    { id: "anime", name: "Anime", description: "Clean anime style, sharp linework", icon: Sword },
    { id: "dark-fantasy", name: "Dark Fantasy", description: "Moody atmosphere, dark colors", icon: Moon },
    { id: "lego", name: "Lego", description: "Plastic texture, LEGO figure style", icon: Box },
    { id: "polaroid", name: "Polaroid", description: "Vintage Polaroid style, soft glow", icon: Camera },
    { id: "disney", name: "Disney", description: "Classic animation style, soft curves", icon: Stars },
    { id: "realism", name: "Realism", description: "Ultra-realistic photographic style", icon: Aperture },
    { id: "fantastic", name: "Fantastic", description: "Vibrant magical fantasy style", icon: Sparkles },
]

export default function ScriptStep() {
    const {
        request,
        updateRequest
    } = useCreation()

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <StepHeader
                title="Define your Video Details"
                description="Provide specific instructions to tailor the AI script, choose the duration, and structure the storytelling flow."
            />
            {/* Section 0: Series Basics */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                            <Clapperboard className="h-4 w-4 text-purple-600" />
                            {request.jobType === "series" ? "Series Name" : "Video Name"}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={request.jobType === "series" ? request.seriesName : request.episodeTitle}
                                onChange={(e) => updateRequest({
                                    [request.jobType === "series" ? "seriesName" : "episodeTitle"]: e.target.value
                                })}
                                placeholder={request.jobType === "series" ? "e.g. Unsolved Mysteries of the Deep" : "e.g. My Amazing Video"}
                                disabled={request.jobType === "series" && !!request.seriesId}
                                className={cn(
                                    "w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-500 outline-none transition-all font-medium",
                                    request.jobType === "series" && !!request.seriesId && "bg-slate-100 text-slate-500 cursor-not-allowed"
                                )}
                            />
                            {request.jobType === "series" && !!request.seriesId && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    </div>
                    {request.jobType === "series" && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                <FileText className="h-4 w-4 text-purple-600" />
                                Episode 1 Title
                            </label>
                            <input
                                type="text"
                                value={request.episodeTitle}
                                onChange={(e) => updateRequest({ episodeTitle: e.target.value })}
                                placeholder="e.g. The Bermuda Triangle Secret"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-500 outline-none transition-all font-medium"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section 0.5: Aspect Ratio */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-start gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Choose Aspect Ratio</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose between portrait (perfect for Reels/Shorts) or landscape (standard video).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => updateRequest({ aspectRatio: 'portrait' })}
                        className={cn(
                            "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                            request.aspectRatio === 'portrait'
                                ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"
                        )}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "relative w-16 h-28 rounded-xl border-4 transition-all duration-300 flex items-center justify-center overflow-hidden",
                                request.aspectRatio === 'portrait' ? "border-purple-600 bg-purple-100" : "border-slate-300 bg-slate-100 group-hover:border-purple-300"
                            )}>
                                <Smartphone className={cn("h-8 w-8", request.aspectRatio === 'portrait' ? "text-purple-600" : "text-slate-400")} />
                                <div className="absolute bottom-2 w-4 h-1 bg-current rounded-full opacity-30" />
                            </div>
                            <div className="text-center">
                                <span className={cn("font-bold block text-lg", request.aspectRatio === 'portrait' ? "text-purple-900" : "text-slate-700")}>
                                    Portrait (9:16)
                                </span>
                                <span className="text-sm text-slate-500 font-medium">Perfect for Reels, Shorts & TikTok</span>
                            </div>
                        </div>
                        {request.aspectRatio === 'portrait' && (
                            <div className="absolute top-4 right-4 bg-purple-600 text-white p-1 rounded-full shadow-lg">
                                <Check className="h-4 w-4" />
                            </div>
                        )}
                    </div>

                    <div
                        onClick={() => updateRequest({ aspectRatio: 'landscape' })}
                        className={cn(
                            "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                            request.aspectRatio === 'landscape'
                                ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"
                        )}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "relative w-28 h-18 rounded-xl border-4 transition-all duration-300 flex items-center justify-center overflow-hidden",
                                request.aspectRatio === 'landscape' ? "border-purple-600 bg-purple-100" : "border-slate-300 bg-slate-100 group-hover:border-purple-300"
                            )}>
                                <Monitor className={cn("h-8 w-8", request.aspectRatio === 'landscape' ? "text-purple-600" : "text-slate-400")} />
                                <div className="absolute bottom-2 w-2 h-2 bg-current rounded-full opacity-30" />
                            </div>
                            <div className="text-center">
                                <span className={cn("font-bold block text-lg", request.aspectRatio === 'landscape' ? "text-purple-900" : "text-slate-700")}>
                                    Landscape (16:9)
                                </span>
                                <span className="text-sm text-slate-500 font-medium">Best for YouTube & Standard Videos</span>
                            </div>
                        </div>
                        {request.aspectRatio === 'landscape' && (
                            <div className="absolute top-4 right-4 bg-purple-600 text-white p-1 rounded-full shadow-lg">
                                <Check className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 1: Series Idea & Context */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {request.jobType === "series" ? "Series Idea & Context" : "Video Idea & Context"}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Describe what you want the AI to talk about. Be as detailed as possible about tone, style, and specific topics.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={request.scriptIdea}
                        onChange={(e) => updateRequest({ scriptIdea: e.target.value })}
                        placeholder="Example: Create a series about 'Unsolved Ocean Mysteries'. The tone should be suspenseful and eerie. Start with the Bermuda Triangle, then move to the Mariana Trench anomalies..."
                        className="w-full min-h-[180px] p-4 md:p-6 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none resize-none transition-all text-base leading-relaxed"
                        maxLength={1000}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-400">
                            {request.scriptIdea.length}/1000
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

            {/* Section 1.5: Image Style */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Image Style</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose the artistic direction for your AI-generated visuals.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {IMAGE_STYLES.map((style) => {
                        const isSelected = request.visualStyle === style.id
                        return (
                            <div
                                key={style.id}
                                onClick={() => updateRequest({ visualStyle: style.id })}
                                className={cn(
                                    "relative p-4 rounded-[20px] border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
                                    isSelected
                                        ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                        : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-purple-600 text-white p-0.5 rounded-full z-10 animate-in zoom-in duration-300 shadow-md">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform group-hover:scale-110",
                                        isSelected ? "bg-purple-600 text-white" : "bg-white text-slate-400 group-hover:text-purple-600 shadow-sm border border-slate-100"
                                    )}>
                                        <style.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "font-extrabold text-sm truncate",
                                            isSelected ? "text-purple-900" : "text-slate-700"
                                        )}>
                                            {style.name}
                                        </h4>
                                        <p className="text-[10px] font-semibold text-slate-400 leading-tight mt-0.5">
                                            {style.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
                            Target video length: <span className="text-purple-600 font-bold">{request.duration === 0.5 ? "30 Seconds" : `${request.duration} Minute${request.duration > 1 ? 's' : ''}`}</span>
                        </p>
                    </div>
                </div>

                <div className="px-2 md:px-4 py-4">
                    <div className="relative h-12 flex items-center select-none">
                        {/* Track Background */}
                        <div className="absolute w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            {/* Fill Track */}
                            {/* Visual fill logic: since only 0.5 and 1 are active, maybe just fill dynamically up to 1 max? 
                                Or simply don't show a fill track for disabled items. 
                                Let's keep it simple: just show points. 
                            */}
                        </div>

                        {/* Steps */}
                        <div className="absolute w-full flex justify-between items-center">
                            {[0.5, 1, 2, 3, 4, 5].map((step) => {
                                const isActive = request.duration === step
                                const isDisabled = step > 1

                                return (
                                    <div
                                        key={step}
                                        className={cn(
                                            "relative group",
                                            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                        )}
                                        onClick={() => !isDisabled && updateRequest({ duration: step })}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 relative",
                                            isActive ? "border-purple-600 bg-purple-600" : (isDisabled ? "border-slate-200 bg-slate-100" : "border-slate-300 bg-white group-hover:border-purple-300"),
                                            isActive && "scale-150 ring-4 ring-purple-100"
                                        )} />

                                        {/* Label */}
                                        <div className={cn(
                                            "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors whitespace-nowrap flex flex-col items-center gap-1",
                                            isActive ? "text-purple-600" : (isDisabled ? "text-slate-300" : "text-slate-400")
                                        )}>
                                            <span>{step === 0.5 ? '30s' : `${step}m`}</span>
                                            {isDisabled && (
                                                <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded uppercase tracking-wider hidden group-hover:block absolute top-full mt-1 whitespace-nowrap z-20">
                                                    Coming Soon
                                                </span>
                                            )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => updateRequest({ visualFormat: 'image' })}
                        className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group",
                            request.visualFormat === 'image'
                                ? "border-purple-600 bg-purple-50/30"
                                : "border-slate-100 bg-slate-50/30 hover:border-slate-300"
                        )}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                            request.visualFormat === 'image' ? "border-purple-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {request.visualFormat === 'image' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                        </div>
                        <div>
                            <span className={cn("font-bold block", request.visualFormat === 'image' ? "text-purple-900" : "text-slate-700")}>
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
            </div>
        </div>
    )
}
