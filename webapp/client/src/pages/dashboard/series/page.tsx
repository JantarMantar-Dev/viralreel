import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
    Search,
    MoreVertical,
    Calendar,
    Play,
    Layers,
    Plus,
    Settings,
    ChevronRight,
    ArrowLeft,
    Loader2,
    LayoutGrid,
    List,
    Trash2,
    Edit,
    Zap,
    Download
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { API_BASE_URL } from "@/lib/config"
import { formatRelativeDate } from "@/lib/date-utils"
import { VideoPlayerDialog } from "../videos/components/video-player-dialog"

// --- Types ---

interface Episode {
    id: string
    title: string
    description: string
    thumbnailUrl: string
    status: "Draft" | "Rendering" | "Completed"
    episodeNumber: number
    date: string
    duration?: number
    outputUrl?: string
    compressedUrl?: string
    aspectRatio?: "portrait" | "landscape"
}

interface SeriesDetails {
    id: string
    name: string
    description: string
    createdAt: string
    episodeCount: number
    nicheId: string | null
    nicheName: string
    episodes: Episode[]
}

// --- Helpers ---


// --- Components ---

function EpisodeStatusBadge({ status }: { status: Episode["status"] }) {
    if (status === "Rendering") {
        return (
            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-yellow-100">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                </span>
                Rendering
            </div>
        )
    }
    if (status === "Draft") {
        return (
            <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200">
                Draft
            </div>
        )
    }
    return (
        <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-green-100">
            Completed
        </div>
    )
}

export default function SeriesDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [playerEpisode, setPlayerEpisode] = useState<Episode | null>(null)

    const queryClient = useQueryClient()

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['series', id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/projects/series/${id}`, {
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to fetch series details')
            return res.json()
        },
        refetchInterval: 10000,
    })

    const { mutate: deleteEpisode } = useMutation({
        mutationFn: async (videoId: string) => {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${videoId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to delete episode')
            return res.json()
        },
        onSuccess: () => {
            toast.success("Episode deleted successfully")
            queryClient.invalidateQueries({ queryKey: ['series', id] })
            setDeleteId(null)
        }
    })

    const { mutate: renderEpisode } = useMutation({
        mutationFn: async (videoId: string) => {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${videoId}/render`, {
                method: 'POST',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to start rendering')
            return res.json()
        },
        onSuccess: () => {
            toast.success("Rendering queued!")
            queryClient.invalidateQueries({ queryKey: ['series', id] })
        }
    })

    const handleDelete = (videoId: string) => {
        setDeleteId(videoId)
    }

    const series: SeriesDetails | null = response?.series || null

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                <p className="text-slate-500 mt-4 font-medium">Loading series details...</p>
            </div>
        )
    }

    if (error || !series) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <ArrowLeft className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Series Not Found</h2>
                <p className="text-slate-500 mt-2 max-w-md">
                    We couldn't find the series you're looking for. It might have been deleted or you may not have access.
                </p>
                <Button onClick={() => navigate("/videos")} className="mt-6 bg-purple-600 hover:bg-purple-700">
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    const filteredEpisodes = series.episodes.filter(ep =>
        ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col w-full min-h-screen bg-slate-50/30">
            {/* Header / Search Area */}
            <div className="flex items-center gap-4 p-4 w-full bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="relative flex-1 max-w-4xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search episodes in series..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 w-full bg-slate-50/50 border-transparent focus-visible:bg-white focus-visible:ring-purple-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <Button
                        onClick={() => navigate(`/create?type=series&seriesId=${series.id}&nicheId=${series.nicheId || ''}`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Episode
                    </Button>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full p-6 animate-in fade-in duration-500">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-6">
                    <Link to="/videos" className="hover:text-purple-600 transition-colors">Back to Dashboard</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900">Series Details</span>
                </nav>

                {/* Series Hero Section */}
                <Card className="p-1 sm:p-6 mb-8 border-slate-200 shadow-sm rounded-2xl overflow-hidden relative">
                    <div className="flex flex-col md:flex-row gap-6">


                        {/* Series Metadata */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{series.name}</h1>
                                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Series</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                                        <Play className="h-3.5 w-3.5" />
                                    </div>
                                    <span>{series.episodeCount} Episodes</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <div className="bg-slate-100 p-1.5 rounded-lg">
                                        <Calendar className="h-3.5 w-3.5" />
                                    </div>
                                    <span>Last updated {formatRelativeDate(series.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </Card>

                {/* Episodes List Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Episodes</h2>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-white shadow-sm text-purple-600">
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-slate-400">
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Episodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredEpisodes.map((ep) => (
                        <Card
                            key={ep.id}
                            onClick={() => {
                                if (ep.status === "Completed") {
                                    setPlayerEpisode(ep);
                                }
                            }}
                            className="group flex flex-col p-4 h-full rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 hover:border-purple-200 hover:-translate-y-1 cursor-pointer"
                        >
                            {/* Header: Status | Duration */}
                            <div className="flex items-center justify-between mb-3">
                                <EpisodeStatusBadge status={ep.status} />
                                {ep.duration && (
                                    <div className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {ep.duration === 0.5 ? "00:30" : `${ep.duration}:00`}
                                    </div>
                                )}
                            </div>

                            {/* Info Area */}
                            <div className="flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 py-1 leading-tight">
                                        {ep.title}
                                    </h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 -mr-1 -mt-1" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (ep.status === "Completed") setPlayerEpisode(ep);
                                                }}
                                                disabled={ep.status !== "Completed"}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Open
                                            </DropdownMenuItem>
                                            {ep.outputUrl && (
                                                <DropdownMenuItem asChild>
                                                    <a href={ep.outputUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </a>
                                                </DropdownMenuItem>
                                            )}
                                            {ep.status === "Draft" && (
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); renderEpisode(ep.id); }}>
                                                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                                    Render Now
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/create?editVideoId=${ep.id}`); }}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(ep.id); }} className="text-red-600 focus:text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-3 mb-4 flex-1">
                                    {ep.description || "No episode summary available."}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        <Calendar className="h-3 w-3" />
                                        {formatRelativeDate(ep.date)}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                                        EP {String(ep.episodeNumber).padStart(2, '0')}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Create Next Card */}
                    <Card
                        onClick={() => navigate(`/create?type=series&seriesId=${series.id}&nicheId=${series.nicheId || ''}`)}
                        className="flex flex-col items-center justify-center p-6 border-dashed border-2 border-slate-200 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 group cursor-pointer aspect-[4/3] sm:aspect-auto"
                    >
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-slate-700 group-hover:text-purple-700 transition-colors text-center">Create Next Episode</h3>
                        <p className="text-xs text-slate-400 mt-2 text-center group-hover:text-purple-600/70 transition-colors">
                            Continue the series with Episode {series.episodes.length + 1}
                        </p>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Episode
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to delete this episode? This action cannot be undone and will permanently remove the video and its associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteId(null)}
                            className="font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteEpisode(deleteId)}
                            className="bg-red-600 hover:bg-red-700 font-bold"
                        >
                            Delete Episode
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Video Player Dialog */}
            <VideoPlayerDialog
                project={playerEpisode}
                open={!!playerEpisode}
                onOpenChange={(open) => !open && setPlayerEpisode(null)}
            />
        </div>
    )
}
