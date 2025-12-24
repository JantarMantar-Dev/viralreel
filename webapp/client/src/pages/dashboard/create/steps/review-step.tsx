import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Play, Wand2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { VOICES, Voice } from "./voice-step"
import { IMAGE_STYLES } from "./script-step"
import { Button } from "@/components/ui/button"
import { Palette, VolumeX, Music, Ban, Clapperboard, FileText } from "lucide-react"
import StepHeader from "../components/step-header"

export default function ReviewStep() {
    const { request, updateRequest } = useCreation()
    const navigate = useNavigate()

    const selectedVoice = VOICES.find((v: Voice) => v.id === request.voiceId)
    const selectedImageStyle = IMAGE_STYLES.find(s => s.id === request.visualStyle)

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8 pb-32">
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Review & Generate</h1>
                <p className="text-slate-500 font-medium text-lg">
                    Review your settings below. You can edit any section before generating your series.
                </p>
            </div>

            {/* Series Basics Review */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Clapperboard className="h-4 w-4 text-purple-600" />
                                {request.jobType === "series" ? "Series Name" : "Video Name"}
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400">Main Collection</span>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={request.jobType === "series" ? request.seriesName : request.episodeTitle}
                                onChange={(e) => updateRequest({
                                    [request.jobType === "series" ? "seriesName" : "episodeTitle"]: e.target.value
                                })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:border-purple-200 focus:bg-white transition-all group-hover:bg-slate-50/80"
                                placeholder={request.jobType === "series" ? "Enter Series Name" : "Enter Video Name"}
                            />
                            <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors pointer-events-none" />
                        </div>
                    </div>

                    {request.jobType === "series" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    Episode 1 Title
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">First Episode</span>
                            </div>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={request.episodeTitle}
                                    onChange={(e) => updateRequest({ episodeTitle: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:border-purple-200 focus:bg-white transition-all group-hover:bg-slate-50/80"
                                    placeholder="Enter Episode Title"
                                />
                                <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors pointer-events-none" />
                            </div>
                        </div>
                    )}
                </div>
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

                <div className="space-y-4">
                    {/* Row 1: Niche and Topic */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 md:col-span-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Niche</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{request.nicheName || "Unselected"}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 md:col-span-8">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                {request.jobType === "series" ? "Series Idea / Topic" : "Video Idea / Topic"}
                            </span>
                            <p className="text-sm font-bold text-slate-900 truncate">{request.scriptIdea || "No topic defined"}</p>
                        </div>
                    </div>

                    {/* Row 2: Style and Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Image Style</span>
                            <p className="text-sm font-bold text-slate-900 truncate">{selectedImageStyle?.name || "Comic"}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
                            <p className="text-sm font-bold text-slate-900 truncate">{request.duration} min</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Segments</span>
                            <p className="text-sm font-bold text-slate-900 truncate">{request.segments} parts</p>
                        </div>
                    </div>
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
                    {selectedVoice ? (
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden",
                                selectedVoice.gender === 'Woman' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {selectedVoice.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">{selectedVoice.name}</h4>
                                <p className="text-xs font-semibold text-slate-400">{selectedVoice.gender} • English</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <VolumeX className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Skipped AI Voice</h4>
                                <p className="text-xs font-semibold text-slate-400">No narration will be added</p>
                            </div>
                        </div>
                    )}
                    {selectedVoice && (
                        <div className="flex items-center gap-1 h-4">
                            {[0.4, 0.8, 0.3, 0.9, 0.5, 0.7].map((h, i) => (
                                <div key={i} style={{ height: `${h * 100}%` }} className="w-1 bg-purple-400 rounded-full opacity-60" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Music Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    {request.musicId ? (
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                <Play className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">{request.musicName}</h4>
                                <p className="text-xs font-semibold text-slate-400">
                                    {request.musicDetails}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <Ban className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Skipped Music</h4>
                                <p className="text-xs font-semibold text-slate-400">No background track will be added</p>
                            </div>
                        </div>
                    )}
                </div>
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
                        {request.subtitleTemplateId ? (
                            <>
                                <div className="px-4 py-2 rounded-lg text-lg bg-slate-200 font-bold">
                                    {request.subtitleTemplateName}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">{request.subtitleTemplateName}</h4>
                                    <p className="text-xs font-semibold text-slate-400">Custom transition style</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 text-slate-400">
                                <Ban className="h-8 w-8" />
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Skipped Subtitles</h4>
                                    <p className="text-xs font-semibold text-slate-400">No text overlays will be added</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
