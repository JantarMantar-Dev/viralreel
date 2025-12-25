import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ChevronLeft,
    Mail,
    Send,
    ShieldCheck,
    Headphones,
    Network,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { submitOpnForm, CONTACT_SALES_FORM } from "@/lib/opnform"

export default function ContactSalesPage() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        companyName: "",
        email: "",
        message: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await submitOpnForm({
                slug: CONTACT_SALES_FORM.SLUG,
                data: {
                    [CONTACT_SALES_FORM.FIELDS.FULL_NAME]: formData.fullName,
                    [CONTACT_SALES_FORM.FIELDS.COMPANY_NAME]: formData.companyName,
                    [CONTACT_SALES_FORM.FIELDS.APP_NAME]: CONTACT_SALES_FORM.APP_NAME_VALUE,
                    [CONTACT_SALES_FORM.FIELDS.WORK_EMAIL]: formData.email,
                    [CONTACT_SALES_FORM.FIELDS.MESSAGE]: formData.message,
                }
            })

            toast.success("Request submitted! Our team will contact you soon.")
            navigate("/settings/pricing")
        } catch (error: any) {
            console.error("OpnForm submission error:", error)
            toast.error(error.message || "Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-white animate-in fade-in duration-700 font-outfit">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
                {/* Header */}
                <button
                    onClick={() => navigate("/settings/pricing")}
                    className="flex items-center text-slate-500 hover:text-purple-600 transition-colors font-bold text-sm mb-12 group"
                >
                    <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Plans
                </button>

                <div className="max-w-3xl mb-12">
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                        Contact Sales
                    </h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                        Interested in a custom enterprise solution? Tell us about your needs and our team will get back to you shortly.
                    </p>
                </div>

                {/* Contact Form Card */}
                <Card className="rounded-[40px] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden mb-24">
                    <CardContent className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 ml-1">Full Name</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Jane Doe"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium px-6"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 ml-1">Company Name</Label>
                                    <Input
                                        placeholder="e.g. Acme Corp"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium px-6"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 ml-1">Work Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        required
                                        type="email"
                                        placeholder="you@company.com"
                                        className="h-14 pl-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700 ml-1">How can we help?</Label>
                                <Textarea
                                    required
                                    placeholder="Tell us about your team size, video volume needs, and any specific requirements..."
                                    className="min-h-[160px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium p-6 resize-none leading-relaxed"
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-14 px-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-base shadow-xl shadow-purple-200 transition-all duration-300 active:scale-95 group min-w-[200px]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Submit Request
                                            <Send className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Features Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Enterprise Security</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                SSO, custom data retention, and advanced security protocols.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                            <Headphones className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Dedicated Support</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Priority 24/7 support and a dedicated success manager.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                            <Network className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Custom Integrations</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                API access and custom workflow integrations for your team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
