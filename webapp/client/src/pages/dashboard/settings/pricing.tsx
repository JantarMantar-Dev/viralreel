import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    ChevronLeft,
    Check,
    Zap,
    Star,
    Rocket,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: string | null;
    credits: number;
    stripePriceId: string;
}

export default function PricingPage() {
    const navigate = useNavigate()
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/payments/plans`)
                if (res.ok) {
                    const data = await res.json()
                    setPlans(data)
                }
            } catch (error) {
                console.error("Failed to fetch plans:", error)
                toast.error("Failed to load pricing plans")
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlans()
    }, [])

    const handleSubscribe = async (priceId: string) => {
        setIsProcessing(priceId)
        try {
            const res = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
                credentials: 'include'
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error || "Failed to create checkout session")
            }
        } catch (error: any) {
            console.error("Checkout error:", error)
            toast.error(error.message || "Something went wrong")
        } finally {
            setIsProcessing(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                <p className="text-slate-500 font-medium font-outfit">Loading the best plans for you...</p>
            </div>
        )
    }

    // Sort plans to match order: Creator, Creator Plus, Starter Pack
    const orderedPlans = [
        plans.find(p => p.name.includes("Creator") && !p.name.includes("Plus")),
        plans.find(p => p.name.includes("Creator Plus")),
        plans.find(p => p.name.includes("Starter Pack"))
    ].filter(Boolean) as Plan[];

    return (
        <div className="min-h-screen bg-white animate-in fade-in duration-700 font-outfit">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
                {/* Header */}
                <button
                    onClick={() => navigate("/settings/billing")}
                    className="flex items-center text-slate-500 hover:text-purple-600 transition-colors font-bold text-sm mb-12 group"
                >
                    <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Settings
                </button>

                <div className="max-w-3xl mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                        Choose Your Plan
                    </h1>
                    <p className="text-base text-slate-500 font-medium">
                        Select the perfect plan for your creative needs. Upgrade or downgrade at any time.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {orderedPlans.map((plan) => {
                        const isPlus = plan.name.includes("Plus");
                        const isOneTime = !plan.interval;

                        return (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "relative rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.01]",
                                    isPlus && "border-2 border-purple-500 shadow-purple-100 ring-8 ring-purple-50"
                                )}
                            >
                                {isPlus && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg shadow-purple-100">
                                        Most Popular
                                    </div>
                                )}

                                <CardContent className="p-8 flex flex-col h-full">
                                    <div className="text-center mb-8">
                                        <h3 className={cn(
                                            "text-xl font-bold mb-4",
                                            isPlus ? "text-purple-600" : "text-slate-900"
                                        )}>
                                            {plan.name}
                                        </h3>

                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-baseline gap-1">
                                                {!isOneTime && (
                                                    <span className="text-xl font-bold text-slate-300 line-through">
                                                        ${(plan.price / 100) + 10}
                                                    </span>
                                                )}
                                                <span className="text-4xl font-extrabold text-slate-900 leading-none">
                                                    ${plan.price / 100}
                                                </span>
                                                {!isOneTime && (
                                                    <span className="text-base font-bold text-slate-400">/mo</span>
                                                )}
                                                {isOneTime && (
                                                    <div className="flex flex-col items-start ml-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                        <span>(one-</span>
                                                        <span>time)</span>
                                                    </div>
                                                )}
                                            </div>

                                            {!isOneTime && (
                                                <div className="mt-3 bg-purple-100/50 text-purple-600 text-[10px] font-black py-1 px-3 rounded-full uppercase tracking-widest">
                                                    Launch Pricing
                                                </div>
                                            )}
                                        </div>

                                        <p className="mt-6 text-slate-500 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                                            {isOneTime ? "Perfect for testing the tool or trying multiple niches. No commitment." :
                                                isPlus ? "Double the videos. Best deal." :
                                                    "Perfect for daily creators."
                                            }
                                        </p>

                                        {!isOneTime && (
                                            <div className="mt-2 text-[11px] font-bold text-slate-900/60 transition-opacity">
                                                Effective cost: <span className="text-slate-900 font-extrabold">${(plan.price / 100 / plan.credits).toFixed(2)} per video</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {getPlanFeatures(plan.name).map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className={cn(
                                                    "mt-1 p-0.5 rounded-full ring-1 ring-offset-1 shrink-0",
                                                    isPlus ? "bg-purple-600 ring-purple-600" : "bg-purple-100 ring-transparent"
                                                )}>
                                                    <Check className={cn("h-2.5 w-2.5", isPlus ? "text-white" : "text-purple-600")} strokeWidth={4} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 leading-tight">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handleSubscribe(plan.stripePriceId)}
                                        disabled={isProcessing !== null}
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300 active:scale-95",
                                            isPlus
                                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200"
                                                : "bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-100 shadow-slate-100"
                                        )}
                                    >
                                        {isProcessing === plan.stripePriceId ? (
                                            <Loader2 className="h-5 w-5 animate-spin p-2" />
                                        ) : (
                                            plan.interval ? (isPlus ? "Join Creator Plus" : "Start Monthly Plan") : "Try the Starter Pack"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="mt-24 text-center">
                    <p className="text-slate-500 font-bold text-sm">
                        Need a custom enterprise solution? <button onClick={() => navigate("/settings/pricing/contact")} className="text-purple-600 hover:underline">Contact Sales</button>
                    </p>
                </div>
            </div>
        </div>
    )
}

function getPlanFeatures(planName: string) {
    if (planName.includes("Plus")) {
        return [
            "60 premium videos per month",
        ];
    }
    if (planName.includes("Starter")) {
        return [
            "10 premium videos",
            "No subscription required",
        ];
    }
    return [
        "30 premium videos per month",
    ];
}
