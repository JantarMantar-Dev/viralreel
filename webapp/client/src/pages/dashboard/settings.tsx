import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
    Video
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
    subscription: any | null;
    plan: any | null;
    creditBalance: any | null;
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-slate-500 font-medium">Loading billing details...</p>
            </div>
        )
    }

    const hasActiveSubscription = subData?.subscription?.status === 'active'

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Billing & Subscription Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-bold">Billing & Subscription</CardTitle>
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
                        <div className="bg-purple-50/30 rounded-2xl p-8 border border-purple-100 flex items-start gap-6">
                            <div className="h-12 w-12 rounded-xl bg-white border border-purple-100 flex items-center justify-center shadow-sm shrink-0">
                                <CreditCard className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 text-lg leading-none">{subData?.plan?.name} Plan</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-slate-500 font-medium text-sm">
                                            Your next billing date is {subData?.subscription?.current_period_end ? new Date(subData.subscription.current_period_end).toLocaleDateString() : 'N/A'}.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="border-slate-200 h-10 px-4 rounded-xl font-bold text-slate-700 bg-white">
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
    const [autoRecharge, setAutoRecharge] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const history = [
        { id: 1, name: "Summer Promo Campaign", date: "Oct 24, 2023 2:30 PM", type: "HD Rendering", status: "Completed", credits: -50, icon: Video },
        { id: 2, name: "Product Launch Teaser", date: "Oct 22, 2023 10:15 AM", type: "4K Rendering", status: "Completed", credits: -120, icon: Video },
        { id: 3, name: "Credit Pack Purchase", date: "Oct 20, 2023 9:00 AM", type: "Top-up", status: "Success", credits: 500, icon: Plus },
        { id: 4, name: "Social Media Shorts #4", date: "Oct 18, 2023 4:45 PM", type: "HD Rendering", status: "Failed (Refunded)", credits: 0, icon: Video },
        { id: 5, name: "Voiceover Generation", date: "Oct 18, 2023 4:30 PM", type: "TTS Service", status: "Completed", credits: -15, icon: Share2 },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Top Section: Balance & Auto-Recharge */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[32px] border-slate-100 shadow-sm overflow-hidden relative">
                    <CardContent className="p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Credit Balance</h3>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-purple-100 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Buy Credits
                            </Button>
                        </div>

                        <div className="bg-purple-50/30 rounded-3xl p-8 border border-purple-100/50 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group">
                            {/* Decorative background circle */}
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-100/10 rounded-full blur-3xl group-hover:bg-purple-100/20 transition-all duration-700" />

                            <div className="space-y-1 relative">
                                <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">Available Credits</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl font-black text-purple-600 tracking-tight">2,450</span>
                                    <span className="text-xl font-bold text-purple-400">credits</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-500 pt-2">
                                    Enough for approximately <span className="text-slate-800">45 minutes</span> of HD video rendering.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-slate-50/50">
                    <CardContent className="p-10 flex flex-col justify-between h-full space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <AlertCircle className="h-5 w-5 text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-800">Auto-Recharge</h3>
                            </div>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Automatically purchase credits when your balance falls below 100.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                            <span className={cn("text-sm font-bold", autoRecharge ? "text-slate-800" : "text-slate-400")}>
                                {autoRecharge ? "Enabled" : "Disabled"}
                            </span>
                            <button
                                onClick={() => setAutoRecharge(!autoRecharge)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                                    autoRecharge ? "bg-purple-600" : "bg-slate-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                                        autoRecharge ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Credit History Section */}
            <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="p-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Credit History</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                            <Input
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 pl-11 pr-4 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-purple-50 transition-all font-medium"
                            />
                        </div>
                        <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-200 hover:bg-slate-50 font-bold flex items-center gap-2">
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
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Name</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                        item.credits > 0 ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-600 text-sm whitespace-nowrap">
                                                        {item.date.split(' ').slice(0, 3).join(' ')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">
                                                        {item.date.split(' ').slice(3).join(' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                    item.status === 'Completed' || item.status === 'Success'
                                                        ? "bg-emerald-100 text-emerald-600"
                                                        : item.status.includes('Failed')
                                                            ? "bg-amber-100 text-amber-600"
                                                            : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-black">
                                                <span className={cn(
                                                    "text-sm tracking-tight",
                                                    item.credits > 0 ? "text-emerald-600" : item.credits < 0 ? "text-red-500" : "text-slate-400"
                                                )}>
                                                    {item.credits > 0 ? `+${item.credits}` : item.credits}
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
