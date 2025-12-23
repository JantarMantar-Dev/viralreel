import { useState } from "react"
import {
    Search,
    Music,
    Upload,
    ChevronDown,
    Plus,
    CloudUpload,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../components/step-header"
import AudioList from "../components/audio-list"
import UploadMusicDialog from "../components/upload-music-dialog"

export interface Track {
    id: string
    name: string
    duration: string
    genre?: string
    mood?: string
    bpm?: number
    badge?: string
    uploadedAt?: string
    size?: string
}

export const TRACKS: Track[] = [
    {
        id: "tech-future",
        name: "Tech Innovation Future",
        genre: "Electronic",
        mood: "Upbeat",
        bpm: 128,
        duration: "02:15",
        badge: "POPULAR",
    },
    {
        id: "ambient-morning",
        name: "Ambient Morning",
        genre: "Acoustic",
        mood: "Relaxed",
        bpm: 90,
        duration: "03:42",
    },
    {
        id: "corporate-success",
        name: "Corporate Success",
        genre: "Pop",
        mood: "Motivational",
        bpm: 115,
        duration: "01:58",
    },
    {
        id: "deep-focus",
        name: "Deep Focus Beats",
        genre: "Lo-fi",
        mood: "Chill",
        bpm: 85,
        duration: "04:20",
        badge: "NEW",
    },
]

export const USER_TRACKS: Track[] = [
    {
        id: "user-1",
        name: "Podcast Intro Final.mp3",
        uploadedAt: "2 hours ago",
        size: "4.2 MB",
        duration: "00:45",
    },
    {
        id: "user-2",
        name: "Ambient Loop Background.wav",
        uploadedAt: "yesterday",
        size: "12.5 MB",
        duration: "03:12",
    },
    {
        id: "user-3",
        name: "Custom Interview Jingle.mp3",
        uploadedAt: "3 days ago",
        size: "2.8 MB",
        duration: "00:15",
    },
]

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "upbeat", label: "Upbeat" },
    { id: "cinematic", label: "Cinematic" },
    { id: "corporate", label: "Corporate" },
]

export default function MusicStep() {
    const { request, updateRequest } = useCreation()
    const [activeSource, setActiveSource] = useState("upload") // "library" | "upload"
    const [activeMood, setActiveMood] = useState("all")
    const [playingTrack, setPlayingTrack] = useState<string | null>(null)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isUploadEmpty, setIsUploadEmpty] = useState(false)

    const filteredTracks = activeSource === "library"
        ? (activeMood === "all" ? TRACKS : TRACKS.filter(t => t.mood?.toLowerCase() === activeMood.toLowerCase() || t.genre?.toLowerCase() === activeMood.toLowerCase()))
        : USER_TRACKS

    const togglePlay = (id: string) => {
        if (playingTrack === id) {
            setPlayingTrack(null)
        } else {
            setPlayingTrack(id)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Set the tone"
                description={`Choose a background track that matches the mood of your ${request.jobType === "series" ? "series" : "video"} "${request.scriptIdea.slice(0, 30)}${request.scriptIdea.length > 30 ? '...' : ''}".`}
            />

            {/* Source Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveSource("upload")}
                    className={cn(
                        "flex items-center gap-2 pb-4 text-sm font-bold transition-all relative",
                        activeSource === "upload" ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Upload className="h-4 w-4" />
                    Your Uploaded Music
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">{USER_TRACKS.length}</span>
                    {activeSource === "upload" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveSource("library")}
                    className={cn(
                        "flex items-center gap-2 pb-4 text-sm font-bold transition-all relative",
                        activeSource === "library" ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Music className="h-4 w-4" />
                    Default Music Library
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-black ml-1 tracking-tighter">COMING SOON</span>
                    {activeSource === "library" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />}
                </button>
            </div>

            {/* Search and Action Row */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={activeSource === "library" ? "Search for mood, genre, or instrument..." : "Search your uploads..."}
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all outline-none"
                    />
                </div>

                {activeSource === "upload" ? (
                    <Button
                        size="lg"
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95"
                    >
                        <CloudUpload className="h-5 w-5" />
                        Add New Music
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl whitespace-nowrap overflow-x-auto no-scrollbar w-full md:w-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveMood(cat.id)}
                                className={cn(
                                    "px-5 py-2.5 rounded-lg text-xs font-bold transition-all",
                                    activeMood === cat.id
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Skip Option */}
            <div
                onClick={() => updateRequest({ musicId: undefined })}
                className={cn(
                    "p-4 rounded-[20px] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between group",
                    !request.musicId
                        ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                        : "border-slate-100 bg-white hover:border-purple-200"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        !request.musicId ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400 group-hover:text-purple-600"
                    )}>
                        <Music className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className={cn("font-bold text-base", !request.musicId ? "text-purple-900" : "text-slate-900")}>Skip Background Music</h4>
                        <p className="text-xs font-semibold text-slate-400">Create the {request.jobType === "series" ? "series" : "video"} without any background track</p>
                    </div>
                </div>
                {!request.musicId && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center animate-in zoom-in duration-300">
                        <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                )}
            </div>

            {/* Music List or Coming Soon / Empty State */}
            {activeSource === "library" ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Music className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Library Coming Soon</h3>
                    <p className="text-slate-500 font-medium">We're building a massive library of high-quality, royalty-free music for your videos.</p>
                </div>
            ) : isUploadEmpty ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CloudUpload className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No uploaded music</h3>
                    <p className="text-slate-500 font-medium mb-8">Upload your own tracks to use them in your videos.</p>
                </div>
            ) : (
                <AudioList
                    items={filteredTracks.map(track => ({
                        id: track.id,
                        title: track.name,
                        subtitle: track.uploadedAt
                            ? <>Uploaded {track.uploadedAt} • {track.size}</>
                            : <>{track.genre} • {track.mood} • {track.bpm} BPM</>,
                        tags: track.badge ? [track.badge] : [],
                        rightElement: <span className="text-sm font-bold text-slate-400 font-mono">{track.duration}</span>
                    }))}
                    selectedId={request.musicId}
                    playingId={playingTrack}
                    onSelect={(id) => updateRequest({ musicId: id })}
                    onTogglePlay={togglePlay}
                />
            )}

            <UploadMusicDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
            />
        </div>
    )
}
