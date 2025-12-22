import { Play, Pause, Check } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface MusicListProps {
    tracks: Track[]
    selectedId?: string
    playingId?: string | null
    onSelect: (id: string) => void
    onTogglePlay: (id: string) => void
}

export default function MusicList({
    tracks,
    selectedId,
    playingId,
    onSelect,
    onTogglePlay,
}: MusicListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => {
                const isSelected = selectedId === track.id
                const isPlaying = playingId === track.id

                return (
                    <div
                        key={track.id}
                        onClick={() => onSelect(track.id)}
                        className={cn(
                            "group bg-white p-4 rounded-[20px] border-2 transition-all duration-300 cursor-pointer flex items-center gap-6",
                            isSelected
                                ? "border-purple-600 bg-purple-50/10 shadow-lg shadow-purple-50"
                                : "border-slate-50 hover:border-purple-200 hover:bg-slate-50/50"
                        )}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onTogglePlay(track.id)
                            }}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0",
                                isPlaying
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-purple-600"
                            )}
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5 fill-current" />
                            ) : (
                                <Play className="h-5 w-5 fill-current ml-0.5" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4
                                    className={cn(
                                        "font-bold text-base transition-colors truncate",
                                        isSelected ? "text-purple-900" : "text-slate-900"
                                    )}
                                >
                                    {track.name}
                                </h4>
                                {track.badge && (
                                    <span
                                        className={cn(
                                            "text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter",
                                            track.badge === "POPULAR"
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-purple-100 text-purple-600"
                                        )}
                                    >
                                        {track.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                {track.uploadedAt ? (
                                    <>
                                        Uploaded {track.uploadedAt} • {track.size}
                                    </>
                                ) : (
                                    <>
                                        {track.genre} • {track.mood} • {track.bpm} BPM
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Mini Waveform */}
                        <div className="hidden md:flex items-center gap-1 h-6 px-4 shrink-0">
                            {[0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.5].map((h, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-[3px] rounded-full transition-all duration-500",
                                        isPlaying ? "animate-pulse bg-purple-600" : "bg-slate-200"
                                    )}
                                    style={{ height: `${h * 100}%` }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <span className="text-sm font-bold text-slate-400 font-mono">
                                {track.duration}
                            </span>
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected
                                        ? "bg-purple-600 border-purple-600"
                                        : "border-slate-200 group-hover:border-purple-200"
                                )}
                            >
                                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
