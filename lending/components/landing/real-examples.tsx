"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { VideoPlayerDialog } from "@/components/video-player-dialog"

const VIDEOS = [
    {
        id: "anime-tech",
        src: "/videos/anime-tech-first_computer_eniac_story.mp4",
        poster: "/thumbnails/anime-tech-first_computer_eniac_story.jpg",
        title: "Anime Tech History",
        tag: "Viral Structure",
        niche: "Tech History"
    },
    {
        id: "comic-crime",
        src: "/videos/comic-true_crime-kids_missing_blue_pen.mp4",
        poster: "/thumbnails/comic-true_crime-kids_missing_blue_pen.jpg",
        title: "True Crime Comic",
        tag: "High Retention",
        niche: "True Crime"
    },
    {
        id: "lego-tech",
        src: "/videos/lego-tech-first_mobile_phone_story.mp4",
        poster: "/thumbnails/lego-tech-first_mobile_phone_story.jpg",
        title: "Lego Tech Story",
        tag: "Storytelling",
        niche: "Tech"
    },
    {
        id: "disney-tech",
        src: "/videos/disney-tech-my_little_rocket_ship_kid_story.mp4",
        poster: "/thumbnails/disney-tech-my_little_rocket_ship_kid_story.jpg",
        title: "Disney Style Story",
        tag: "Educational",
        niche: "Kids Stories"
    },
    {
        id: "painting-history",
        src: "/videos/painting-history_fact-usa_founding_story.mp4",
        poster: "/thumbnails/painting-history_fact-usa_founding_story.jpg",
        title: "History Painting",
        tag: "Historical",
        niche: "History"
    }
]

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function RealExamples() {
    const [selectedVideo, setSelectedVideo] = useState<typeof VIDEOS[0] | null>(null)

    return (
        <section className="relative py-24 overflow-hidden" id="examples">
            {/* Background Gradients - Matching Hero Style */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-40 pointer-events-none">
                <div className="absolute bottom-20 left-1/4 size-96 bg-purple-500/30 rounded-full blur-[128px]" />
                <div className="absolute top-40 right-1/4 size-96 bg-blue-500/30 rounded-full blur-[128px]" />
            </div>

            <div className="container px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6"
                    >
                        Professional Quality Videos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                            Created with Zero Effort
                        </span>
                    </motion.h2>
                    <p className="text-lg text-slate-600">
                        See what's possible. These videos were created 100% by AI in minutes.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
                    {VIDEOS.map((video, index) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            index={index}
                            onClick={(resolvedSrc) => setSelectedVideo({ ...video, src: resolvedSrc })}
                        />
                    ))}
                </div>

                <div className="flex justify-center">
                    <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                        <Button size="lg" variant="gradient" className="min-w-[200px]">
                            Start Creating for Free
                        </Button>
                    </Link>
                </div>
            </div>

            <VideoPlayerDialog
                open={!!selectedVideo}
                onOpenChange={(open) => !open && setSelectedVideo(null)}
                videoSrc={selectedVideo?.src || ""}
                poster={selectedVideo?.poster}
            />
        </section>
    )
}

import { useLendingAsset } from "@/hooks/use-lending-asset"

function VideoCard({
    video,
    index,
    onClick
}: {
    video: typeof VIDEOS[0],
    index: number,
    onClick: (src: string) => void
}) {
    const [isHovering, setIsHovering] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const videoFileName = video.src.split('/').pop() || ""

    // Use dynamic asset for video only
    const videoUrl = useLendingAsset(videoFileName, video.src)
    // Use static poster
    const posterUrl = video.poster

    const handleMouseEnter = () => {
        setIsHovering(true)
        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.play()
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 shadow-lg group cursor-pointer border border-slate-200/50 hover:border-purple-500/50 transition-colors"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(videoUrl)}
        >
            {/* Badges */}
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium z-10 backdrop-blur-sm">
                {video.tag}
            </div>
            <div className="absolute bottom-2 left-2 bg-white/90 text-slate-900 px-2 py-1 rounded text-xs font-medium z-10 shadow-sm">
                {video.niche}
            </div>

            <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                loop
            />

            {/* Overlay to indicate interactivity */}
            <div className={`absolute inset-0 bg-black/20 flex flex-col items-center justify-center transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
                <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                    <Play className="size-6 text-white fill-white ml-1" />
                </div>
            </div>

            {/* Hover Action Button */}
            <div className={`absolute inset-x-0 bottom-6 flex justify-center transition-all duration-300 z-20 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-slate-900 shadow-lg flex items-center gap-2">
                    <Play className="size-3 fill-slate-900" />
                    Click to expand
                </div>
            </div>
        </motion.div>
    )
}
