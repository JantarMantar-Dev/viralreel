import { useState } from "react"
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
    Bell
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

// --- Mock Data ---

interface Project {
    id: string
    title: string
    description: string
    thumbnailUrl: string
    type: "Single Video" | "Series"
    status: "Draft" | "Rendering" | "Completed"
    videoCount?: number
    date: string
    duration?: string
    isHd?: boolean
    is4k?: boolean
}

const mockProjects: Project[] = [
    {
        id: "1",
        title: "Cyberpunk City Intro",
        description: "Futuristic opening sequence for tech channel",
        thumbnailUrl: "https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=800&auto=format&fit=crop",
        type: "Single Video",
        status: "Rendering",
        date: "2 mins ago",
        duration: "00:15",
    },
    {
        id: "2",
        title: "Product Explainer Series",
        description: "Marketing campaign for Q4 launch",
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
        type: "Series",
        status: "Completed",
        videoCount: 4,
        date: "Oct 24, 2023",
        duration: "02:45",
        isHd: true
    },
    {
        id: "3",
        title: "Weekly Tech News",
        description: "Social media shorts series.",
        thumbnailUrl: "", // No preview
        type: "Series",
        status: "Draft",
        date: "Updated 1d ago",
    },
    {
        id: "4",
        title: "Untitled Project 12",
        description: "",
        thumbnailUrl: "", // No preview
        type: "Single Video",
        status: "Draft",
        date: "3 days ago",
    },
    {
        id: "5",
        title: "IG Reel - Product Showcase",
        description: "Vertical format for Instagram",
        thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
        type: "Single Video",
        status: "Completed",
        date: "Yesterday",
        duration: "00:58",
        is4k: true
    },
    {
        id: "6",
        title: "Cybersecurity Training",
        description: "Internal corporate training module",
        thumbnailUrl: "https://images.unsplash.com/photo-1563206767-5b1d97299337?q=80&w=800&auto=format&fit=crop",
        type: "Single Video",
        status: "Completed",
        date: "Oct 15, 2023",
        duration: "05:12",
        isHd: true
    }
]

// --- Components ---

function ProjectStatusBadge({ status }: { status: Project["status"] }) {
    if (status === "Rendering") {
        return (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-slate-800 shadow-sm border border-slate-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Rendering
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
        <Card className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 hover:border-purple-200">
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

export default function MyVideosPage() {
    const [filter, setFilter] = useState<"All" | "Single" | "Series">("All")

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Top Bar (Search & Actions) */}
            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative w-full max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search projects, templates..."
                        className="pl-10 h-10 w-full bg-white border-slate-200 focus-visible:ring-purple-500/20"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-purple-600 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200">
                        <Plus className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </div>
            </div>

            {/* Header */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {mockProjects
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
            </div>
        </div>
    )
}
