import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    DollarSign,
    Eye,
    Target,
    Lightbulb,
    Play,
    Rocket,
    Settings,
    Sparkles,
    TrendingUp,
    Users,
    Video,
    Zap,
    ChevronRight,
    Clock,
    BarChart3,
    Youtube,
    Calendar,
    FileText,
    Layers,
    Search,
    Upload,
    LayoutGrid,
    Timer,
    Shield,
    Mic,
    Monitor,
    CircleDollarSign,
    CheckSquare,
    ListChecks,
    BadgeCheck,
} from "lucide-react";
import Link from "next/link";

export default function HowToStartFacelessChannelPost() {
    return (
        <article className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Article Header */}
            <header className="text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100/50 border border-green-200 text-green-700 text-sm font-medium mb-4">
                    <Rocket className="size-3.5" />
                    <span>Step-by-Step Tutorial</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                    How to Start a Faceless YouTube Channel in 2025{" "}
                    <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                        (Step-by-Step Guide)
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    No camera. No editing skills. No excuses. Learn exactly how to launch, grow, and monetize a faceless YouTube channel from scratch.
                </p>

                {/* Reading time & stats */}
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 pt-4">
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        12 min read
                    </span>
                    <span className="flex items-center gap-1.5">
                        <BarChart3 className="size-4" />
                        2,500+ words
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ListChecks className="size-4" />
                        7 Steps
                    </span>
                </div>
            </header>

            {/* Quick Summary Box */}
            <QuickSummaryBox />

            {/* Table of Contents */}
            <TableOfContents />

            {/* Main Content */}
            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">

                {/* Introduction */}
                <p className="lead text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
                    In 2025, you don't need to show your face to build a successful YouTube channel - and thousands of creators are proving it every day. They're earning $5,000 to $50,000+ monthly while remaining completely anonymous.
                </p>

                <p>
                    If you've ever wanted to start a YouTube channel but felt held back by camera shyness, privacy concerns, or simply not wanting to be "internet famous," <strong className="text-green-600">faceless content</strong> is your answer. And with AI tools making professional video creation accessible to everyone, there's never been a better time to start.
                </p>

                <p>
                    In this complete guide, you'll learn exactly <strong>how to start a faceless YouTube channel</strong> from scratch - including niche selection, channel setup, content creation, optimization, and scaling to monetization. Whether you choose the manual route or use AI tools like ViralReel, you'll have a clear roadmap to success.
                </p>

                <p>
                    Let's dive into the 7 steps that will take you from zero to a thriving faceless channel.
                </p>

                {/* Link to Hub Article */}
                <div className="not-prose my-8">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <BookOpen className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-blue-800">
                                <strong>New to faceless content?</strong> First read our comprehensive guide:{" "}
                                <Link href="/blog/what-is-faceless-content" className="underline hover:text-blue-600">
                                    What is Faceless Content? The Complete Guide for 2025
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Why Start */}
                <SectionHeader
                    id="why-start"
                    step={0}
                    icon={<Lightbulb className="size-6" />}
                    title="Why Start a Faceless YouTube Channel in 2025?"
                />

                <p>
                    Before diving into the how, let's address the why. Understanding the benefits will keep you motivated throughout your journey.
                </p>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BenefitCard
                            icon={<Shield className="size-5 text-green-600" />}
                            title="Complete Privacy"
                            description="Build an audience without revealing your identity or appearing on camera"
                        />
                        <BenefitCard
                            icon={<Zap className="size-5 text-amber-600" />}
                            title="Lower Barrier to Entry"
                            description="No camera, lighting, or appearance prep needed - just ideas"
                        />
                        <BenefitCard
                            icon={<Layers className="size-5 text-blue-600" />}
                            title="Easy to Scale"
                            description="Automate production and run multiple channels simultaneously"
                        />
                        <BenefitCard
                            icon={<Target className="size-5 text-purple-600" />}
                            title="Content-Focused"
                            description="Success depends on your ideas, not your personality or looks"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">The Numbers Don't Lie</h3>

                <p>
                    Faceless channels are dominating across YouTube. Here's what the data shows:
                </p>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard number="40%+" label="of top channels in many niches are faceless" />
                        <StatCard number="3-6mo" label="average time to reach monetization" />
                        <StatCard number="$15-50" label="CPM for finance faceless channels" />
                    </div>
                </div>

                <p>
                    Now that you understand the opportunity, let's get into the action steps.
                </p>

                {/* Step 1: Choose Niche */}
                <SectionHeader
                    id="step-1-niche"
                    step={1}
                    icon={<Search className="size-6" />}
                    title="Choose Your Profitable Niche"
                />

                <p>
                    Your niche determines everything - your content, audience, competition, and income potential. Choose wisely using the <strong>PASS Framework</strong>:
                </p>

                <div className="not-prose my-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Target className="size-5 text-green-600" />
                            The PASS Framework for Niche Selection
                        </h4>
                        <div className="space-y-3">
                            <PassItem letter="P" word="Passion" description="Can you create 100+ videos about this topic without burning out?" />
                            <PassItem letter="A" word="Audience" description="Is there proven demand? Check existing channels and search volume." />
                            <PassItem letter="S" word="Supply" description="Is there enough content material, stories, or angles to cover?" />
                            <PassItem letter="S" word="Sustainability" description="Will this niche still be relevant in 5 years?" />
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Top Faceless Niches by CPM</h3>

                <div className="not-prose my-8">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">Niche</th>
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">CPM Range</th>
                                    <th className="text-left p-4 font-bold text-slate-900 border-b">Entry Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <NicheTableRow niche="Finance & Investing" cpm="$15-50" difficulty="Medium" />
                                <NicheTableRow niche="True Crime" cpm="$8-15" difficulty="Medium" />
                                <NicheTableRow niche="History & Documentary" cpm="$6-12" difficulty="Medium" />
                                <NicheTableRow niche="Technology" cpm="$8-20" difficulty="Low" />
                                <NicheTableRow niche="Motivation" cpm="$5-10" difficulty="Low" />
                                <NicheTableRow niche="Scary Stories" cpm="$4-8" difficulty="Low" />
                            </tbody>
                        </table>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">How to Validate Your Niche</h3>

                <ol>
                    <li><strong>Search YouTube</strong> - Are there successful faceless channels in this niche?</li>
                    <li><strong>Check view counts</strong> - Are recent videos getting 10K+ views?</li>
                    <li><strong>Use VidIQ or TubeBuddy</strong> - Research keyword search volume</li>
                    <li><strong>Google Trends</strong> - Is interest growing, stable, or declining?</li>
                    <li><strong>Competition gap</strong> - Can you offer something unique?</li>
                </ol>

                {/* Step 2: Set Up Channel */}
                <SectionHeader
                    id="step-2-setup"
                    step={2}
                    icon={<Settings className="size-6" />}
                    title="Set Up Your YouTube Channel for Success"
                />

                <p>
                    With your niche selected, it's time to create your channel. Here's how to set it up for maximum impact:
                </p>

                <h3 className="text-xl font-bold text-slate-900">Channel Setup Checklist</h3>

                <div className="not-prose my-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <SetupItem
                            title="Create a New Google Account"
                            description="For privacy, use a separate account that doesn't link to your personal identity"
                        />
                        <SetupItem
                            title="Choose a Brandable Channel Name"
                            description="Pick something memorable that relates to your niche (e.g., 'History Untold', 'Wealth Wisdom', 'Mystery Files')"
                        />
                        <SetupItem
                            title="Design Profile Picture & Banner"
                            description="Use Canva to create professional branding - no face needed! Use icons, text, or abstract visuals"
                        />
                        <SetupItem
                            title="Write Keyword-Rich Description"
                            description="Include your niche keywords and what viewers can expect from your channel"
                        />
                        <SetupItem
                            title="Set Up Playlists"
                            description="Create 3-5 playlist categories based on your content pillars"
                        />
                    </div>
                </div>

                <div className="not-prose my-8">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <Lightbulb className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800">
                                <strong>Pro Tip:</strong> Your channel name doesn't need to include your real name. The most successful faceless channels have memorable brand names that hint at their content without revealing the creator.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 3: Content Strategy */}
                <SectionHeader
                    id="step-3-strategy"
                    step={3}
                    icon={<Calendar className="size-6" />}
                    title="Plan Your Content Strategy"
                />

                <p>
                    Consistency beats perfection. Before creating your first video, you need a sustainable content plan.
                </p>

                <h3 className="text-xl font-bold text-slate-900">Define Your Content Pillars</h3>

                <p>
                    Content pillars are 3-5 core themes within your niche. For example, a history channel might have:
                </p>

                <ul>
                    <li>Ancient civilizations</li>
                    <li>Military history</li>
                    <li>Unsolved historical mysteries</li>
                    <li>Biographies of historical figures</li>
                    <li>Historical "what ifs"</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Video Length Recommendations</h3>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <VideoLengthCard
                            type="Shorts"
                            duration="30-60 seconds"
                            purpose="Rapid growth, virality, subscriber acquisition"
                            frequency="2-3 per day"
                        />
                        <VideoLengthCard
                            type="Mid-form"
                            duration="8-12 minutes"
                            purpose="Sweet spot for monetization, good watch time"
                            frequency="2-3 per week"
                        />
                        <VideoLengthCard
                            type="Long-form"
                            duration="15-30 minutes"
                            purpose="Deep dives, highest revenue potential"
                            frequency="1 per week"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Posting Schedule</h3>

                <p>
                    For new channels aiming for rapid growth:
                </p>

                <ul>
                    <li><strong>Minimum:</strong> 3 videos per week</li>
                    <li><strong>Optimal:</strong> 1 long-form video + 1-2 Shorts daily</li>
                    <li><strong>Best days:</strong> Tuesday, Thursday, Saturday (varies by niche)</li>
                    <li><strong>Best times:</strong> When your target audience is most active (check analytics later)</li>
                </ul>

                {/* Step 4: Create Video */}
                <SectionHeader
                    id="step-4-create"
                    step={4}
                    icon={<Video className="size-6" />}
                    title="Create Your First Faceless Video"
                />

                <p>
                    Now for the exciting part - actually creating content. You have two main approaches:
                </p>

                <h3 className="text-xl font-bold text-slate-900">Method A: The Manual Approach</h3>
                <p className="text-slate-500 italic">Time required: 4-8 hours per video</p>

                <ol>
                    <li>
                        <strong>Write Your Script</strong>
                        <p className="text-slate-600 mt-1">Research your topic thoroughly. Write a compelling narrative with a strong hook, engaging middle, and clear conclusion. Aim for 1,500-2,000 words for a 10-minute video.</p>
                    </li>
                    <li>
                        <strong>Source Visuals</strong>
                        <p className="text-slate-600 mt-1">Find stock footage from Pexels (free), Pixabay (free), or Storyblocks (paid). Download clips that match your script sections.</p>
                    </li>
                    <li>
                        <strong>Record or Generate Voiceover</strong>
                        <p className="text-slate-600 mt-1">Record yourself with a USB microphone, or use AI voices from ElevenLabs, Murf, or Play.ht.</p>
                    </li>
                    <li>
                        <strong>Edit in Video Software</strong>
                        <p className="text-slate-600 mt-1">Use DaVinci Resolve (free), CapCut (free), or Premiere Pro (paid) to sync audio and visuals.</p>
                    </li>
                    <li>
                        <strong>Add Captions</strong>
                        <p className="text-slate-600 mt-1">70% of viewers watch with sound off. Use auto-caption tools or add manually.</p>
                    </li>
                    <li>
                        <strong>Export and Optimize</strong>
                        <p className="text-slate-600 mt-1">Export in 1080p or 4K, then upload to YouTube.</p>
                    </li>
                </ol>

                <h3 className="text-xl font-bold text-slate-900">Method B: The AI-Powered Approach with ViralReel</h3>
                <p className="text-slate-500 italic">Time required: Under 5 minutes per video</p>

                <div className="not-prose my-8">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 space-y-4">
                        <AIStepItem number={1} title="Enter Your Topic" description="Just type what your video should be about - e.g., 'The mystery of the Bermuda Triangle'" />
                        <AIStepItem number={2} title="AI Generates Script" description="ViralReel's AI writes an optimized, engaging script for your niche" />
                        <AIStepItem number={3} title="AI Creates Visuals" description="Automatically selects or generates visuals that match each section" />
                        <AIStepItem number={4} title="Professional Voiceover" description="Choose from hyper-realistic AI voices in multiple languages" />
                        <AIStepItem number={5} title="Auto-Captions & Editing" description="Perfectly synced captions and professional pacing applied automatically" />
                        <AIStepItem number={6} title="Export or Auto-Post" description="Download your video or auto-publish directly to YouTube" />
                    </div>
                </div>
            </div>

            {/* ViralReel CTA Box */}
            <div className="my-12 p-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl md:p-10 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg shrink-0">
                            <Sparkles className="size-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white m-0">Skip the Learning Curve - Create Your First Video in 5 Minutes</h3>
                    </div>
                    <p className="text-lg text-purple-100 mb-6">
                        Why spend hours learning video editing when AI can do it better? ViralReel handles everything - script, visuals, voice, captions, and editing. Just enter your topic and get a professional faceless video ready to upload.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        <FeatureCheckWhite text="AI Script Writing" />
                        <FeatureCheckWhite text="AI Voiceovers" />
                        <FeatureCheckWhite text="AI Visuals" />
                        <FeatureCheckWhite text="Auto-Captions" />
                        <FeatureCheckWhite text="Pro Editing" />
                        <FeatureCheckWhite text="Auto-Post to YouTube" />
                    </div>
                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-purple-50 transition-all font-semibold rounded-full" asChild>
                        <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                            Start Creating Free <ArrowRight className="size-5" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="prose prose-slate prose-lg md:prose-xl mx-auto text-slate-600">
                {/* Step 5: Optimize */}
                <SectionHeader
                    id="step-5-optimize"
                    step={5}
                    icon={<TrendingUp className="size-6" />}
                    title="Optimize Your Videos for Maximum Reach"
                />

                <p>
                    Creating great content is only half the battle. Optimization determines whether your videos get discovered.
                </p>

                <h3 className="text-xl font-bold text-slate-900">Title Formulas That Work</h3>

                <div className="not-prose my-6">
                    <div className="space-y-2">
                        <FormulaItem formula="[Number] + [Topic] + [Benefit/Emotion]" example="7 Ancient Mysteries That Still Baffle Scientists" />
                        <FormulaItem formula="How to [Achieve Result] in [Timeframe]" example="How to Build Wealth in Your 20s (Even on Low Income)" />
                        <FormulaItem formula="The Truth About [Topic] Nobody Tells You" example="The Truth About Dropshipping Nobody Tells You" />
                        <FormulaItem formula="Why [Common Belief] is Wrong" example="Why Everything You Know About Sleep is Wrong" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Thumbnail Strategies for Faceless Channels</h3>

                <p>
                    No face? No problem. The most effective faceless thumbnails use:
                </p>

                <ul>
                    <li><strong>Bold, readable text</strong> - 3-5 words maximum</li>
                    <li><strong>High contrast colors</strong> - Make it pop in the feed</li>
                    <li><strong>Curiosity-inducing imagery</strong> - Show the topic, not a face</li>
                    <li><strong>Consistent branding</strong> - Use similar style across videos</li>
                    <li><strong>Emotion triggers</strong> - Shock, curiosity, urgency</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Description Optimization</h3>

                <ul>
                    <li>First 2 lines are critical (shown before "Show more")</li>
                    <li>Include your primary keyword in the first sentence</li>
                    <li>Add timestamps for longer videos</li>
                    <li>Include relevant links and CTAs</li>
                    <li>Use relevant hashtags (3-5 maximum)</li>
                </ul>

                {/* Step 6: Publish */}
                <SectionHeader
                    id="step-6-publish"
                    step={6}
                    icon={<Upload className="size-6" />}
                    title="Upload and Publish Like a Pro"
                />

                <p>
                    How and when you publish matters. Follow these best practices:
                </p>

                <h3 className="text-xl font-bold text-slate-900">Publishing Best Practices</h3>

                <ul>
                    <li><strong>Schedule ahead</strong> - Upload and schedule videos in advance for consistency</li>
                    <li><strong>First 48 hours are critical</strong> - This is when YouTube tests your content</li>
                    <li><strong>Engage with early comments</strong> - Reply within the first few hours</li>
                    <li><strong>Add end screens</strong> - Promote your next video or subscription</li>
                    <li><strong>Use cards</strong> - Link to related content mid-video</li>
                </ul>

                <div className="not-prose my-8">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                        <Zap className="size-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-green-800">
                                <strong>ViralReel Auto-Post:</strong> Skip the manual upload process entirely. ViralReel can automatically publish your videos to YouTube on a schedule you set - perfect for batch-creating content.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 7: Grow & Scale */}
                <SectionHeader
                    id="step-7-scale"
                    step={7}
                    icon={<TrendingUp className="size-6" />}
                    title="Grow and Scale to Monetization"
                />

                <p>
                    You've published your first video. Now it's time to grow strategically.
                </p>

                <h3 className="text-xl font-bold text-slate-900">Your First 30 Days</h3>

                <ul>
                    <li>Post minimum 12 videos (3 per week)</li>
                    <li>Test different topics within your niche</li>
                    <li>Analyze which videos perform best</li>
                    <li>Double down on what works</li>
                    <li>Engage with every comment</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900">Key Metrics to Track</h3>

                <div className="not-prose my-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            metric="CTR"
                            target="4-10%"
                            description="Click-through rate on impressions"
                        />
                        <MetricCard
                            metric="AVD"
                            target="50%+"
                            description="Average view duration of total video"
                        />
                        <MetricCard
                            metric="Sub Rate"
                            target="2-5%"
                            description="Viewers who subscribe after watching"
                        />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Path to Monetization</h3>

                <div className="not-prose my-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-4">YouTube Partner Program Requirements</h4>
                        <div className="space-y-3">
                            <MonetizationMilestone milestone="1,000 Subscribers" timeline="Month 2-3" tip="Shorts help accelerate this" />
                            <MonetizationMilestone milestone="4,000 Watch Hours" timeline="Month 3-5" tip="Focus on 8+ minute videos" />
                            <MonetizationMilestone milestone="First Payment" timeline="Month 4-6" tip="$100 minimum threshold" />
                        </div>
                    </div>
                </div>

                {/* Checklist Section */}
                <SectionHeader
                    id="checklist"
                    step={0}
                    icon={<CheckSquare className="size-6" />}
                    title="Your Complete Faceless Channel Checklist"
                />

                <p>
                    Use this checklist to track your progress. Screenshot it or bookmark this page!
                </p>

                <div className="not-prose my-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <BadgeCheck className="size-5 text-green-600" />
                            Faceless Channel Launch Checklist
                        </h4>
                        <div className="space-y-2">
                            <ChecklistItem text="Niche selected and validated with PASS framework" />
                            <ChecklistItem text="Google account created (separate for privacy)" />
                            <ChecklistItem text="Channel set up with name, description, and branding" />
                            <ChecklistItem text="3-5 content pillars defined" />
                            <ChecklistItem text="30-day content calendar planned" />
                            <ChecklistItem text="Video creation tool selected (ViralReel recommended)" />
                            <ChecklistItem text="First video created and uploaded" />
                            <ChecklistItem text="Consistent posting schedule established" />
                            <ChecklistItem text="Analytics tracking reviewed weekly" />
                            <ChecklistItem text="First 10 videos published" />
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <SectionHeader
                    id="faq"
                    step={0}
                    icon={<Lightbulb className="size-6" />}
                    title="Frequently Asked Questions"
                />

                <div className="not-prose my-8 space-y-4">
                    <FAQItem
                        question="How long does it take to make money on a faceless YouTube channel?"
                        answer="Most faceless channels reach YouTube monetization (1,000 subscribers and 4,000 watch hours) within 3-6 months of consistent posting. Your first meaningful income ($100+/month) typically comes within 4-6 months. Full-time income ($5,000+/month) is achievable within 12-24 months with dedication and smart strategy."
                    />
                    <FAQItem
                        question="Do faceless YouTube channels get monetized?"
                        answer="Absolutely yes. Faceless channels are fully eligible for YouTube Partner Program monetization. YouTube evaluates content quality and engagement, not whether a face appears. Many faceless creators earn $5,000-50,000+ monthly through AdSense, sponsors, and affiliate marketing."
                    />
                    <FAQItem
                        question="What equipment do I need to start?"
                        answer="Minimal equipment is required. With AI tools like ViralReel, you need only a computer and internet connection. No camera, lighting, or microphone needed since AI handles visuals and voice. If you prefer recording your own voice, a basic USB microphone ($50-100) is helpful but optional."
                    />
                    <FAQItem
                        question="How many videos should I post per week?"
                        answer="For optimal growth, post at least 3 long-form videos per week. For YouTube Shorts, aim for 1-3 per day. Consistency matters more than volume - pick a schedule you can maintain long-term. Many successful creators batch-create content using AI tools to stay consistent."
                    />
                    <FAQItem
                        question="Can I use AI voices for my faceless YouTube channel?"
                        answer="Yes, AI voices are widely used by successful faceless creators. Modern AI voices (like those in ViralReel, ElevenLabs, and Murf) are hyper-realistic and often indistinguishable from human voices. YouTube fully allows AI-generated voiceovers as long as your content follows community guidelines."
                    />
                    <FAQItem
                        question="Should I start with YouTube Shorts or long-form content?"
                        answer="Ideally, do both. Shorts help you build subscribers quickly due to higher discoverability, while long-form content (8+ minutes) is essential for accumulating watch hours and generating higher AdSense revenue. A balanced strategy of 2-3 Shorts plus 2 long-form videos per week is optimal for new channels."
                    />
                    <FAQItem
                        question="How do I come up with video ideas?"
                        answer="Use these proven methods: 1) Study successful competitors for inspiration, 2) Check YouTube search autocomplete for popular queries, 3) Use VidIQ or TubeBuddy for keyword research, 4) Monitor trending topics in your niche, 5) Ask your audience via community posts, 6) Use AI tools like ViralReel which can suggest viral topics."
                    />
                </div>

                {/* Conclusion */}
                <SectionHeader
                    id="conclusion"
                    step={0}
                    icon={<Rocket className="size-6" />}
                    title="Start Your Faceless YouTube Journey Today"
                />

                <p>
                    You now have the complete roadmap to <strong>start a faceless YouTube channel</strong> in 2025. Let's recap the 7 steps:
                </p>

                <ol>
                    <li><strong>Choose your niche</strong> using the PASS framework</li>
                    <li><strong>Set up your channel</strong> with branded visuals</li>
                    <li><strong>Plan your content strategy</strong> with pillars and a calendar</li>
                    <li><strong>Create your first video</strong> (manually or with ViralReel)</li>
                    <li><strong>Optimize for discovery</strong> with killer titles and thumbnails</li>
                    <li><strong>Publish strategically</strong> and engage with your audience</li>
                    <li><strong>Track, iterate, and scale</strong> to monetization</li>
                </ol>

                <p>
                    The creators who succeed aren't necessarily the most talented - they're the ones who start and stay consistent. With AI tools like ViralReel, the technical barriers have been eliminated. The only thing left is your decision to begin.
                </p>

                <p>
                    <strong>Your first video is waiting to be created. Will you start today?</strong>
                </p>
            </div>

            {/* Final CTA */}
            <div className="mt-20 text-center bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/40 via-slate-900 to-slate-900 z-0"></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h3 className="text-3xl md:text-4xl font-bold">Ready to Create Your First Faceless Video?</h3>
                    <p className="text-slate-300 text-lg">
                        Join thousands of creators building successful faceless channels with ViralReel. From idea to published video in under 5 minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-lg bg-green-500 hover:bg-green-400 text-white transition-all w-full sm:w-auto font-semibold rounded-full whitespace-nowrap" asChild>
                            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/sign-up`} className="inline-flex items-center gap-2">
                                Start Creating Free <ArrowRight className="size-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all w-full sm:w-auto font-semibold rounded-full whitespace-nowrap" asChild>
                            <Link href="/#pricing" className="inline-flex items-center gap-2">
                                View Pricing <ChevronRight className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

// Component: Quick Summary Box
function QuickSummaryBox() {
    return (
        <div className="my-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="size-5 text-green-600" />
                Quick Summary: 7 Steps to Start a Faceless Channel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStep number={1} text="Choose Niche" />
                <QuickStep number={2} text="Set Up Channel" />
                <QuickStep number={3} text="Plan Content" />
                <QuickStep number={4} text="Create Videos" />
                <QuickStep number={5} text="Optimize SEO" />
                <QuickStep number={6} text="Publish & Engage" />
                <QuickStep number={7} text="Grow & Scale" />
            </div>
        </div>
    );
}

function QuickStep({ number, text }: { number: number; text: string }) {
    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-100">
            <span className="flex items-center justify-center size-6 bg-green-600 text-white rounded-full text-xs font-bold shrink-0">{number}</span>
            <span className="text-sm font-medium text-slate-700">{text}</span>
        </div>
    );
}

// Component: Table of Contents
function TableOfContents() {
    const sections = [
        { id: "why-start", title: "Why Start a Faceless Channel?" },
        { id: "step-1-niche", title: "Step 1: Choose Your Niche" },
        { id: "step-2-setup", title: "Step 2: Set Up Your Channel" },
        { id: "step-3-strategy", title: "Step 3: Plan Content Strategy" },
        { id: "step-4-create", title: "Step 4: Create Your First Video" },
        { id: "step-5-optimize", title: "Step 5: Optimize for Reach" },
        { id: "step-6-publish", title: "Step 6: Publish Like a Pro" },
        { id: "step-7-scale", title: "Step 7: Grow & Monetize" },
        { id: "checklist", title: "Launch Checklist" },
        { id: "faq", title: "FAQ" },
    ];

    return (
        <div className="my-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-green-600" />
                Table of Contents
            </h2>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-start gap-2 text-slate-600 hover:text-green-600 transition-colors py-1"
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
function SectionHeader({ id, step, icon, title }: { id: string; step: number; icon: React.ReactNode; title: string }) {
    return (
        <h2 id={id} className="flex items-start gap-3 text-3xl font-bold text-slate-900 mt-16 mb-8 group scroll-mt-24">
            <span className="flex items-center justify-center size-10 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform duration-300 shrink-0">
                {icon}
            </span>
            {step > 0 && <span className="text-green-600">Step {step}:</span>} {title.replace(`Step ${step}: `, '')}
        </h2>
    );
}

// Component: Benefit Card
function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
            <div className="p-2 bg-slate-50 rounded-lg shrink-0">
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
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">{number}</div>
            <div className="text-sm text-slate-600 mt-1">{label}</div>
        </div>
    );
}

// Component: PASS Item
function PassItem({ letter, word, description }: { letter: string; word: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex items-center justify-center size-8 bg-green-600 text-white rounded-lg text-sm font-bold shrink-0">{letter}</span>
            <div>
                <span className="font-bold text-slate-900">{word}</span>
                <p className="text-sm text-slate-600">{description}</p>
            </div>
        </div>
    );
}

// Component: Niche Table Row
function NicheTableRow({ niche, cpm, difficulty }: { niche: string; cpm: string; difficulty: string }) {
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
            <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                    {difficulty}
                </span>
            </td>
        </tr>
    );
}

// Component: Setup Item
function SetupItem({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
            <div>
                <span className="font-bold text-slate-900">{title}</span>
                <p className="text-sm text-slate-600">{description}</p>
            </div>
        </div>
    );
}

// Component: Video Length Card
function VideoLengthCard({ type, duration, purpose, frequency }: { type: string; duration: string; purpose: string; frequency: string }) {
    return (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center">
            <div className="text-lg font-bold text-slate-900">{type}</div>
            <div className="text-2xl font-bold text-green-600 my-2">{duration}</div>
            <p className="text-sm text-slate-600 mb-2">{purpose}</p>
            <div className="text-xs text-slate-500 bg-slate-50 rounded-full px-3 py-1 inline-block">{frequency}</div>
        </div>
    );
}

// Component: AI Step Item
function AIStepItem({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex items-center justify-center size-8 bg-purple-600 text-white rounded-full text-sm font-bold shrink-0">{number}</span>
            <div>
                <span className="font-bold text-slate-900">{title}</span>
                <p className="text-sm text-purple-700">{description}</p>
            </div>
        </div>
    );
}

// Component: Feature Check White
function FeatureCheckWhite({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-300 shrink-0" />
            <span className="text-purple-100 text-sm">{text}</span>
        </div>
    );
}

// Component: Formula Item
function FormulaItem({ formula, example }: { formula: string; example: string }) {
    return (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500 font-medium mb-1">Formula:</div>
            <div className="font-mono text-sm text-slate-700 mb-2">{formula}</div>
            <div className="text-xs text-slate-500 font-medium mb-1">Example:</div>
            <div className="text-sm text-green-600 font-medium">{example}</div>
        </div>
    );
}

// Component: Metric Card
function MetricCard({ metric, target, description }: { metric: string; target: string; description: string }) {
    return (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center">
            <div className="text-sm text-slate-500 mb-1">{metric}</div>
            <div className="text-2xl font-bold text-green-600">{target}</div>
            <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
    );
}

// Component: Monetization Milestone
function MonetizationMilestone({ milestone, timeline, tip }: { milestone: string; timeline: string; tip: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
            <div className="flex items-center gap-3">
                <CircleDollarSign className="size-5 text-green-600 shrink-0" />
                <div>
                    <div className="font-bold text-slate-900">{milestone}</div>
                    <div className="text-xs text-slate-500">{tip}</div>
                </div>
            </div>
            <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">{timeline}</div>
        </div>
    );
}

// Component: Checklist Item
function ChecklistItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-100">
            <div className="size-5 rounded border-2 border-green-300 shrink-0"></div>
            <span className="text-sm text-slate-700">{text}</span>
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
