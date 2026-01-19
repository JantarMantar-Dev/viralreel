"use client"

import { motion } from "framer-motion"
import { Wand2, Share2, MonitorPlay } from "lucide-react"

const steps = [
    {
        title: "1. Choose Your Niche",
        description: "Select from viral niches like True Crime, History, or Finance, or define your own custom topic.",
        icon: Wand2,
        color: "bg-purple-100 text-purple-600"
    },
    {
        title: "2. AI Generates Magic",
        description: "Our AI writes the script, selects stock footage, adds voiceovers, and syncs background music in seconds.",
        icon: MonitorPlay,
        color: "bg-blue-100 text-blue-600"
    },
    {
        title: "3. Customize & Viralize",
        description: "Edit captions, swap visuals if you want, and auto-post to TikTok, YouTube, and Instagram with one click.",
        icon: Share2,
        color: "bg-pink-100 text-pink-600"
    }
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white relative">
             <div className="container px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">How It Works</h2>
                    <p className="text-lg text-slate-600">Go from blank page to viral video in 3 simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className={`size-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 shadow-sm`}>
                                <step.icon className="size-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
             </div>
        </section>
    )
}
