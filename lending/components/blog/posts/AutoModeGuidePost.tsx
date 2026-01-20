import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Zap,
    Lightbulb,
    Play,
    Rocket,
    Settings,
    Sparkles,
    TrendingUp,
    Video,
    Clock,
    BarChart3,
    ListChecks,
    Search,
    Upload,
    Music,
    Mic,
    Palette,
    Monitor,
    Smartphone,
    Type,
    Check,
    ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function AutoModeGuidePost() {
    return (
        <article className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Article Header */}
            <header className="text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/50 border border-purple-200 text-purple-700 text-sm font-medium mb-4">
                    <Sparkles className="size-3.5" />
                    <span>Feature Spotlight</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                    From Idea to Viral: <br className="hidden md:block" />
                    Create AI Shorts in{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        60 Seconds
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Discover how to automate your content creation with ViralReel's Auto Mode. Turn text into viral TikToks, Reels, and YouTube Shorts in minutes.
                </p>

                {/* Reading time & stats */}
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 pt-4">
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        5 min read
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ListChecks className="size-4" />
                        6 Steps
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Zap className="size-4" />
                        No Editing Required
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">

                <p className="lead text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
                    Stop us if this sounds familiar: You have a brilliant idea for a video. You spend hours writing a script, hunting for stock footage, recording a voiceover, and fiddling with captions. By the time you hit export, you're too exhausted to do it again.
                </p>

                <p>
                    Consistency is the key to growth on TikTok, Instagram Reels, and YouTube Shorts—but traditional video editing is the bottleneck.
                </p>

                <p>
                    Enter <strong>ViralReel's Auto Mode</strong>.
                </p>

                <p>
                    Designed for creators, marketers, and faceless channel owners, Auto Mode is your "magic wand" for content creation. It transforms a simple text prompt into a fully edited, captioned, and voiced video in minutes.
                </p>

                <p>
                    Here is your step-by-step guide to dominating the algorithm without lifting a finger.
                </p>

                <div className="not-prose my-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 pt-4 md:p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Rocket className="size-5 text-purple-600" />
                            What is Auto Mode?
                        </h3>
                        <p className="text-slate-600 mb-0 leading-relaxed text-[15px]">
                            Think of Auto Mode as an expert video editor who lives inside your browser. You provide the <strong>direction</strong>, and it handles the <strong>execution</strong>—scripting, AI image generation, voiceovers, audio syncing, and those trendy captions that keep viewers glued to the screen.
                        </p>
                    </div>
                </div>

                {/* Step 1: Niche */}
                <SectionHeader
                    step={1}
                    icon={<TargetIcon />}
                    title="Choose Your Winning Niche"
                />

                <p>
                    The algorithm loves niche content. Whether you're building a "Faceless" history channel or a motivation page, starting with a clear category helps our AI optimize the output for your specific audience.
                </p>

                {/* UI Mockup: Niche Selection */}
                <div className="not-prose my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-2 border-slate-200 rounded-2xl p-6 bg-white hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <Search className="size-6 text-slate-600 group-hover:text-purple-600" />
                            </div>
                            <h4 className="font-bold text-slate-900">True Crime</h4>
                        </div>
                        <p className="text-sm text-slate-500">Dive into the dark side of human nature...</p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#Mystery</span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#Suspense</span>
                        </div>
                    </div>

                    <div className="border-2 border-slate-200 rounded-2xl p-6 bg-white hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <Lightbulb className="size-6 text-slate-600 group-hover:text-purple-600" />
                            </div>
                            <h4 className="font-bold text-slate-900">Motivation</h4>
                        </div>
                        <p className="text-sm text-slate-500">Inspire your audience with powerful quotes...</p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#Success</span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#Mindset</span>
                        </div>
                    </div>
                </div>

                <div className="not-prose my-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <Lightbulb className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800 m-0">
                                <strong>Pro Tip:</strong> Don't see your specific topic? Select <strong>"Create Your Own"</strong> to train the AI on your unique sub-niche, like "Urban Gardening" or "Retro Gaming Facts."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 2: Vision/Prompt */}
                <SectionHeader
                    step={2}
                    icon={<Sparkles className="size-6" />}
                    title="Define Your Vision (The 'Prompt')"
                />

                <p>
                    This is the only part where you need to do a little typing. You provide the creative spark; our specialized LLMs handle the scriptwriting structure (hooks, retention points, and CTAs).
                </p>

                <div className="not-prose my-8 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Video Name</label>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-900 font-medium shadow-sm">
                            My Viral Short
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Describe Your Idea</label>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-900 shadow-sm">
                            Create a suspenseful video about the disappearance of the Mary Celeste. Focus on the untouched meal found on the table.
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Aspect Ratio</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 border-purple-500 bg-purple-50 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer relative">
                                <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
                                    <Check className="size-3 text-white" />
                                </div>
                                <Smartphone className="size-8 text-purple-600" />
                                <span className="font-bold text-purple-900 text-sm">Portrait (9:16)</span>
                                <span className="text-xs text-purple-700">TikTok, Reels, Shorts</span>
                            </div>
                            <div className="border-2 border-slate-200 bg-white rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer opacity-60">
                                <Monitor className="size-8 text-slate-400" />
                                <span className="font-bold text-slate-500 text-sm">Landscape (16:9)</span>
                                <span className="text-xs text-slate-400">YouTube Long</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3: Voice */}
                <SectionHeader
                    step={3}
                    icon={<Mic className="size-6" />}
                    title="Select a Human-Like AI Voice"
                />

                <p>
                    Bad audio kills retention. ViralReel offers a library of ultra-realistic, neural AI voices that sound just like professional narrators.
                </p>

                <div className="not-prose my-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Search className="size-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Search voices...</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        <VoiceItem
                            name="Sarah"
                            details="Woman • English • Calm"
                            selected={false}
                        />
                        <VoiceItem
                            name="Marcus"
                            details="Man • English • Deep • 'Movie Trailer' Style"
                            selected={true}
                        />
                        <VoiceItem
                            name="Emily"
                            details="Woman • English • Energetic"
                            selected={false}
                        />
                    </div>
                </div>

                <div className="not-prose my-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <Lightbulb className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800 m-0">
                                <strong>Pro Tip:</strong> For horror or mystery content, choose a deeper, slower voice (like 'Marcus'). For tech or facts, go with something faster and more energetic.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 4: Music */}
                <SectionHeader
                    step={4}
                    icon={<Music className="size-6" />}
                    title="Set the Atmosphere with Music"
                />

                <p>
                    Music is the emotional heartbeat of your video. Choose from our curated library, or <strong>upload your own track</strong>. Our system automatically handles the mixing and rendering, ensuring your custom audio fits perfectly.
                </p>

                <div className="not-prose my-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex border-b border-slate-100">
                        <div className="flex-1 p-4 text-center font-bold text-slate-400 hover:bg-slate-50 cursor-pointer text-sm">Upload</div>
                        <div className="flex-1 p-4 text-center font-bold text-purple-600 border-b-2 border-purple-600 bg-purple-50/50 text-sm">Library</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        <MusicItem
                            name="Suspenseful Buildup"
                            duration="2:30"
                            selected={true}
                        />
                        <MusicItem
                            name="Lo-Fi Chill"
                            duration="1:45"
                            selected={false}
                        />
                    </div>
                </div>

                {/* Step 5: Subtitles */}
                <SectionHeader
                    step={5}
                    icon={<Type className="size-6" />}
                    title='"Retention Hacking" Subtitles'
                />

                <p>
                    You've seen them on every viral video—colorful, animated captions that pop up word-by-word. This style keeps viewers watching even with the sound off.
                </p>

                <div className="not-prose my-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SubtitleCard
                        name="Classic CapCut"
                        style="bg-black text-white font-bold"
                        preview="BASIC"
                    />
                    <SubtitleCard
                        name="Neon Glow"
                        style="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] font-bold bg-slate-900"
                        preview="GLOW"
                    />
                    <SubtitleCard
                        name="Mr. Beast"
                        style="text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] stroke-black stroke-2 font-black text-xl"
                        preview="LOUD"
                    />
                </div>

                <div className="not-prose my-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                        <TrendingUp className="size-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-green-800 m-0">
                                <strong>Value Add:</strong> Using dynamic captions increases watch time by up to <strong>40%</strong>. We apply these automatically so you don't have to manually transcribe a single word.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 6: Review */}
                <SectionHeader
                    step={6}
                    icon={<CheckCircle2 className="size-6" />}
                    title="Review & Launch"
                />

                <p>
                    Before the AI gets to work, you get a clean summary of your settings. This is your final quality check.
                </p>

                <div className="not-prose my-6 bg-white border border-slate-200 rounded-3xl p-5 pt-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Review & Generate</h3>
                            <p className="text-slate-500 font-medium text-sm">Review your settings before generating</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* Series Basics */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                                <Video className="size-6" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Series Basics</div>
                                <div className="font-bold text-slate-900 text-lg">"The Lost City"</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md flex items-center gap-1">
                                        <Smartphone className="size-3" /> Portrait (9:16)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Content Strategy */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <TrendingUp className="size-4" />
                                    </div>
                                    <span className="font-bold text-slate-900">Strategy</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm"><span className="text-slate-500">Topic:</span> <span className="font-medium text-slate-900">Ancient Atlantis</span></div>
                                    <div className="text-sm"><span className="text-slate-500">Style:</span> <span className="font-medium text-slate-900">Realism</span></div>
                                    <div className="text-sm"><span className="text-slate-500">Duration:</span> <span className="font-medium text-slate-900">1 min</span></div>
                                </div>
                            </div>

                            {/* Audio */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                        <Mic className="size-4" />
                                    </div>
                                    <span className="font-bold text-slate-900">Audio</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm"><span className="text-slate-500">Voice:</span> <span className="font-medium text-slate-900">Marcus (Man)</span></div>
                                    <div className="text-sm"><span className="text-slate-500">Music:</span> <span className="font-medium text-slate-900">Mystery Track 1</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <button className="w-full md:w-auto md:min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto md:mx-0">
                            <Sparkles className="size-5" /> Generate Video
                        </button>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6">Why Creators Are Switching to Auto Mode</h3>

                <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <BenefitBox
                        title="Speed"
                        description="Go from 'I have an idea' to 'Published' in under 5 minutes."
                        icon={<Zap className="size-6 text-amber-500" />}
                    />
                    <BenefitBox
                        title="Cost"
                        description="No need to hire editors, scriptwriters, or voice actors."
                        icon={<DollarSignIcon />}
                    />
                    <BenefitBox
                        title="Scale"
                        description="Run multiple channels effortlessly. Produce 10x content."
                        icon={<TrendingUp className="size-6 text-green-500" />}
                    />
                </div>
            </div>

            {/* Final CTA */}
            <div className="mt-12 text-center bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl px-6 py-8 pt-6 md:px-10 md:pt-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <h3 className="text-3xl md:text-4xl font-bold">Ready to Go Viral?</h3>
                    <p className="text-purple-100 text-lg">
                        Stop letting editing slow down your growth. Join thousands of creators who are automating their way to the top of the feed.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Button size="lg" className="h-14 px-8 text-lg bg-white hover:bg-purple-50 text-purple-900 transition-all w-full sm:w-auto font-bold rounded-full whitespace-nowrap" asChild>
                            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                                Try ViralReel Free <ArrowRight className="size-5" />
                            </Link>
                        </Button>
                    </div>
                    <p className="text-sm text-purple-300/80">
                        No credit card required for your first video
                    </p>
                </div>
            </div>
        </article>
    );
}

// --- Helper Components ---

function SectionHeader({ step, icon, title }: { step: number; icon: React.ReactNode; title: string }) {
    return (
        <h2 className="flex items-start gap-3 text-2xl md:text-3xl font-bold text-slate-900 mt-16 mb-8 group">
            <span className="flex items-center justify-center size-10 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300 shrink-0">
                {icon}
            </span>
            <span className="flex-1">
                <span className="text-purple-600 text-lg block font-semibold mb-1">Step {step}</span>
                {title}
            </span>
        </h2>
    );
}

function VoiceItem({ name, details, selected }: { name: string; details: string; selected: boolean }) {
    return (
        <div className={`p-4 flex items-center gap-4 ${selected ? 'bg-purple-50' : 'bg-white hover:bg-slate-50'} transition-colors cursor-pointer`}>
            <div className={`size-10 rounded-full flex items-center justify-center ${selected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Play className="size-4 fill-current" />
            </div>
            <div className="flex-1">
                <div className="font-bold text-slate-900">{name}</div>
                <div className="text-xs text-slate-500">{details}</div>
            </div>
            {selected && (
                <div className="px-3 py-1 bg-purple-200 text-purple-700 text-xs font-bold rounded-full">Selected</div>
            )}
        </div>
    );
}

function MusicItem({ name, duration, selected }: { name: string; duration: string; selected: boolean }) {
    return (
        <div className={`p-4 flex items-center gap-4 ${selected ? 'bg-purple-50' : 'bg-white hover:bg-slate-50'} transition-colors cursor-pointer`}>
            <div className={`size-8 rounded-full flex items-center justify-center ${selected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Music className="size-4" />
            </div>
            <div className="flex-1">
                <div className="font-bold text-slate-900">{name}</div>
                <div className="text-xs text-slate-500">Default Library • {duration}</div>
            </div>
            {selected && (
                <CheckCircle2 className="size-5 text-purple-600" />
            )}
        </div>
    );
}

function SubtitleCard({ name, style, preview }: { name: string; style: string; preview: string }) {
    return (
        <div className="border border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-300 hover:shadow-md transition-all">
            <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,64,60,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                <span className={style}>{preview}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{name}</div>
        </div>
    );
}

function BenefitBox({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="mb-4">{icon}</div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">{title}</h4>
            <p className="text-slate-600 text-sm">{description}</p>
        </div>
    );
}

function TargetIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}

function DollarSignIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-green-600">
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}
