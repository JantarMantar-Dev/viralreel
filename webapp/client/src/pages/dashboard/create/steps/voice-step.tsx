import { useState } from "react"
import {
    Play,
    Pause,
    Search,
    Check,
    Volume2,
    Type
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { Button } from "@/components/ui/button"

import StepHeader from "../components/step-header"

export interface Voice {
    id: string
    name: string
    accent: string
    style: string
    previewUrl: string
    gender: string
    categories: string[]
    avatar?: string
}

export const VOICES: Voice[] = [
    { id: "sarah", name: "Sarah", accent: "American", style: "Narrative", previewUrl: "#", gender: "Female", categories: ["narrative", "all"] },
    { id: "marcus", name: "Marcus", accent: "British", style: "Deep", previewUrl: "#", gender: "Male", categories: ["factual", "all"] },
    { id: "elena", name: "Elena", accent: "Spanish", style: "Soft", previewUrl: "#", gender: "Female", categories: ["conversational", "all"] },
    { id: "david", name: "David", accent: "American", style: "News", previewUrl: "#", gender: "Male", categories: ["factual", "all"] },
    { id: "sophia", name: "Sophia", accent: "Australian", style: "Friendly", previewUrl: "#", gender: "Female", categories: ["conversational", "all"] },
    { id: "james", name: "James", accent: "American", style: "Energetic", previewUrl: "#", gender: "Male", categories: ["narrative", "all"] },
]

const CATEGORIES = [
    { id: "all", label: "All Voices" },
    { id: "narrative", label: "Narration" },
    { id: "conversational", label: "Conversational" },
    { id: "factual", label: "News & Factual" },
]

export default function VoiceStep() {
    const { request, updateRequest } = useCreation()
    const [activeTab, setActiveTab] = useState("all")
    const [playingVoice, setPlayingVoice] = useState<string | null>(null)

    const filteredVoices = VOICES.filter(v => v.categories.includes(activeTab))

    const togglePlay = (id: string) => {
        if (playingVoice === id) {
            setPlayingVoice(null)
        } else {
            setPlayingVoice(id)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
            <StepHeader
                title="Select Series Voice"
                description="Choose the perfect narrator for your stories. Each voice is optimized for high-engagement social media content."
            />


            {/* Filter Tabs & Sort */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar border border-slate-200/50">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={cn(
                                "px-4 md:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                activeTab === cat.id
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/80"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search voices..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVoices.map((voice) => {
                    const isSelected = request.voiceId === voice.id
                    const isPlaying = playingVoice === voice.id

                    return (
                        <div
                            key={voice.id}
                            onClick={() => updateRequest({ voiceId: voice.id })}
                            className={cn(
                                "group relative bg-white p-4 md:p-5 rounded-[24px] border-2 transition-all duration-300 cursor-pointer flex flex-col items-center",
                                isSelected
                                    ? "border-purple-600 shadow-xl shadow-purple-100 ring-4 ring-purple-50"
                                    : "border-slate-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-0.5"
                            )}
                        >
                            {/* Selection Checkmark */}
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-purple-600 text-white p-0.5 rounded-full animate-in zoom-in duration-300 shadow-md">
                                    <Check className="h-3.5 w-3.5" />
                                </div>
                            )}

                            {/* Voice Avatar & Info */}
                            <div className="flex items-center gap-3 w-full mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white transition-transform group-hover:scale-105 shrink-0",
                                    voice.gender === 'Female' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {voice.name.charAt(0)}
                                </div>
                                <div className="text-left overflow-hidden">
                                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                                        {voice.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                                            {voice.accent}
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full uppercase tracking-wider">
                                            {voice.style}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Audio Preview Area */}
                            <div className="w-full bg-slate-50/80 rounded-xl p-2.5 flex items-center gap-3 group/audio border border-slate-100 transition-colors hover:bg-slate-100/80">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        togglePlay(voice.id)
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 shrink-0",
                                        isPlaying
                                            ? "bg-white text-purple-600"
                                            : "bg-purple-600 text-white hover:bg-purple-700"
                                    )}
                                >
                                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                                </button>

                                {/* Mock Waveform */}
                                <div className="flex-1 flex items-center gap-[1.5px] h-6 px-0.5">
                                    {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.6, 0.7, 0.5, 0.9, 0.4].map((h, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-[2px] rounded-full transition-all duration-500",
                                                isPlaying ? "animate-pulse bg-purple-600" : "bg-slate-300 group-hover/audio:bg-slate-400"
                                            )}
                                            style={{ height: `${h * 100}%` }}
                                        />
                                    ))}
                                </div>

                                <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                                    0:0{voice.id.length + 2}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State for Search/Filter */}
            {filteredVoices.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Volume2 className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No voices found</h3>
                    <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    )
}
