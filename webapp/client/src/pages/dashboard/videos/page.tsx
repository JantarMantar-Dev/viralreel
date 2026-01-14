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
    Loader2,
    Trash2,
    Zap,
    Edit,
    Download,
    RotateCcw,
    Wand2,
    SlidersHorizontal
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
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { VideosEmptyState } from "./components/videos-empty-state"
import { API_BASE_URL } from "@/lib/config"
import { formatRelativeDate } from "@/lib/date-utils"
import { VideoPlayerDialog } from "./components/video-player-dialog"

// --- Types ---

interface Project {
    id: string
    title: string
    description: string
    thumbnailUrl: string
    type: "Single Video" | "Series"
    status: "Draft" | "Rendering" | "Completed" | "Failed"
    videoCount?: number
    date: string
    duration?: string
    isHd?: boolean
    is4k?: boolean
    outputUrl?: string
    compressedUrl?: string
    aspectRatio?: "portrait" | "landscape"
}

// --- Components ---


function ProjectStatusBadge({ status }: { status: Project["status"] }) {
    if (status === "Rendering") {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-yellow-100 cursor-default">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                            </span>
                            Rendering
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>It will take 5 mins. Sit back and relax.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    if (status === "Draft") {
        return (
            <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200">
                Draft
            </div>
        )
    }
    if (status === "Failed") {
        return (
            <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-red-100">
                Failed
            </div>
        )
    }
    if (status === "Completed") {
        return (
            <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-green-100">
                Completed
            </div>
        )
    }
    return null
}

function VideoTypeBadge({ type }: { type: Project["type"] }) {
    if (type === "Series") {
        return (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-purple-200">
                <Layers className="h-3 w-3" />
                Series
            </div>
        )
    }
    return null
}

function VideoCard({ project, onClick, onDelete, onRender, onRetry, onOpen }: { project: Project, onClick: () => void, onDelete: () => void, onRender?: () => void, onRetry?: () => void, onOpen?: () => void }) {
    return (
        <Card
            onClick={onClick}
            className="group relative flex flex-col p-4 h-full rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 hover:border-purple-200 cursor-pointer"
        >
            {/* Header: Status | Type or Duration */}
            <div className="flex items-center justify-between mb-3">
                <ProjectStatusBadge status={project.status} />

                {project.type === "Series" ? (
                    <VideoTypeBadge type={project.type} />
                ) : (
                    project.duration && (
                        <div className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {project.duration}
                        </div>
                    )
                )}
            </div>

            {/* Series Video Count Line */}
            {project.type === "Series" && (
                <div className="text-xs font-medium text-slate-900 mb-3">
                    {project.videoCount || 0} Videos
                </div>
            )}

            {/* Title & Menu */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
                    {project.title}
                </h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 -mt-1 text-slate-400 hover:text-slate-600"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                if (project.type === "Series" || project.status === "Completed") {
                                    onClick();
                                }
                            }}
                            disabled={project.type !== "Series" && project.status !== "Completed"}
                        >
                            {project.type === "Series" ? (
                                <>
                                    <Layers className="h-4 w-4 mr-2" />
                                    Open
                                </>
                            ) : (
                                <>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Detail
                                </>
                            )}
                        </DropdownMenuItem>
                        {project.type === "Single Video" && (
                            <>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (project.status === "Completed") onOpen?.();
                                    }}
                                    disabled={project.status !== "Completed"}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Open
                                </DropdownMenuItem>
                                {project.outputUrl && (
                                    <DropdownMenuItem asChild>
                                        <a href={project.outputUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </a>
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                        {project.type === "Single Video" && project.status === "Draft" && onRender && (
                            <DropdownMenuItem
                                className="text-purple-600 font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRender();
                                }}
                            >
                                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                Render Now
                            </DropdownMenuItem>
                        )}
                        {project.type === "Single Video" && project.status === "Failed" && onRetry && (
                            <DropdownMenuItem
                                className="text-orange-600 font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRetry();
                                }}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retry
                            </DropdownMenuItem>
                        )}
                        <Separator className="my-1" />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
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
        </Card>
    )
}


interface VideoListViewProps {
    filter: "All" | "Single" | "Series"
    setFilter: (f: "All" | "Single" | "Series") => void
    navigate: ReturnType<typeof useNavigate>
    projects: Project[]
    isLoading: boolean
    onDelete: (project: Project) => void
    onRender: (project: Project) => void
    onRetry: (project: Project) => void
    onOpen: (project: Project) => void
}

function VideoListView({ filter, setFilter, navigate, projects, isLoading, onDelete, onRender, onRetry, onOpen }: VideoListViewProps) {
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Create New
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {/* Auto Mode with sub-menu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer">
                                    <Wand2 className="mr-2 h-4 w-4 text-purple-600" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Auto Mode</span>
                                        <span className="text-[10px] text-slate-500 font-normal">Quick automated creation</span>
                                    </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48">
                                    <DropdownMenuItem onClick={() => navigate("/create?type=series")} className="cursor-pointer">
                                        <Layers className="mr-2 h-4 w-4" /> Create Series
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate("/create?type=video")} className="cursor-pointer">
                                        <Play className="mr-2 h-4 w-4" /> Single Video
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Editor Mode - direct navigation */}
                            <DropdownMenuItem onClick={() => navigate("/editor/niche")} className="cursor-pointer">
                                <SlidersHorizontal className="mr-2 h-4 w-4 text-purple-600" />
                                <div className="flex flex-col">
                                    <span className="font-semibold">Editor Mode</span>
                                    <span className="text-[10px] text-slate-500 font-normal">Full creative control</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                    <VideoCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => {
                                            if (project.type === "Series") {
                                                navigate(`/videos/series/${project.id}`)
                                            } else {
                                                // For now, standalone videos might go to edit or review
                                                if (project.status === "Completed") {
                                                    onOpen(project);
                                                }
                                            }
                                        }}
                                        onDelete={() => onDelete(project)}
                                        onRender={() => onRender(project)}
                                        onRetry={() => onRetry(project)}
                                        onOpen={() => onOpen(project)}
                                    />
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
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
    const [playerProject, setPlayerProject] = useState<Project | null>(null)
    const queryClient = useQueryClient()

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
        },
        refetchInterval: 10000,
    })

    const projects: Project[] = (response?.projects || []).map((j: any) => ({
        id: j.id,
        title: j.title || "Untitled Video",
        description: j.description || "",
        thumbnailUrl: j.thumbnailUrl || "",
        type: j.type, // 'Series' or 'Single Video'
        status: j.status, // 'Rendering', 'Completed', 'Draft' from backend
        date: formatRelativeDate(j.date),
        duration: j.duration ? (j.duration === 0.5 ? "00:30" : `${j.duration}:00`) : undefined,
        isHd: true,
        videoCount: j.videoCount,
        outputUrl: j.outputUrl,
        compressedUrl: j.compressedUrl,
        aspectRatio: j.aspectRatio
    }))

    // Sort by date (assuming id or createdAt is comparable, technically createdAt string needs parsing but fine for now)
    // Actually better to not sort on client unless we have raw dates. API said "orderBy(desc(series.createdAt))" so they come sorted.
    // But we are merging two lists.
    // Let's just concat for now.

    const { mutate: deleteProject } = useMutation({
        mutationFn: async (project: Project) => {
            const url = project.type === "Series"
                ? `${API_BASE_URL}/api/projects/series/${project.id}`
                : `${API_BASE_URL}/api/jobs/${project.id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to delete project');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success("Project deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setDeleteTarget(null);
        }
    });

    const { mutate: renderProject } = useMutation({
        mutationFn: async (project: Project) => {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${project.id}/render`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.message || 'Failed to trigger render');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Rendering process started!");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });

    const { mutate: retryProject } = useMutation({
        mutationFn: async (project: Project) => {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${project.id}/retry`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.message || 'Failed to retry video');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Video queued for reprocessing!");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });

    if (!isLoading && projects.length === 0) {
        return <VideosEmptyState onTypeSelect={(type) => navigate(`/create?type=${type}`)} />
    }

    return (
        <>
            <VideoListView
                filter={filter}
                setFilter={setFilter}
                navigate={navigate}
                projects={projects}
                isLoading={isLoading}
                onDelete={(p) => setDeleteTarget(p)}
                onRender={(p) => renderProject(p)}
                onRetry={(p) => retryProject(p)}
                onOpen={(p) => setPlayerProject(p)}
            />

            {/* Video Player Dialog */}
            <VideoPlayerDialog
                project={playerProject}
                open={!!playerProject}
                onOpenChange={(open) => !open && setPlayerProject(null)}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete {deleteTarget?.type === "Series" ? "Series" : "Video"}
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            {deleteTarget?.type === "Series"
                                ? "Are you sure you want to delete this entire series? This will permanently remove all episodes and associated data."
                                : "Are you sure you want to delete this video? This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteTarget(null)}
                            className="font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteProject(deleteTarget)}
                            className="bg-red-600 hover:bg-red-700 font-bold"
                        >
                            Delete {deleteTarget?.type === "Series" ? "Series" : "Video"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
