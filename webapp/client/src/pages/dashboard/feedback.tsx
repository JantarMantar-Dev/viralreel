import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Star,
    ChevronLeft,
    Upload,
    Bug,
    Sparkles,
    HelpCircle,
    CreditCard,
    Send,
    Loader2,
    User,
    Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

type FeedbackType = "bug" | "feature" | "general" | "billing"

export default function FeedbackPage() {
    const navigate = useNavigate()
    const { session } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [type, setType] = useState<FeedbackType>("feature")

    const [formData, setFormData] = useState({
        details: "",
    })

    const feedbackTypes: { id: FeedbackType; label: string; icon: any }[] = [
        { id: "bug", label: "Bug Report", icon: Bug },
        { id: "feature", label: "Feature Request", icon: Sparkles },
        { id: "general", label: "General Inquiry", icon: HelpCircle },
        { id: "billing", label: "Billing Issue", icon: CreditCard },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            toast.error("Please provide a rating")
            return
        }
        setIsSubmitting(true)

        try {
            // Mock submission for now
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success("Feedback submitted! Thank you for your input.")
            navigate("/dashboard")
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-700 font-outfit pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest border border-purple-100/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Feedback Center
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    We value your feedback
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Help us improve your AI video generation experience. Your insights drive our innovation.
                </p>
            </div>

            <Card className="rounded-[40px] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardContent className="p-8 md:p-12 space-y-12">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Type Selection */}
                        <div className="space-y-6">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                What kind of feedback is this?
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {feedbackTypes.map((t) => {
                                    const Icon = t.icon
                                    const isActive = type === t.id
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id)}
                                            className={cn(
                                                "relative flex items-center justify-center gap-2.5 h-14 px-4 rounded-2xl font-bold text-sm transition-all duration-300",
                                                isActive
                                                    ? "bg-white border-2 border-purple-500 text-purple-600 shadow-lg shadow-purple-100"
                                                    : "bg-slate-50 border-2 border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <Icon className={cn("h-4 w-4", isActive ? "text-purple-500" : "text-slate-400")} />
                                            {t.label}
                                            {isActive && (
                                                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-purple-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                                    <div className="h-1 w-1 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Rating Section */}
                        <div className="space-y-6">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                How would you rate the generation speed?
                            </Label>
                            <div className="flex items-center gap-6">
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none group transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={cn(
                                                    "h-8 w-8 transition-all duration-300",
                                                    (hoverRating || rating) >= star
                                                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                                        : "text-slate-200 group-hover:text-slate-300"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                    <span className="text-sm font-bold text-slate-600">{rating || 0} out of 5</span>
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-700 ml-1">Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                    <Input
                                        disabled
                                        value={session?.user?.name || ""}
                                        className="h-14 pl-14 rounded-2xl bg-slate-50/50 border-slate-100 font-medium text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-700 ml-1">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                    <Input
                                        disabled
                                        value={session?.user?.email || ""}
                                        className="h-14 pl-14 rounded-2xl bg-slate-50/50 border-slate-100 font-medium text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details Area */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-slate-700 ml-1">Details</Label>
                            <div className="space-y-2">
                                <Textarea
                                    required
                                    placeholder="Please describe your experience, issues, or suggestions in detail..."
                                    className="min-h-[200px] rounded-[30px] bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium p-8 resize-none leading-relaxed text-slate-700"
                                    value={formData.details}
                                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                                    maxLength={500}
                                />
                                <div className="flex justify-between px-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Markdown supported</span>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        formData.details.length >= 500 ? "text-red-500" : "text-slate-400"
                                    )}>
                                        {formData.details.length}/500 characters
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-slate-700 ml-1">Attachments (Optional)</Label>
                            <div className="border-2 border-dashed border-slate-100 rounded-[30px] p-12 bg-slate-50/30 hover:bg-white hover:border-purple-200 transition-all duration-300 group cursor-pointer text-center space-y-4">
                                <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-bold text-slate-900">Click to upload or drag and drop</p>
                                    <p className="text-sm text-slate-400 font-medium">SVG, PNG, JPG or GIF (max. 800×400px)</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-50">
                            <div className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed">
                                We usually respond within 24 hours. For urgent issues, please contact <a href="mailto:support@storygoviral.ai" className="text-purple-600 hover:underline">support</a> directly.
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/dashboard")}
                                    className="h-14 px-10 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-14 px-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-base shadow-xl shadow-purple-200 transition-all duration-300 active:scale-95 group flex-1 md:flex-none"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Submit Feedback
                                            <Send className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="text-center">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    © 2024 Viral Reel. All rights reserved.
                </p>
            </div>
        </div>
    )
}
