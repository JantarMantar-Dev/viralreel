import { useState, useRef, useEffect } from "react"
import {
    Play,
    Pause,
    Search,
    Check,
    Volume2,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { Button } from "@/components/ui/button"

import StepHeader from "../components/step-header"
import AudioList from "../components/audio-list"
import { API_BASE_URL } from "@/lib/config"

export interface Voice {
    id: string
    name: string
    gender: string
    genre: string
    duration: string
    previewUrl: string
    categories: string[]
}

const CATEGORIES = [
    { id: "all", label: "All Voices" },
    { id: "woman", label: "Women" },
    { id: "man", label: "Men" },
]

export default function VoiceStep() {
    const { request, updateRequest } = useCreation()
    const [activeTab, setActiveTab] = useState("all")
    const [playingVoice, setPlayingVoice] = useState<string | null>(null)
    const [voices, setVoices] = useState<Voice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/voices`)
                if (!response.ok) throw new Error("Failed to fetch voices")

                const data = await response.json()
                const mappedVoices: Voice[] = data.map((v: any) => {
                    const genderLower = v.gender.toLowerCase() // "female" or "male"
                    // Map "female" -> "woman", "male" -> "man" for categories
                    const categoryGender = genderLower === 'female' ? 'woman' : 'man'
                    const displayGender = genderLower === 'female' ? 'Woman' : 'Man'

                    return {
                        id: v.id,
                        name: v.name,
                        gender: displayGender,
                        genre: "English", // Default to English
                        duration: "00:10", // Previews are approx 10s
                        previewUrl: v.previewUrl,
                        categories: ["all", categoryGender]
                    }
                })

                setVoices(mappedVoices)
            } catch (error) {
                console.error("Error fetching voices:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchVoices()
    }, [])

    const filteredVoices = voices.filter(v => {
        const matchesCategory = activeTab === "all" || v.categories.includes(activeTab)
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    // Handle audio cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const togglePlay = (voice: Voice) => {
        if (playingVoice === voice.id) {
            // Stop current
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            setPlayingVoice(null)
        } else {
            // Stop previous if any
            if (audioRef.current) {
                audioRef.current.pause()
            }

            // Start new
            const audio = new Audio(voice.previewUrl)
            audio.onended = () => setPlayingVoice(null)
            audioRef.current = audio
            audio.play().catch(e => console.error("Error playing audio:", e))
            setPlayingVoice(voice.id)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
            <StepHeader
                title={request.jobType === "series" ? "Select Series Voice" : "Select Video Voice"}
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Voice List */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-2 text-slate-500">Loading voices...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Skip Option */}
                    <div
                        onClick={() => updateRequest({ voiceId: undefined, voiceName: undefined })}
                        className={cn(
                            "group relative bg-white p-4 rounded-[20px] border-2 transition-all duration-300 cursor-pointer flex items-center gap-6",
                            !request.voiceId
                                ? "border-purple-600 bg-purple-50/10 shadow-lg shadow-purple-50"
                                : "border-slate-50 hover:border-purple-200 hover:bg-slate-50/50"
                        )}
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 text-slate-400 transition-colors shrink-0">
                            <Volume2 className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                Skip AI Voice
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 mt-1">
                                No narration for this {request.jobType === "series" ? "series" : "video"}
                            </p>
                        </div>

                        <div
                            className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                !request.voiceId
                                    ? "bg-purple-600 border-purple-600"
                                    : "border-slate-200 group-hover:border-purple-200"
                            )
                            }
                        >
                            {!request.voiceId && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                    </div>

                    <AudioList
                        items={filteredVoices.map(voice => ({
                            id: voice.id,
                            title: voice.name,
                            tags: [voice.gender],
                            subtitle: voice.genre,
                            rightElement: <span className="text-sm font-bold text-slate-400 font-mono">{voice.duration}</span>,
                            previewUrl: voice.previewUrl,
                        }))}
                        selectedId={request.voiceId}
                        playingId={playingVoice}
                        onSelect={(id: string) => {
                            const voice = voices.find(v => v.id === id)
                            updateRequest({ voiceId: id, voiceName: voice?.name })
                        }}
                        onTogglePlay={(id: string) => {
                            const voice = voices.find(v => v.id === id)
                            if (voice) togglePlay(voice)
                        }}
                    />
                </div>
            )}

            {/* Empty State for Search/Filter */}
            {!isLoading && filteredVoices.length === 0 && (
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
