import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Play, Wand2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Niche } from "./niche-step"
import { VOICES, Voice } from "./voice-step"
import { TRACKS } from "./music-step"
import { SUBTITLE_STYLES, SubtitleStyle } from "./subtitle-step"
import { Track } from "../components/music-list"

export default function ReviewStep() {
    const { request, updateRequest } = useCreation()
    const navigate = useNavigate()
    const [title, setTitle] = useState(request.scriptIdea.split(' ').slice(0, 5).join(' ') + (request.scriptIdea.length > 50 ? '...' : '') || "New Video Series")

    const { data: niches } = useQuery<Niche[]>({
        queryKey: ["niches"],
        queryFn: async () => {
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const res = await fetch(`${apiBase}/api/niches`)
            if (!res.ok) throw new Error("Failed to fetch niches")
            return res.json()
        }
    })

    const selectedNiche = niches?.find(n => n.id === request.nicheId)
    const selectedVoice = VOICES.find((v: Voice) => v.id === request.voiceId)
    const selectedTrack = TRACKS.find((t: Track) => t.id === request.musicId)
    const selectedStyle = SUBTITLE_STYLES.find((s: SubtitleStyle) => s.id === request.subtitleTemplateId)

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8 pb-32">
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Review & Generate</h1>
                <p className="text-slate-500 font-medium text-lg">
                    Review your settings below. You can edit any section before generating your series.
                </p>
            </div>

            {/* Series Name */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Series Name</h3>
                    <span className="text-xs font-bold text-slate-400">Visible on Dashboard</span>
                </div>
                <div className="relative group">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-xl font-bold text-slate-900 md:text-2xl outline-none focus:border-purple-200 focus:bg-white transition-all group-hover:bg-slate-50/80"
                    />
                    <Pencil className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors pointer-events-none" />
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-3 ml-1">
                    Give your series a catchy name to easily identify it later.
                </p>
            </div>

            {/* Content Strategy */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Content Strategy</h3>
                            <p className="text-sm font-semibold text-slate-400">Niche and topic configuration</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" onClick={() => navigate("../niche")}>
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Niche</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">{selectedNiche?.name || "Unselected"}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Series Topic</span>
                        <p className="text-lg font-bold text-slate-900 truncate">{request.scriptIdea || "No topic defined"}</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Target Audience</span>
                    <p className="text-base font-bold text-slate-900">
                        {selectedNiche ? `${selectedNiche.name} enthusiasts, early adopters` : "General Audience"}
                    </p>
                </div>
            </div>

            {/* Audio Experience */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Play className="h-6 w-6 ml-0.5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Audio Experience</h3>
                            <p className="text-sm font-semibold text-slate-400">Voiceover and background music</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" onClick={() => navigate("../voice")}>
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {/* Voice Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden",
                            selectedVoice?.gender === 'Female' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                        )}>
                            {selectedVoice?.avatar ? (
                                <img src={selectedVoice.avatar} alt={selectedVoice.name} className="w-full h-full object-cover" />
                            ) : (
                                selectedVoice?.name.charAt(0) || "?"
                            )}
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900">{selectedVoice?.name || "No Voice Selected"}</h4>
                            <p className="text-xs font-semibold text-slate-400">{selectedVoice?.gender} • {selectedVoice?.accent}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 h-4">
                        {[0.4, 0.8, 0.3, 0.9, 0.5, 0.7].map((h, i) => (
                            <div key={i} style={{ height: `${h * 100}%` }} className="w-1 bg-purple-400 rounded-full opacity-60" />
                        ))}
                    </div>
                </div>

                {/* Music Card */}
                {selectedTrack && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                <Play className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">{selectedTrack.name}</h4>
                                <p className="text-xs font-semibold text-slate-400">{selectedTrack.genre} • {selectedTrack.mood}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Visuals & Style */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Visual Style</h3>
                            <p className="text-sm font-semibold text-slate-400">Subtitles and overall aesthetic</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" onClick={() => navigate("../subtitles")}>
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Subtitle Style</span>
                    <div className="flex items-center gap-4">
                        {selectedStyle ? (
                            <>
                                <div className={cn("px-4 py-2 rounded-lg text-lg bg-slate-200", selectedStyle.css)}>
                                    {selectedStyle.preview}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">{selectedStyle.name}</h4>
                                    <p className="text-xs font-semibold text-slate-400">{selectedStyle.description}</p>
                                </div>
                            </>
                        ) : (
                            <span className="text-slate-500 font-medium">No style selected</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
