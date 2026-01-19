import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    DollarSign,
    Eye,
    EyeOff,
    Film,
    Lightbulb,
    Mic,
    Monitor,
    Play,
    Rocket,
    Scale,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Video,
    Zap,
    ChevronRight,
    Clock,
    BarChart3,
    Globe,
    Shield,
    Layers,
    Type,
    Wand2,
} from "lucide-react";
import Link from "next/link";

export default function FacelessContentPost() {
    return (
        <article className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Article Header */}
            <header className="text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
                    <BookOpen className="size-3.5" />
                    <span>Complete Guide</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                    What is Faceless Content? <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                        The Complete Guide for 2025
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Build a content empire without ever showing your face. Learn how creators are earning 6-7 figures anonymously.
                </p>

                {/* Reading time & stats */}
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 pt-4">
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        15 min read
                    </span>
                    <span className="flex items-center gap-1.5">
                        <BarChart3 className="size-4" />
                        3,400+ words
                    </span>
                </div>
            </header>

            {/* Table of Contents */}
            <TableOfContents />

            {/* Main Content */}
            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">

                {/* Introduction */}
                <p className="lead text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
                    What if you could build a thriving content business, amass millions of followers, and generate substantial income - all without ever showing your face on camera?
                </p>

                <p>
                    This isn't a hypothetical scenario. It's the reality for thousands of creators who have discovered the power of <strong className="text-purple-600">faceless content</strong>. In 2025, faceless content creation has evolved from a niche strategy to a mainstream movement, powered by AI tools that make professional video production accessible to everyone.
                </p>

                <p>
                    In this comprehensive guide, you'll learn exactly what faceless content is, why it's exploding in popularity, and how you can leverage this approach to build your own successful content channel - no camera required.
                </p>

                {/* Section 1: What is Faceless Content */}
                <SectionHeader
                    id="what-is-faceless-content"
                    icon={<EyeOff className="size-6" />}
                    title="What is Faceless Content?"
                />

                <p>
                    <strong>Faceless content</strong> refers to videos, social media posts, and digital content created without showing the creator's face or revealing their identity. The creator remains completely anonymous while building an audience, growing a following, and monetizing their content.
                </p>

                <p>
                    Think about some of the most popular YouTube channels you've watched. Channels covering true crime mysteries, historical documentaries, motivational compilations, or tech explainers - many of these are run by creators who never appear on screen. Instead, they use a combination of:
                </p>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ContentTypeCard
                            icon={<Mic className="size-5 text-purple-600" />}
                            title="Voiceover Narration"
                            description="Professional narration over stock footage or custom visuals"
                        />
                        <ContentTypeCard
                            icon={<Film className="size-5 text-blue-600" />}
                            title="Stock Footage"
                            description="Curated video clips that illustrate the story being told"
                        />
                        <ContentTypeCard
                            icon={<Wand2 className="size-5 text-green-600" />}
                            title="AI-Generated Visuals"
                            description="Custom imagery created by AI to match your script"
                        />
                        <ContentTypeCard
                            icon={<Type className="size-5 text-amber-600" />}
                            title="Text & Captions"
                            description="On-screen text that drives the narrative forward"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Where Faceless Content Thrives</h3>

                <p>
                    Faceless content performs exceptionally well across all major platforms:
                </p>

                <ul>
                    <li><strong>YouTube</strong> - Both long-form videos and YouTube Shorts</li>
                    <li><strong>TikTok</strong> - Perfect for viral short-form content</li>
                    <li><strong>Instagram Reels</strong> - Growing rapidly for educational content</li>
                    <li><strong>Facebook Reels</strong> - Massive reach for older demographics</li>
                </ul>

                <p>
                    The beauty of faceless content is its versatility. Whether you're passionate about history, finance, true crime, or kids' education, there's a faceless format that works for your niche.
                </p>

                {/* Section 2: Why Faceless Content is Exploding */}
                <SectionHeader
                    id="why-faceless-content-exploding"
                    icon={<TrendingUp className="size-6" />}
                    title="Why Faceless Content is Exploding in 2025"
                />

                <p>
                    Faceless content isn't just a trend - it's a fundamental shift in how people approach content creation. Here's why it's experiencing explosive growth:
                </p>

                <h3 className="text-xl font-bold text-slate-900">The Rise of the Anonymous Creator Economy</h3>

                <p>
                    The creator economy has matured significantly. While early YouTube success stories required putting yourself out there, today's platforms are algorithm-driven. The algorithm doesn't care if you show your face - it cares about watch time, engagement, and retention.
                </p>

                <p>
                    This shift has enabled a new class of creators who build massive audiences without personal branding. Some key statistics:
                </p>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard number="40%+" label="of top channels in many niches are faceless" />
                        <StatCard number="2.7B+" label="monthly active YouTube users" />
                        <StatCard number="135%" label="increase in short-form video since 2020" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">AI Tools Have Leveled the Playing Field</h3>

                <p>
                    Perhaps the biggest driver of faceless content growth is the AI revolution. Tools like <strong className="text-purple-600">ViralReel</strong> now automate what used to require expensive equipment, editing skills, and hours of work:
                </p>

                <ul>
                    <li><strong>AI Script Writing</strong> - Generate compelling narratives in seconds</li>
                    <li><strong>AI Voiceovers</strong> - Professional-quality voices in dozens of languages</li>
                    <li><strong>AI Visual Generation</strong> - Custom imagery that matches your content</li>
                    <li><strong>Automated Editing</strong> - Professional pacing and transitions</li>
                    <li><strong>Auto-Captions</strong> - Perfectly synced subtitles</li>
                </ul>

                <p>
                    What used to take a full production team can now be accomplished by one person in under 5 minutes.
                </p>

                <h3 className="text-xl font-bold text-slate-900">The Privacy-First Generation</h3>

                <p>
                    Gen Z and Millennials are increasingly privacy-conscious. Many talented potential creators avoid content creation specifically because they don't want their face permanently on the internet. Faceless content removes this barrier entirely.
                </p>

                <p>
                    Additional factors driving this trend include:
                </p>

                <ul>
                    <li>Protection from online harassment and doxxing</li>
                    <li>Ability to maintain separate professional identities</li>
                    <li>Freedom to create controversial or niche content without personal association</li>
                    <li>No anxiety about appearance, lighting, or being "camera-ready"</li>
                </ul>

                {/* Section 3: Types of Faceless Content */}
                <SectionHeader
                    id="types-of-faceless-content"
                    icon={<Layers className="size-6" />}
                    title="7 Types of Faceless Content You Can Create"
                />

                <p>
                    Not all faceless content is created equal. Each type has its own strengths, best-use cases, and production requirements. Here are the seven main categories:
                </p>

                <div className="not-prose my-10 space-y-6">
                    <ContentTypeDetail
                        number={1}
                        title="Voiceover + Stock Footage"
                        description="The most popular faceless format. You write a script, record (or use AI) voiceover, and layer it over relevant stock footage. This format feels professional and works for virtually any niche."
                        bestFor="True crime, documentaries, educational content, history"
                        difficulty="Beginner-friendly"
                        color="purple"
                    />
                    <ContentTypeDetail
                        number={2}
                        title="AI-Generated Visuals"
                        description="Use AI image and video generators to create unique, custom visuals that perfectly match your narrative. This cutting-edge approach creates content that stands out from stock footage channels."
                        bestFor="Storytelling, fantasy, sci-fi, unique aesthetic niches"
                        difficulty="Intermediate"
                        color="blue"
                    />
                    <ContentTypeDetail
                        number={3}
                        title="Screen Recording & Tutorials"
                        description="Perfect for tech content. Record your screen while explaining software, websites, or digital processes. Your voice guides viewers through the content without needing to be on camera."
                        bestFor="Tech tutorials, software reviews, productivity tips"
                        difficulty="Beginner-friendly"
                        color="green"
                    />
                    <ContentTypeDetail
                        number={4}
                        title="Text-Based Caption Videos"
                        description="Rapid-fire text on screen, often with background music or ambient sound. These are incredibly quick to produce and perform well on TikTok and Reels."
                        bestFor="Facts, quotes, listicles, quick tips"
                        difficulty="Very easy"
                        color="amber"
                    />
                    <ContentTypeDetail
                        number={5}
                        title="Animation & Motion Graphics"
                        description="Animated characters, explainers, or motion graphics. Higher production value but more time-intensive. Great for kids' content and complex explanations."
                        bestFor="Kids content, educational, explainers"
                        difficulty="Advanced"
                        color="pink"
                    />
                    <ContentTypeDetail
                        number={6}
                        title="Compilation Videos"
                        description="Curate and compile existing content (with proper licensing) around a theme. Add value through curation, commentary, or ranking."
                        bestFor="Gaming, sports, fails, satisfying videos"
                        difficulty="Beginner-friendly"
                        color="indigo"
                    />
                    <ContentTypeDetail
                        number={7}
                        title="Documentary Style"
                        description="Long-form investigative or narrative content that dives deep into topics. Combines multiple footage sources with detailed scripting and professional narration."
                        bestFor="True crime, history, biographies, mysteries"
                        difficulty="Intermediate to Advanced"
                        color="slate"
                    />
                </div>

                {/* Section 4: Profitable Niches */}
                <SectionHeader
                    id="profitable-niches"
                    icon={<DollarSign className="size-6" />}
                    title="10 Most Profitable Faceless YouTube Niches in 2025"
                />

                <p>
                    Choosing the right niche is crucial for faceless content success. Here are the ten most profitable niches, with estimated CPM (cost per thousand views) and earnings potential:
                </p>

                <div className="not-prose my-10">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">Niche</th>
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">CPM Range</th>
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">Competition</th>
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <NicheRow niche="Finance & Investing" cpm="$15-50" competition="High" difficulty="Medium" />
                                <NicheRow niche="True Crime & Mysteries" cpm="$8-15" competition="High" difficulty="Medium" />
                                <NicheRow niche="History & Documentary" cpm="$6-12" competition="Medium" difficulty="Medium" />
                                <NicheRow niche="Technology Explainers" cpm="$8-20" competition="Medium" difficulty="Low" />
                                <NicheRow niche="Health & Wellness" cpm="$10-25" competition="High" difficulty="High" />
                                <NicheRow niche="Motivation & Self-Help" cpm="$5-10" competition="Very High" difficulty="Low" />
                                <NicheRow niche="Scary Stories & Horror" cpm="$4-8" competition="Medium" difficulty="Low" />
                                <NicheRow niche="Science & Facts" cpm="$6-12" competition="Medium" difficulty="Medium" />
                                <NicheRow niche="Kids Educational" cpm="$3-8" competition="Medium" difficulty="Medium" />
                                <NicheRow niche="Gaming Highlights" cpm="$2-6" competition="Very High" difficulty="Low" />
                            </tbody>
                        </table>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Earnings Potential Breakdown</h3>

                <p>
                    Let's put these numbers in perspective. Here's what you could potentially earn with 100,000 monthly views in each niche:
                </p>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EarningsCard niche="Finance" range="$1,500 - $5,000/month" />
                        <EarningsCard niche="True Crime" range="$800 - $1,500/month" />
                        <EarningsCard niche="History" range="$600 - $1,200/month" />
                        <EarningsCard niche="Motivation" range="$500 - $1,000/month" />
                    </div>
                </div>

                <p>
                    Keep in mind that ad revenue is just one income stream. Successful faceless channels also monetize through sponsorships, affiliate marketing, digital products, and more.
                </p>

                {/* Section 5: How to Create */}
                <SectionHeader
                    id="how-to-create"
                    icon={<Rocket className="size-6" />}
                    title="How to Create Faceless Content: Step-by-Step Guide"
                />

                <p>
                    Ready to start your faceless content journey? Here's your complete roadmap from idea to published video:
                </p>

                <h3 className="text-xl font-bold text-slate-900">Step 1: Choose Your Niche</h3>

                <p>
                    Before creating a single video, you need to nail your niche selection. Consider these factors:
                </p>

                <ul>
                    <li><strong>Passion vs. Profit</strong> - Can you create 100+ videos about this topic? Balance interest with earning potential.</li>
                    <li><strong>Competition Analysis</strong> - Study existing faceless channels. What gaps can you fill?</li>
                    <li><strong>Content Supply</strong> - Is there enough source material, angles, and stories for long-term content?</li>
                    <li><strong>Demand Validation</strong> - Use tools like VidIQ or TubeBuddy to verify search volume.</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Step 2: Plan Your Content Strategy</h3>

                <p>
                    Consistency beats perfection. Plan a sustainable content calendar:
                </p>

                <ul>
                    <li><strong>Content Pillars</strong> - Define 3-5 core topics within your niche</li>
                    <li><strong>Posting Frequency</strong> - Start with 2-3 videos per week (more for Shorts)</li>
                    <li><strong>Platform Focus</strong> - Master one platform before expanding</li>
                    <li><strong>Content Mix</strong> - Balance evergreen content with trending topics</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Step 3: Create Your First Video (The Traditional Way)</h3>

                <p>
                    The manual approach involves several steps:
                </p>

                <ol>
                    <li><strong>Script Writing</strong> - Research your topic and write a compelling narrative</li>
                    <li><strong>Visual Sourcing</strong> - Find stock footage from Pexels, Pixabay, or Storyblocks</li>
                    <li><strong>Voiceover</strong> - Record yourself or use AI voices like ElevenLabs</li>
                    <li><strong>Editing</strong> - Sync audio, visuals, and captions in Premiere Pro or DaVinci</li>
                    <li><strong>Export & Upload</strong> - Optimize settings for your platform</li>
                </ol>

                <p>
                    This process typically takes 4-8 hours per video for beginners.
                </p>

                <h3 className="text-xl font-bold text-slate-900">Step 4: The Easy Way - Use ViralReel</h3>

                <p>
                    Or you could do what thousands of successful faceless creators do: use AI to automate the entire process.
                </p>
            </div>

            {/* ViralReel CTA Box */}
            <div className="my-12 p-8 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl md:p-10 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                            <Sparkles className="size-6 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 m-0">Create Faceless Videos in 5 Minutes with ViralReel</h3>
                    </div>
                    <p className="text-lg text-slate-600 mb-6">
                        ViralReel automates every step of the faceless content creation process. Simply describe your video idea, and our AI handles the script, visuals, voiceover, captions, and editing - then auto-posts to your channels.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <FeatureCheck text="AI Script Generation" />
                        <FeatureCheck text="Hyper-Realistic AI Voices" />
                        <FeatureCheck text="AI-Generated Visuals" />
                        <FeatureCheck text="Automated Captions" />
                        <FeatureCheck text="Professional Editing" />
                        <FeatureCheck text="Auto-Post to YouTube" />
                    </div>
                    <Button size="lg" className="h-14 px-8 text-lg bg-purple-600 hover:bg-purple-700 text-white transition-all font-semibold rounded-full" asChild>
                        <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                            Start Creating Free <ArrowRight className="size-5" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">
                <h3 className="text-xl font-bold text-slate-900">Step 5: Optimize and Publish</h3>

                <p>
                    Creating the video is only half the battle. Optimization is crucial for discoverability:
                </p>

                <ul>
                    <li><strong>Titles</strong> - Use power words and include your main keyword</li>
                    <li><strong>Descriptions</strong> - Write detailed descriptions with relevant keywords</li>
                    <li><strong>Tags</strong> - Include a mix of broad and specific tags</li>
                    <li><strong>Thumbnails</strong> - For faceless channels, focus on bold text and intriguing imagery</li>
                    <li><strong>Posting Time</strong> - Schedule for when your audience is most active</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Step 6: Scale Your Channel</h3>

                <p>
                    Once you've found a content formula that works, it's time to scale:
                </p>

                <ul>
                    <li><strong>Batch Creation</strong> - Create multiple videos in one session</li>
                    <li><strong>Content Systems</strong> - Build templates and workflows</li>
                    <li><strong>Automation</strong> - Use ViralReel's auto-posting to maintain consistency</li>
                    <li><strong>Multiple Channels</strong> - One of the biggest faceless content advantages - you can run several channels simultaneously</li>
                </ul>

                {/* Section 6: Pros and Cons */}
                <SectionHeader
                    id="pros-and-cons"
                    icon={<Scale className="size-6" />}
                    title="Pros and Cons of Faceless Content Creation"
                />

                <p>
                    Is faceless content right for you? Let's break down the advantages and challenges honestly:
                </p>

                <div className="not-prose my-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="size-5" />
                            Advantages
                        </h4>
                        <ul className="space-y-3">
                            <ProConItem type="pro" text="Complete privacy and anonymity" />
                            <ProConItem type="pro" text="No camera shyness or appearance anxiety" />
                            <ProConItem type="pro" text="Easier to scale and outsource production" />
                            <ProConItem type="pro" text="Can pivot niches without personal brand damage" />
                            <ProConItem type="pro" text="Lower equipment and setup requirements" />
                            <ProConItem type="pro" text="Work from anywhere - no studio needed" />
                            <ProConItem type="pro" text="Can operate multiple channels simultaneously" />
                            <ProConItem type="pro" text="Content focus over personality marketing" />
                        </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                            <Eye className="size-5" />
                            Challenges
                        </h4>
                        <ul className="space-y-3">
                            <ProConItem type="con" text="Less personal connection with audience" />
                            <ProConItem type="con" text="Harder to build parasocial relationships" />
                            <ProConItem type="con" text="Some niches have high competition" />
                            <ProConItem type="con" text="Requires strong scripting and storytelling skills" />
                            <ProConItem type="con" text="May need investment in tools or stock footage" />
                            <ProConItem type="con" text="Limited sponsorship opportunities (some brands want faces)" />
                        </ul>
                    </div>
                </div>

                {/* Section 7: Tools */}
                <SectionHeader
                    id="tools"
                    icon={<Zap className="size-6" />}
                    title="Best Tools for Creating Faceless Videos in 2025"
                />

                <p>
                    The right tools can dramatically reduce your production time and improve quality. Here's your essential toolkit:
                </p>

                <h3 className="text-xl font-bold text-slate-900">All-in-One AI Video Creation</h3>

                <div className="not-prose my-6">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl shrink-0">
                                <Sparkles className="size-8 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">ViralReel - The #1 Choice for Faceless Creators</h4>
                                <p className="text-slate-600 mb-4">
                                    ViralReel is specifically designed for faceless content creation. It combines AI script writing, visual generation, voiceovers, editing, and auto-posting in one platform. Go from idea to published video in under 5 minutes.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">AI Scripts</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">AI Visuals</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">AI Voices</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Auto-Captions</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Auto-Post</span>
                                </div>
                                <p className="text-sm text-slate-500">Starting at $14.99 for 10 videos (no subscription required)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Other Useful Tools</h3>

                <div className="not-prose my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToolCard
                        category="Stock Footage"
                        tools={["Pexels (Free)", "Pixabay (Free)", "Storyblocks (Paid)", "Envato Elements (Paid)"]}
                    />
                    <ToolCard
                        category="AI Voiceover"
                        tools={["ElevenLabs", "Murf AI", "Play.ht", "ViralReel (Built-in)"]}
                    />
                    <ToolCard
                        category="Editing Software"
                        tools={["Premiere Pro", "DaVinci Resolve (Free)", "CapCut", "Final Cut Pro"]}
                    />
                    <ToolCard
                        category="Research & Analytics"
                        tools={["VidIQ", "TubeBuddy", "SocialBlade", "Google Trends"]}
                    />
                </div>

                {/* Section 8: Success Stories */}
                <SectionHeader
                    id="success-stories"
                    icon={<Users className="size-6" />}
                    title="Faceless Content Success Stories"
                />

                <p>
                    Still skeptical? Here are real examples of faceless content success (channel names withheld for privacy):
                </p>

                <div className="not-prose my-8 space-y-4">
                    <SuccessStory
                        niche="History Channel"
                        achievement="$10,000+/month"
                        story="Started creating historical documentary content in 2022 using stock footage and AI voiceover. Now has over 500,000 subscribers and earns consistently from AdSense alone."
                        timeline="18 months to full-time income"
                    />
                    <SuccessStory
                        niche="Finance Education"
                        achievement="$25,000+/month"
                        story="Built a faceless finance channel explaining complex topics in simple terms. Combines ad revenue with affiliate marketing for financial products."
                        timeline="12 months to quit day job"
                    />
                    <SuccessStory
                        niche="True Crime"
                        achievement="2M+ subscribers"
                        story="Creates in-depth true crime documentaries using public records, news clips, and narration. Has never shown their face or revealed their identity."
                        timeline="3 years to 2 million subscribers"
                    />
                </div>

                <h3 className="text-xl font-bold text-slate-900">Common Patterns in Successful Faceless Channels</h3>

                <ul>
                    <li><strong>Consistency</strong> - They post regularly, often 3-5 times per week</li>
                    <li><strong>Quality over shortcuts</strong> - They invest in good audio and visuals</li>
                    <li><strong>Niche expertise</strong> - They become the go-to source for their topic</li>
                    <li><strong>Strong hooks</strong> - They master the art of grabbing attention in the first 3 seconds</li>
                    <li><strong>Audience engagement</strong> - They respond to comments and build community</li>
                </ul>

                {/* FAQ Section */}
                <SectionHeader
                    id="faq"
                    icon={<Lightbulb className="size-6" />}
                    title="Frequently Asked Questions"
                />

                <div className="not-prose my-8 space-y-4">
                    <FAQItem
                        question="Is faceless content allowed on YouTube?"
                        answer="Absolutely. Faceless content is completely allowed on YouTube as long as it follows community guidelines. Many of the platform's most successful channels never show their creators. YouTube's algorithm evaluates content based on engagement metrics, not whether a face appears on screen."
                    />
                    <FAQItem
                        question="Can you make money with faceless YouTube channels?"
                        answer="Yes, faceless channels can be extremely profitable. Many faceless creators earn $5,000-$50,000+ per month through ad revenue alone. Additional income streams include sponsorships, affiliate marketing, and digital products. Finance and business niches tend to have the highest CPMs."
                    />
                    <FAQItem
                        question="What equipment do I need to start?"
                        answer="Minimal equipment is needed. With tools like ViralReel, you don't need a camera, lighting, or even a microphone. You just need a computer and internet connection. If recording your own voiceover, a basic USB microphone ($50-100) significantly improves quality."
                    />
                    <FAQItem
                        question="How long does it take to make a faceless video?"
                        answer="Traditionally, a quality faceless video takes 4-8 hours to produce. With AI tools like ViralReel, this drops to under 5 minutes. The platform handles script writing, visual selection, voiceover, editing, and captions automatically."
                    />
                    <FAQItem
                        question="Which niche should I choose for faceless content?"
                        answer="Choose a niche that balances your interest with profitability. High-CPM niches like finance and health require more expertise, while entertainment niches are easier to enter but more competitive. Start with something you can create 100+ videos about without burning out."
                    />
                </div>

                {/* Conclusion */}
                <SectionHeader
                    id="conclusion"
                    icon={<Target className="size-6" />}
                    title="Is Faceless Content Right for You?"
                />

                <p>
                    Faceless content creation represents one of the biggest opportunities in the digital economy. It combines the explosive growth of short-form video with the scalability of anonymous production and the power of AI automation.
                </p>

                <p>
                    Whether you're camera-shy, privacy-conscious, or simply want to build a content business that doesn't depend on your personal brand, faceless content offers a proven path to success.
                </p>

                <p>
                    The barrier to entry has never been lower. With tools like ViralReel, anyone can go from zero to published faceless video in under 5 minutes. The only question is: will you start today?
                </p>
            </div>

            {/* Final CTA */}
            <div className="mt-20 text-center bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-slate-900 z-0"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h3 className="text-3xl md:text-4xl font-bold">Ready to Create Your First Faceless Video?</h3>
                    <p className="text-slate-300 text-lg">
                        Join thousands of creators building successful faceless channels with ViralReel. No camera, no editing skills, no excuses.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 hover:text-purple-600 transition-all w-full sm:w-auto font-semibold rounded-full whitespace-nowrap" asChild>
                            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                                Start Creating Free <ArrowRight className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

// Component: Table of Contents
function TableOfContents() {
    const sections = [
        { id: "what-is-faceless-content", title: "What is Faceless Content?" },
        { id: "why-faceless-content-exploding", title: "Why It's Exploding in 2025" },
        { id: "types-of-faceless-content", title: "7 Types of Faceless Content" },
        { id: "profitable-niches", title: "Most Profitable Niches" },
        { id: "how-to-create", title: "How to Create (Step-by-Step)" },
        { id: "pros-and-cons", title: "Pros and Cons" },
        { id: "tools", title: "Best Tools for 2025" },
        { id: "success-stories", title: "Success Stories" },
        { id: "faq", title: "FAQ" },
        { id: "conclusion", title: "Conclusion" },
    ];

    return (
        <div className="my-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-purple-600" />
                Table of Contents
            </h2>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-start gap-2 text-slate-600 hover:text-purple-600 transition-colors py-1"
                    >
                        <span className="text-xs font-medium text-slate-400 w-5 shrink-0 pt-0.5">{index + 1}.</span>
                        <span className="text-sm">{section.title}</span>
                    </a>
                ))}
            </nav>
        </div>
    );
}

// Component: Section Header
function SectionHeader({ id, icon, title }: { id: string; icon: React.ReactNode; title: string }) {
    return (
        <h2 id={id} className="flex items-start gap-3 text-3xl font-bold text-slate-900 mt-16 mb-8 group scroll-mt-24">
            <span className="flex items-center justify-center size-10 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300 shrink-0">
                {icon}
            </span>
            {title}
        </h2>
    );
}

// Component: Content Type Card
function ContentTypeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                <p className="text-slate-600 text-sm">{description}</p>
            </div>
        </div>
    );
}

// Component: Stat Card
function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">{number}</div>
            <div className="text-sm text-slate-600 mt-1">{label}</div>
        </div>
    );
}

// Component: Content Type Detail
function ContentTypeDetail({
    number,
    title,
    description,
    bestFor,
    difficulty,
    color
}: {
    number: number;
    title: string;
    description: string;
    bestFor: string;
    difficulty: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        purple: "border-l-purple-500 bg-purple-50/30",
        blue: "border-l-blue-500 bg-blue-50/30",
        green: "border-l-green-500 bg-green-50/30",
        amber: "border-l-amber-500 bg-amber-50/30",
        pink: "border-l-pink-500 bg-pink-50/30",
        indigo: "border-l-indigo-500 bg-indigo-50/30",
        slate: "border-l-slate-500 bg-slate-50/30",
    };

    return (
        <div className={`border-l-4 ${colorClasses[color]} p-5 rounded-r-xl`}>
            <div className="flex items-start gap-3 mb-2">
                <span className="flex items-center justify-center size-8 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 shrink-0">{number}</span>
                <h4 className="text-lg font-bold text-slate-900">{title}</h4>
            </div>
            <p className="text-slate-600 mb-3">{description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-slate-500"><strong>Best for:</strong> {bestFor}</span>
                <span className="text-slate-500"><strong>Difficulty:</strong> {difficulty}</span>
            </div>
        </div>
    );
}

// Component: Niche Row
function NicheRow({ niche, cpm, competition, difficulty }: { niche: string; cpm: string; competition: string; difficulty: string }) {
    const getDifficultyColor = (d: string) => {
        switch (d) {
            case "Low": return "text-green-600 bg-green-50";
            case "Medium": return "text-amber-600 bg-amber-50";
            case "High": return "text-red-600 bg-red-50";
            default: return "text-slate-600 bg-slate-50";
        }
    };

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="p-4 font-medium text-slate-900">{niche}</td>
            <td className="p-4 text-green-600 font-semibold">{cpm}</td>
            <td className="p-4 text-slate-600">{competition}</td>
            <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                    {difficulty}
                </span>
            </td>
        </tr>
    );
}

// Component: Earnings Card
function EarningsCard({ niche, range }: { niche: string; range: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
            <span className="font-medium text-slate-900">{niche}</span>
            <span className="font-bold text-green-600">{range}</span>
        </div>
    );
}

// Component: Feature Check
function FeatureCheck({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
            <span className="text-slate-700 text-sm">{text}</span>
        </div>
    );
}

// Component: Pro/Con Item
function ProConItem({ type, text }: { type: "pro" | "con"; text: string }) {
    return (
        <li className="flex items-start gap-2">
            {type === "pro" ? (
                <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
            ) : (
                <div className="size-4 rounded-full border-2 border-red-400 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${type === "pro" ? "text-green-800" : "text-red-800"}`}>{text}</span>
        </li>
    );
}

// Component: Tool Card
function ToolCard({ category, tools }: { category: string; tools: string[] }) {
    return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 text-sm mb-2">{category}</h4>
            <ul className="space-y-1">
                {tools.map((tool, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-1">
                        <ChevronRight className="size-3 text-slate-400 shrink-0 mt-1" />
                        {tool}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Component: Success Story
function SuccessStory({ niche, achievement, story, timeline }: { niche: string; achievement: string; story: string; timeline: string }) {
    return (
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{niche}</span>
                <span className="text-lg font-bold text-green-600">{achievement}</span>
            </div>
            <p className="text-slate-700 mb-2">{story}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="size-3" />
                {timeline}
            </p>
        </div>
    );
}

// Component: FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-2">{question}</h4>
            <p className="text-slate-600 text-sm">{answer}</p>
        </div>
    );
}
