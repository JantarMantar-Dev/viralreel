import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
    Search,
    MoreVertical,
    Calendar,
    Play,
    Layers,
    List,
    LayoutGrid,
    Filter,
    Plus,
    Bell,
    Loader2
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
import { VideosEmptyState } from "./components/videos-empty-state"
import { API_BASE_URL } from "@/lib/config"

// --- Types ---

interface Project {
    id: string
    title: string
    description: string
    thumbnailUrl: string
    type: "Single Video" | "Series"
    status: "Draft" | "Rendering" | "Completed" | "Scripting"
    videoCount?: number
    date: string
    duration?: string
    isHd?: boolean
    is4k?: boolean
}

// --- Components ---

function ProjectStatusBadge({ status }: { status: Project["status"] }) {
    if (status === "Rendering" || status === "Scripting") {
        return (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-slate-800 shadow-sm border border-slate-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                {status}
            </div>
        )
    }
    if (status === "Draft") {
        return (
            <div className="absolute top-3 left-3 bg-slate-100/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
                Draft
            </div>
        )
    }
    if (status === "Completed") {
        return (
            <div className="absolute top-3 left-3 bg-green-100/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-green-700 shadow-sm border border-green-200">
                Completed
            </div>
        )
    }
    return null
}

function VideoTypeBadge({ type, count }: { type: Project["type"], count?: number }) {
    if (type === "Series") {
        return (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm">
                <Layers className="h-3 w-3" />
                Series
            </div>
        )
    }
    // Single video usually doesn't need a badge unless we want to distinguish
    return null
}

function VideoCard({ project }: { project: Project }) {
    return (
        <Card className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 hover:border-purple-200 cursor-pointer">
            {/* Thumbnail Area */}
            <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                {project.thumbnailUrl ? (
                    <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Play className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs uppercase tracking-wider font-semibold">No Preview</span>
                    </div>
                )}

                {/* Overlays */}
                <ProjectStatusBadge status={project.status} />
                <VideoTypeBadge type={project.type} count={project.videoCount} />

                {/* Duration Badge */}
                {project.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white">
                        {project.duration}
                    </div>
                )}

                {/* Series Count Badge (if applicable) */}
                {project.videoCount && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white">
                        {project.videoCount} Videos
                    </div>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                        <Play className="h-6 w-6 text-purple-600 fill-current ml-1" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 text-sm group-hover:text-purple-600 transition-colors">
                        {project.title}
                    </h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-slate-400 hover:text-slate-600">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">
                    {project.description || "No description provided"}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {project.date}
                    </div>

                    <div className="flex gap-2">
                        {project.isHd && (
                            <span className="bg-purple-50 text-purple-600 px-1.5 rounded font-bold text-[10px]">HD</span>
                        )}
                        {project.is4k && (
                            <span className="bg-purple-100 text-purple-700 px-1.5 rounded font-bold text-[10px]">4K</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}

interface VideoListViewProps {
    filter: "All" | "Single" | "Series"
    setFilter: (f: "All" | "Single" | "Series") => void
    navigate: ReturnType<typeof useNavigate>
    projects: Project[]
    isLoading: boolean
}

function VideoListView({ filter, setFilter, navigate, projects, isLoading }: VideoListViewProps) {
    return (
        <div className="flex flex-col w-full h-full">
            {/* Top Bar (Search & Actions) - Full Width Header */}
            <div className="flex items-center gap-4 p-4 w-full bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="relative flex-1 max-w-4xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search projects, templates..."
                        className="pl-10 h-10 w-full bg-slate-50/50 border-transparent focus-visible:bg-white focus-visible:ring-purple-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-purple-600 relative">
                                <Bell className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-0">
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <Bell className="h-8 w-8 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-900">No notifications</p>
                                <p className="text-xs text-slate-500 mt-1">You're all caught up! Check back later for updates.</p>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        onClick={() => navigate("/dashboard/create")}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500 p-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Videos</h1>
                        <p className="text-slate-500 mt-1">Manage and organize your AI generated videos.</p>
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-lg self-start md:self-auto">
                        <button
                            onClick={() => setFilter("All")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "All"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            All Projects
                        </button>
                        <button
                            onClick={() => setFilter("Single")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "Single"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            Single Videos
                        </button>
                        <button
                            onClick={() => setFilter("Series")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "Series"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            Series
                        </button>
                    </div>
                </div>

                {/* Filters & Content */}
                <div className="space-y-6">
                    {/* Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {projects
                                .filter(p => {
                                    if (filter === "All") return true
                                    if (filter === "Single") return p.type === "Single Video"
                                    if (filter === "Series") return p.type === "Series"
                                    return true
                                })
                                .map((project) => (
                                    <VideoCard key={project.id} project={project} />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function MyVideosPage() {
    const navigate = useNavigate()
    const [filter, setFilter] = useState<"All" | "Single" | "Series">("All")

    const { data: response, isLoading } = useQuery({
        queryKey: ['projects', filter], // Refetch when filter changes
        queryFn: async () => {
            // Map filter to API type
            let typeParam = "all";
            if (filter === "Series") typeParam = "series";
            if (filter === "Single") typeParam = "video";

            const res = await fetch(`${API_BASE_URL}/api/projects?type=${typeParam}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to fetch projects')
            return res.json()
        }
    })

    const projects: Project[] = (response?.projects || []).map((j: any) => ({
        id: j.id,
        title: j.title || "Untitled Video",
        description: j.description || "",
        thumbnailUrl: j.thumbnailUrl || "",
        type: j.type, // 'Series' or 'Single Video'
        status: j.status, // 'Rendering', 'Completed', 'Draft' from backend
        date: new Date(j.date).toLocaleDateString(),
        duration: j.duration ? `${j.duration}:00` : undefined,
        isHd: true,
        videoCount: j.videoCount
    }))

    // Sort by date (assuming id or createdAt is comparable, technically createdAt string needs parsing but fine for now)
    // Actually better to not sort on client unless we have raw dates. API said "orderBy(desc(series.createdAt))" so they come sorted.
    // But we are merging two lists.
    // Let's just concat for now.

    if (!isLoading && projects.length === 0) {
        return <VideosEmptyState onCreateNew={() => navigate("/dashboard/create")} />
    }

    return <VideoListView
        filter={filter}
        setFilter={setFilter}
        navigate={navigate}
        projects={projects}
        isLoading={isLoading}
    />
}
