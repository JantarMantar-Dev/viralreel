import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { Loader2, AlertCircle } from "lucide-react"

export interface Track {
    id: string
    name: string
    url: string
    durationSeconds: number | null
    createdAt: string | null
    uploadedAt?: string // For backward compatibility if needed in UI
}

const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function MusicStep() {
    const { request, updateRequest } = useCreation()
    const [activeSource, setActiveSource] = useState("library") // "library" | "upload"
    const [searchQuery, setSearchQuery] = useState("")
    const [playingTrack, setPlayingTrack] = useState<string | null>(null)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Handle audio cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000"

    const { data: defaultTracks, isLoading: isLoadingDefault, error: errorDefault } = useQuery<Track[]>({
        queryKey: ["music", "default"],
        queryFn: async () => {
            const res = await fetch(`${apiBase}/api/music/default`, {
                credentials: "include"
            })
            if (!res.ok) throw new Error("Failed to fetch default music")
            return res.json()
        }
    })

    const { data: userTracks, isLoading: isLoadingUser, error: errorUser } = useQuery<Track[]>({
        queryKey: ["music", "user"],
        queryFn: async () => {
            const res = await fetch(`${apiBase}/api/music/user`, {
                credentials: "include"
            })
            if (!res.ok) throw new Error("Failed to fetch user music")
            return res.json()
        }
    })

    const isLoading = isLoadingDefault || isLoadingUser
    const error = errorDefault || errorUser

    const filteredTracks = useMemo(() => {
        const tracks = activeSource === "library" ? defaultTracks : userTracks
        if (!tracks) return []
        if (!searchQuery) return tracks
        return tracks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [activeSource, defaultTracks, userTracks, searchQuery])

    const togglePlay = (id: string) => {
        const track = filteredTracks.find(t => t.id === id)
        if (!track) return

        if (playingTrack === id) {
            // Stop current
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            setPlayingTrack(null)
        } else {
            // Stop previous if any
            if (audioRef.current) {
                audioRef.current.pause()
            }

            // Start new
            const audio = new Audio(track.url)
            audio.onended = () => setPlayingTrack(null)
            audioRef.current = audio
            audio.play().catch(e => console.error("Error playing audio:", e))
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
                    {userTracks && userTracks.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">{userTracks.length}</span>
                    )}
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
                    Music Library
                    {defaultTracks && defaultTracks.length > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-black ml-1 tracking-tighter">{defaultTracks.length}</span>
                    )}
                    {activeSource === "library" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />}
                </button>
            </div>

            {/* Search and Action Row */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={activeSource === "library" ? "Search for tracks..." : "Search your uploads..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all outline-none"
                    />
                </div>

                {activeSource === "upload" && (
                    <Button
                        size="lg"
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95"
                    >
                        <CloudUpload className="h-5 w-5" />
                        Add New Music
                    </Button>
                )}
            </div>

            {/* Skip Option */}
            <div
                onClick={() => updateRequest({ musicId: undefined, musicName: undefined, musicDetails: undefined })}
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

            {/* Music List or Loading / Empty State */}
            {isLoading ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-slate-100">
                    <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Loading music...</h3>
                </div>
            ) : error ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-red-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to load music</h3>
                    <p className="text-slate-500 mb-6">We couldn't connect to the server.</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
                        Retry
                    </Button>
                </div>
            ) : filteredTracks.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Music className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        {activeSource === "library" ? "No library music" : "No uploaded music"}
                    </h3>
                    <p className="text-slate-500 font-medium">
                        {activeSource === "library"
                            ? "Try search for another term."
                            : "Upload your own tracks to use them in your videos."}
                    </p>
                </div>
            ) : (
                <AudioList
                    items={filteredTracks.map(track => ({
                        id: track.id,
                        title: track.name,
                        subtitle: track.createdAt
                            ? <>Added {new Date(track.createdAt).toLocaleDateString()}</>
                            : "Default Music",
                        rightElement: <span className="text-sm font-bold text-slate-400 font-mono">{formatDuration(track.durationSeconds)}</span>,
                        previewUrl: track.url
                    }))}
                    selectedId={request.musicId}
                    playingId={playingTrack}
                    onSelect={(id) => {
                        const track = filteredTracks.find(t => t.id === id)
                        if (track) {
                            const details = track.createdAt
                                ? `Added ${new Date(track.createdAt).toLocaleDateString()}`
                                : "Default Music"
                            updateRequest({
                                musicId: id,
                                musicName: track.name,
                                musicDetails: details
                            })
                        }
                    }}
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
