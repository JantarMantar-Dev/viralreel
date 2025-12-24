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
    List
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { API_BASE_URL } from "@/lib/config"

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
}

interface SeriesDetails {
    id: string
    name: string
    description: string
    createdAt: string
    episodeCount: number
    nicheName: string
    episodes: Episode[]
}

// --- Helpers ---

function formatRelativeDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

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
            Published
        </div>
    )
}

export default function SeriesDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['series', id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/projects/series/${id}`, {
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to fetch series details')
            return res.json()
        }
    })

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
                <Button onClick={() => navigate("/dashboard/videos")} className="mt-6 bg-purple-600 hover:bg-purple-700">
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
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-purple-600">
                        <Settings className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200">
                                <Plus className="mr-2 h-4 w-4" /> Create Episode
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate("/dashboard/create")}>New Idea</DropdownMenuItem>
                            <DropdownMenuItem>Upload Script</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full p-6 animate-in fade-in duration-500">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-6">
                    <Link to="/dashboard/videos" className="hover:text-purple-600 transition-colors">Back to Dashboard</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900">Series Details</span>
                </nav>

                {/* Series Hero Section */}
                <Card className="p-1 sm:p-6 mb-8 border-slate-200 shadow-sm rounded-2xl overflow-hidden relative">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Series Thumbnail */}
                        <div className="w-full md:w-32 lg:w-48 aspect-square rounded-xl bg-slate-100 flex-shrink-0 relative overflow-hidden group">
                            {series.episodes[0]?.thumbnailUrl ? (
                                <img
                                    src={series.episodes[0].thumbnailUrl}
                                    alt={series.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Layers className="h-12 w-12" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" className="rounded-full shadow-lg">Change Cover</Button>
                            </div>
                        </div>

                        {/* Series Metadata */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{series.name}</h1>
                                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Series</span>
                            </div>
                            <p className="text-slate-500 mb-6 max-w-3xl line-clamp-2 leading-relaxed">
                                {series.description || "A cohesive series of videos generated with AI, maintaining visual and narrative consistency across all episodes."}
                            </p>

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

                        {/* Top Right Settings Button */}
                        <div className="absolute top-6 right-6 hidden md:block">
                            <Button variant="outline" size="sm" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                                <Settings className="h-4 w-4 mr-2" /> Settings
                            </Button>
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
                        <Card key={ep.id} className="group overflow-hidden rounded-2xl border-slate-200 hover:shadow-xl hover:shadow-purple-100/50 hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                            {/* Thumbnail Area */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                {ep.thumbnailUrl ? (
                                    <img
                                        src={ep.thumbnailUrl}
                                        alt={ep.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                                        <Play className="h-10 w-10 fill-current opacity-20" />
                                    </div>
                                )}

                                {/* Episode Number Overlay */}
                                <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                                    EP {String(ep.episodeNumber).padStart(2, '0')}
                                </div>

                                {/* Duration Overlay */}
                                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded">
                                    01:12
                                </div>

                                {/* Hover Play */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-white/90 p-3 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-all">
                                        <Play className="h-5 w-5 text-purple-600 fill-current ml-0.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1 py-1">
                                        {ep.title}
                                    </h3>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 -mr-1">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 h-8 mb-4">
                                    {ep.description || "No episode summary available."}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(ep.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <EpisodeStatusBadge status={ep.status} />
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Create Next Card */}
                    <Card
                        onClick={() => navigate("/dashboard/create")}
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
        </div>
    )
}
