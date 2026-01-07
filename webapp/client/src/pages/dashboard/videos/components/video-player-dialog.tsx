import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw, Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface VideoProject {
    id: string
    title: string
    outputUrl?: string
    compressedUrl?: string
    aspectRatio?: "portrait" | "landscape"
}

interface VideoPlayerDialogProps {
    project: VideoProject | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VideoPlayerDialog({ project, open, onOpenChange }: VideoPlayerDialogProps) {
    const [isRetrying, setIsRetrying] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleRetry = async () => {
        if (!project) return;

        setIsRetrying(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${project.id}/retry`, {
                method: 'POST',
                credentials: 'include'
            })
            if (!res.ok) throw new Error("Failed");

            toast.success("Retry request sent. Please wait while we process it.")
        } catch (e) {
            toast.error("Failed to send retry request")
        } finally {
            setIsRetrying(false)
        }
    }

    if (!project) return null

    const playbackUrl = project.compressedUrl || project.outputUrl;
    const hasUrl = !!playbackUrl;
    const isPortrait = project.aspectRatio === "portrait";

    return (
        <TooltipProvider>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`p-0 overflow-hidden bg-black border-slate-800 gap-0 transition-all duration-300 ${isPortrait ? 'sm:max-w-sm' : 'sm:max-w-4xl'}`}>
                    <DialogTitle className="sr-only">{project.title}</DialogTitle>

                    {hasUrl ? (
                        <div className={`relative bg-black flex items-center justify-center ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
                            <video
                                src={playbackUrl}
                                controls
                                className="w-full h-full object-contain"
                                autoPlay
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-white h-[400px]">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Video Not Available</h3>
                            <p className="text-slate-400 mb-6 max-w-sm">
                                The video URL is missing. It might be processing or has expired.
                            </p>
                            <Button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                variant="secondary"
                            >
                                {isRetrying ? (
                                    "Processing..."
                                ) : (
                                    <><RotateCcw className="mr-2 h-4 w-4" /> Retry Processing</>
                                )}
                            </Button>
                        </div>
                    )}

                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h4 className="text-slate-200 font-medium truncate max-w-[60%] cursor-default">
                                    {project.title.length > 20 ? `${project.title.substring(0, 20)}...` : project.title}
                                </h4>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs break-words">
                                {project.title}
                            </TooltipContent>
                        </Tooltip>

                        {project.outputUrl && (
                            <Button
                                size="sm"
                                className="bg-white text-slate-900 hover:bg-slate-200 border-none font-medium shadow-sm transition-colors"
                                onClick={async () => {
                                    if (!project.outputUrl) return;
                                    try {
                                        setIsDownloading(true);
                                        const response = await fetch(project.outputUrl);
                                        if (!response.ok) throw new Error('Download failed');
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = url;
                                        a.download = `${project.title}.mp4`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                        toast.success("Download started");
                                    } catch (error) {
                                        console.error('Download error:', error);
                                        toast.error("Failed to download video");
                                    } finally {
                                        setIsDownloading(false);
                                    }
                                }}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {isDownloading ? "Downloading..." : "Download Original"}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
