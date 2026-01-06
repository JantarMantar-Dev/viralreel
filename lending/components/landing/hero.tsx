"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { PlayCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import posthog from 'posthog-js'
import { useState } from "react"
import { VideoPlayerDialog } from "@/components/video-player-dialog"

import { useLendingAsset } from "@/hooks/use-lending-asset"

export function Hero() {
    const [isVideoOpen, setIsVideoOpen] = useState(false)

    // Resolve assets with fallback
    const videoUrl = useLendingAsset("disney-tech-my_little_rocket_ship_kid_story.mp4", "/videos/disney-tech-my_little_rocket_ship_kid_story.mp4")
    const posterUrl = "/thumbnails/disney-tech-my_little_rocket_ship_kid_story.jpg"

    const [activeVideo, setActiveVideo] = useState({
        src: "/videos/disney-tech-my_little_rocket_ship_kid_story.mp4",
        poster: "/thumbnails/disney-tech-my_little_rocket_ship_kid_story.jpg"
    })

    const openVideo = (src: string, poster?: string) => {
        setActiveVideo({ src, poster: poster || "" })
        setIsVideoOpen(true)
    }

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-40 pointer-events-none">
                <div className="absolute top-20 left-1/4 size-96 bg-purple-500/30 rounded-full blur-[128px]" />
                <div className="absolute top-40 right-1/4 size-96 bg-blue-500/30 rounded-full blur-[128px]" />
            </div>

            <div className="container px-6 mx-auto relative z-10 text-center lg:text-left">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    <div className="flex flex-col items-center lg:items-start space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge className="mb-4">
                                <span className="mr-2">✨</span>
                                #1 AI Tool for Automated Content Creation
                            </Badge>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900"
                        >
                            Create Any Video <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                                in 5 Minutes
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-600 max-w-2xl"
                        >
                            Your AI content creator works 24/7. Generate viral videos across niches and auto-post to TikTok, Instagram, and YouTube Shorts completely on autopilot.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                        >
                            <Link href={process.env.NEXT_PUBLIC_APP_URL || '#'}>
                                <Button
                                    size="lg"
                                    variant="gradient"
                                    className="w-full sm:w-auto group"
                                    onClick={() => posthog.capture('hero_cta_clicked', { button: 'start_creating_free' })}
                                >
                                    Start Creating Free
                                    <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => {
                                    posthog.capture('hero_cta_clicked', { button: 'watch_demo' })
                                    openVideo("https://www.youtube.com/watch?v=ctrap1vIX48")
                                }}
                            >
                                <PlayCircle className="mr-2 size-4" />
                                Watch Demo
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex flex-col gap-6 pt-8 border-t border-slate-200 w-full"
                        >
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <h4 className="text-2xl font-bold text-slate-900">5 min</h4>
                                    <p className="text-sm text-slate-500">To create</p>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-slate-900">24/7</h4>
                                    <p className="text-sm text-slate-500">Auto-posting</p>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-slate-900">100%</h4>
                                    <p className="text-sm text-slate-500">AI-powered</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                                <span>Post to:</span>
                                <div className="flex items-center gap-3">
                                    {/* YouTube Icon */}
                                    <div className="size-8 rounded-full bg-red-100 flex items-center justify-center group cursor-pointer hover:bg-red-200 transition-colors">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-red-600">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </div>
                                    {/* Instagram Icon */}
                                    <div className="size-8 rounded-full bg-pink-100 flex items-center justify-center group cursor-pointer hover:bg-pink-200 transition-colors">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-pink-600">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                                        </svg>
                                    </div>
                                    {/* TikTok Icon */}
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center group cursor-pointer hover:bg-slate-200 transition-colors">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-slate-900">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="w-full max-w-sm mx-auto lg:mr-0 rounded-[2rem] border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 aspect-[9/16] relative"
                    >
                        {/* Phone Frame / Reel Preview */}
                        <div
                            className="absolute inset-0 bg-slate-800 flex items-center justify-center relative group cursor-pointer overflow-hidden rounded-[1.8rem]"
                            onClick={() => openVideo(videoUrl, posterUrl)}
                        >
                            <video
                                src={videoUrl}
                                poster={posterUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                loop
                                autoPlay
                                preload="auto"
                            />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20" />

                            {/* Hover Overlay */}
                            <div className="absolute inset-x-0 bottom-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-slate-900 shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <PlayCircle className="size-4" />
                                    Click to expand
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            <VideoPlayerDialog
                open={isVideoOpen}
                onOpenChange={setIsVideoOpen}
                videoSrc={activeVideo.src}
                poster={activeVideo.poster}
            />
        </section>
    )
}
