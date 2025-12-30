
"use client"

import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface VideoPlayerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    videoSrc: string
    poster?: string
}

export function VideoPlayerDialog({
    open,
    onOpenChange,
    videoSrc,
    poster
}: VideoPlayerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className={`${videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') ? 'sm:max-w-4xl' : 'sm:max-w-[420px]'} p-0 overflow-hidden bg-black border-none shadow-2xl rounded-[2rem]`}>
                <DialogTitle className="sr-only">Video Player</DialogTitle>

                <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/40 p-2 text-white/90 hover:bg-black/60 hover:text-white backdrop-blur-md transition-all border border-white/10 ring-offset-black focus:ring-2 focus:ring-white focus:outline-none">
                    <X className="size-5" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                <div className={`relative w-full flex items-center justify-center bg-black ${videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') ? 'aspect-video max-h-[80vh]' : 'aspect-[9/16] max-h-[90vh]'}`}>
                    {videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoSrc.includes('v=') ? videoSrc.split('v=')[1].split('&')[0] : videoSrc.split('/').pop()}?autoplay=1`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={videoSrc}
                            poster={poster}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            playsInline
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
