import { Play, Pause, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AudioItemProps {
    id: string
    title: string
    subtitle?: React.ReactNode
    badge?: {
        text: string
        variant?: "blue" | "purple" | "slate"
    }
    rightElement?: React.ReactNode
    isSelected?: boolean
    isPlaying?: boolean
    onSelect: () => void
    onTogglePlay: (e: React.MouseEvent) => void
}

export default function AudioListItem({
    title,
    subtitle,
    badge,
    rightElement,
    isSelected,
    isPlaying,
    onSelect,
    onTogglePlay,
}: AudioItemProps) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "group bg-white p-4 rounded-[20px] border-2 transition-all duration-300 cursor-pointer flex items-center gap-4 md:gap-6",
                isSelected
                    ? "border-purple-600 bg-purple-50/10 shadow-lg shadow-purple-50"
                    : "border-slate-50 hover:border-purple-200 hover:bg-slate-50/50"
            )}
        >
            <button
                onClick={onTogglePlay}
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
                        {title}
                    </h4>
                    {badge && (
                        <span
                            className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter uppercase",
                                badge.variant === "blue" && "bg-blue-100 text-blue-600",
                                badge.variant === "purple" && "bg-purple-100 text-purple-600",
                                (!badge.variant || badge.variant === "slate") && "bg-slate-100 text-slate-600"
                            )}
                        >
                            {badge.text}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">
                        {subtitle}
                    </p>
                )}
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
                {rightElement}
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
}
