import { useState, useEffect } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import {
    User,
    CreditCard,
    Share2,
    Pencil,
    ChevronLeft,
    Check,
    AlertCircle,
    Loader2,
    DollarSign,
    History,
    FileText,
    Download,
    Coins,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    XCircle,
    Video,
    Clock
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/context/auth-context"
import { API_BASE_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SubscriptionData {
    status: string;
    subscription: any | null;
    planName?: string;
    planPrice?: number;
    interval?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    usage?: {
        used: number;
        total: number;
        resetsAt: string;
    } | null;
}

interface Invoice {
    id: string;
    number: string;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    invoice_pdf: string;
}


export default function SettingsPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const { session } = useAuth()

    // Determine active tab from the URL path
    const pathParts = location.pathname.split("/").filter(Boolean)
    const activeTab = pathParts.includes("settings") && pathParts[pathParts.length - 1] !== "settings"
        ? pathParts[pathParts.length - 1]
        : "account"

    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Profile State
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")

    // Password State
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        if (session?.user) {
            setFullName(session.user.name || "")
            setEmail(session.user.email || "")
        }
    }, [session])

    // Handle Payment Cancel
    useEffect(() => {
        if (searchParams.get("canceled")) {
            toast.info("Payment sequence canceled")
            // Clear the param without refreshing
            const newParams = new URLSearchParams(searchParams)
            newParams.delete("canceled")
            setSearchParams(newParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            const { error } = await authClient.updateUser({
                name: fullName.trim(),
            })
            if (error) throw error
            toast.success("Profile updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile")
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        setIsUpdatingPassword(true)
        try {
            const { error } = await authClient.changePassword({
                currentPassword,
                newPassword,
            })
            if (error) throw error
            toast.success("Password updated successfully")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const handleTabChange = (value: string) => {
        navigate(`/settings/${value}`)
    }

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
                <TabsList className="bg-transparent border-b border-slate-200 rounded-none h-auto p-0 gap-8 w-full justify-start">
                    <TabsTrigger
                        value="account"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 text-slate-500 px-0 py-3 font-semibold transition-all"
                    >
                        <User className="h-4 w-4 mr-2" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger
                        value="billing"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 text-slate-500 px-0 py-3 font-semibold transition-all"
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                    </TabsTrigger>
                    <TabsTrigger
                        value="credits"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 text-slate-500 px-0 py-3 font-semibold transition-all"
                    >
                        <Coins className="h-4 w-4 mr-2" />
                        Credits
                    </TabsTrigger>
                    <TabsTrigger
                        value="social"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 text-slate-500 px-0 py-3 font-semibold transition-all"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Social
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-8 mt-0 focus-visible:ring-0">
                    {/* Profile Information Section */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-bold">Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col md:flex-row gap-12">
                                {/* Avatar Upload Area */}
                                <div className="flex flex-col items-center gap-4 group">
                                    <div className="relative">
                                        <Avatar className="h-32 w-32 ring-8 ring-slate-50 border-4 border-white">
                                            <AvatarImage src={session?.user.image || undefined} />
                                            <AvatarFallback className="bg-orange-100 text-orange-600 text-3xl font-bold">
                                                {session?.user.name ? session.user.name.charAt(0) : "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button
                                            size="icon"
                                            className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 border-2 border-white text-white shadow-lg shadow-purple-200 transition-transform group-hover:scale-110"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[120px]">
                                            Allowed *.jpeg, *.jpg, *.png, *.gif
                                            Max size of 3.1 MB
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-bold text-slate-700 ml-1">Full Name</Label>
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full Name"
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-bold text-slate-700 ml-1">Email Address</Label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Share2 className="h-4 w-4 rotate-45" /> {/* Generic email icon placeholder */}
                                            </div>
                                            <Input
                                                value={email}
                                                disabled
                                                className="h-12 pl-11 rounded-xl bg-slate-100 border-slate-100 text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    className="h-11 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold shadow-lg shadow-purple-100"
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password & Security Section */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-bold">Password & Security</CardTitle>
                            <CardDescription className="text-slate-500 font-medium mt-1">
                                Update your password associated with your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 ml-1">Current Password</Label>
                                    <PasswordInput
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 ml-1">New Password</Label>
                                        <PasswordInput
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</Label>
                                        <PasswordInput
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 rounded-2xl p-6 space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-purple-600" />
                                        Password Requirements:
                                    </h4>
                                    <ul className="space-y-1.5 ml-1">
                                        {[
                                            "Minimum 8 characters long",
                                            "At least one lowercase character",
                                            "At least one number, symbol, or whitespace character"
                                        ].map((req, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="outline"
                                    className="h-11 px-8 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                                    onClick={handleUpdatePassword}
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-8 mt-0 focus-visible:ring-0">
                    <BillingTab />
                </TabsContent>

                <TabsContent value="credits" className="space-y-8 mt-0 focus-visible:ring-0">
                    <CreditsTab />
                </TabsContent>

                <TabsContent value="social">
                    <Card className="rounded-3xl border-dashed border-2 border-slate-100 bg-slate-50/30">
                        <CardContent className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                            <Share2 className="h-12 w-12 text-slate-200" />
                            <p className="font-bold text-slate-400">Social integrations coming soon</p>
                            <p className="text-xs font-medium text-slate-300">Connect your YouTube, Instagram, and TikTok accounts</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function BillingTab() {
    const navigate = useNavigate()
    const [subData, setSubData] = useState<SubscriptionData | null>(null)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBillingData = async () => {
            try {
                const [subRes, invRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/payments/subscription`, { credentials: 'include' }),
                    fetch(`${API_BASE_URL}/api/payments/invoices`, { credentials: 'include' })
                ])

                if (subRes.ok) {
                    const data = await subRes.json()
                    setSubData(data)
                }

                if (invRes.ok) {
                    const data = await invRes.json()
                    setInvoices(data)
                }
            } catch (error) {
                console.error("Failed to fetch billing data:", error)
                toast.error("Failed to load billing information")
            } finally {
                setIsLoading(false)
            }
        }

        fetchBillingData()
    }, [])

    const handleManageSubscription = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/payments/create-portal-session`, {
                method: 'POST',
                credentials: 'include'
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error("Failed to open billing portal")
            }
        } catch (error) {
            console.error("Portal error:", error)
            toast.error("An error occurred")
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-slate-500 font-medium">Loading billing details...</p>
            </div>
        )
    }

    const hasActiveSubscription = subData?.status === 'active'

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Subscription Plan Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Subscription Plan</CardTitle>
                        <p className="text-slate-500 font-medium text-sm">Manage your billing and subscription details</p>
                    </div>
                    {hasActiveSubscription && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 italic">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-600">Active Status</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    {!hasActiveSubscription ? (
                        <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100 flex items-start gap-6">
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg leading-none">No Active Subscription</h3>
                                    <p className="text-slate-500 font-medium text-sm max-w-lg">
                                        Subscribe to a plan to start creating unlimited AI videos with Viral Reel.
                                        Unlock premium features and priority rendering.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigate("/settings/pricing")}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-purple-100"
                                >
                                    Choose a Plan
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-50">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-800 text-2xl tracking-tight">{subData?.planName || 'Creator Plus'}</h3>
                                        <CheckCircle2 className="h-5 w-5 text-indigo-500 fill-indigo-500/10" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <p>Next billing date: <span className="text-slate-900 font-bold">{subData?.currentPeriodEnd ? new Date(subData.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-4xl font-black text-slate-900 leading-none">${(subData?.planPrice || 3900) / 100}</span>
                                        <span className="text-slate-400 font-bold text-lg">/{subData?.interval || 'mo'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 text-sm">Monthly Usage</h4>
                                        <div className="text-sm">
                                            <span className="text-indigo-600 font-black">{subData?.usage?.used || 0}</span>
                                            <span className="text-slate-400 font-semibold"> / {subData?.usage?.total || 60} premium videos</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, ((subData?.usage?.used || 0) / (subData?.usage?.total || 60)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic">
                                        Resets on {subData?.usage?.resetsAt ? new Date(subData.usage.resetsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Features</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        {[
                                            { label: "Priority generation", active: true },
                                            { label: "Auto-post to YouTube", active: true },
                                            { label: "All voices, styles, transitions", active: true },
                                            { label: "Multi-niche workflows", active: true },
                                            { label: "Early access to new features", active: true },
                                            { label: "TikTok/IG auto-post", comingSoon: true },
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                {feature.comingSoon ? (
                                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
                                                        <Clock className="h-3 w-3 text-slate-300" />
                                                    </div>
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-100">
                                                        <Check className="h-3 w-3 text-white" strokeWidth={4} />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-xs font-bold", feature.comingSoon ? "text-slate-300" : "text-slate-600")}>
                                                        {feature.label}
                                                    </span>
                                                    {feature.comingSoon && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-tighter">
                                                            Coming Soon
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-slate-50 gap-4">
                                <button
                                    onClick={() => toast.info("Please contact support to cancel your plan")}
                                    className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
                                >
                                    Cancel Plan
                                </button>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => toast.info("Upgrade/Downgrade functionality coming soon")}
                                        className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
                                    >
                                        Upgrade/Downgrade Plan
                                    </Button>
                                    <Button
                                        onClick={handleManageSubscription}
                                        className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
                                    >
                                        Manage Subscription
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Billing History Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xl font-bold">Billing History</CardTitle>
                    {invoices.length > 0 && (
                        <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold text-sm h-auto p-0 flex items-center gap-1.5">
                            Download All
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {invoices.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100/50">
                                <FileText className="h-8 w-8 text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-slate-400">No invoices available yet.</p>
                                <p className="text-xs font-medium text-slate-300">Your transaction history will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-y border-slate-100 bg-slate-50/50">
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map((invoice: Invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <FileText className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{invoice.number}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-medium text-slate-500">
                                                {new Date(invoice.created * 1000).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-700">
                                                {(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                                    invoice.status === 'paid' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function CreditsTab() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isVerifying, setIsVerifying] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [autoRecharge, setAutoRecharge] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [history, setHistory] = useState<any[]>([])
    const [balance, setBalance] = useState<{ used: number; total: number } | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [subRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/payments/subscription`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/api/payments/credits-history`, { credentials: "include" })
            ])

            if (subRes.ok) {
                const subData = await subRes.json()
                setBalance(subData.usage)
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json()
                setHistory(historyData)
            }
        } catch (error) {
            console.error("Error fetching credits data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Handle Payment Success & Verification
    useEffect(() => {
        const sessionId = searchParams.get("session_id")
        const success = searchParams.get("success")

        if (success && sessionId && !isVerifying) {
            const verifyPayment = async () => {
                setIsVerifying(true)
                const toastId = toast.loading("Verifying payment...")

                try {
                    const response = await fetch(`${API_BASE_URL}/api/payments/verify-session`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ sessionId }),
                        credentials: "include", // Important for auth
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || "Verification failed")
                    }

                    const data = await response.json()

                    toast.success("Payment verified! Credits added.", {
                        id: toastId,
                    })

                    // Clear params
                    const newParams = new URLSearchParams(searchParams)
                    newParams.delete("success")
                    newParams.delete("session_id")
                    setSearchParams(newParams, { replace: true })

                    // Re-fetch data to reflect new credits
                    fetchData()

                } catch (error: any) {
                    console.error("Verification error:", error)
                    toast.error(error.message || "Payment verification failed", {
                        id: toastId,
                    })
                } finally {
                    setIsVerifying(false)
                }
            }

            verifyPayment()
        }
    }, [searchParams, setSearchParams])

    const formatCredits = (credits: any) => {
        const num = parseFloat(credits)
        return num > 0 ? `+${num}` : num
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'plus': return Plus
            case 'video': return Video
            default: return Share2
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Top Section: Balance & Auto-Recharge */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-sm overflow-hidden relative">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Credit Balance</h3>
                            <Button
                                onClick={() => navigate("/settings/pricing")}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-purple-100 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                <Plus className="h-4 w-4" />
                                Buy Credits
                            </Button>
                        </div>

                        <div className="bg-purple-50/10 rounded-2xl p-8 border border-purple-100/50 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group">
                            {/* Decorative background circle */}
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-100/10 rounded-full blur-3xl group-hover:bg-purple-100/20 transition-all duration-700" />

                            <div className="space-y-1 relative">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Available Credits</p>
                                <div className="flex items-baseline gap-2">
                                    {isLoading ? (
                                        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-5xl font-bold text-purple-600 tracking-tight">
                                                {balance ? (balance.total - balance.used).toLocaleString() : "0"}
                                            </span>
                                            <span className="text-lg font-bold text-purple-400/80">credits</span>
                                        </>
                                    )}
                                </div>
                                {!isLoading && balance && (
                                    <p className="text-sm font-medium text-slate-500 pt-2 flex items-center gap-1.5">
                                        You have used <span className="font-bold text-slate-700">{balance.used}</span> out of <span className="font-bold text-slate-700">{balance.total}</span> credits
                                        <span className="h-1 w-1 rounded-full bg-slate-200 mx-1" />
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            {Math.round(((balance.total - balance.used) / balance.total) * 100)}% available
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Credit History Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 space-y-0">
                    <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Credit History</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                            <Input
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 pl-11 pr-4 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium text-sm"
                            />
                        </div>
                        <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 hover:bg-slate-50 font-bold flex items-center gap-2 text-sm text-slate-600">
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-y border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                                            <p className="text-sm font-bold text-slate-400 mt-4">Loading history...</p>
                                        </td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <p className="text-sm font-bold text-slate-400">No credit transactions yet.</p>
                                        </td>
                                    </tr>
                                ) : history.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
                                    const Icon = getIcon(item.iconType)
                                    const date = new Date(item.date)
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                        parseFloat(item.credits) > 0 ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-600 text-sm whitespace-nowrap">
                                                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                                    item.status === 'Completed' || item.status === 'Success'
                                                        ? "bg-emerald-100 text-emerald-600"
                                                        : item.status.includes('Failed')
                                                            ? "bg-amber-100 text-amber-600"
                                                            : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={cn(
                                                    "text-sm font-bold tracking-tight",
                                                    parseFloat(item.credits) > 0 ? "text-emerald-600" : parseFloat(item.credits) < 0 ? "text-red-500" : "text-slate-400"
                                                )}>
                                                    {formatCredits(item.credits)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
