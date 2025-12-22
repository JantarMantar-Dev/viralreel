import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreation } from "../layout"

export default function PlaceholderStep() {
    const { currentStep, prevStep } = useCreation()

    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="p-6 rounded-full bg-purple-100 text-purple-600 mb-6">
                <Zap className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Step {currentStep} is coming soon
            </h2>
            <p className="text-lg text-slate-500 mb-8 max-w-md text-center">
                We're currently building the perfect user experience for this step. Stay tuned!
            </p>
            <Button onClick={prevStep} variant="outline" className="px-8 border-slate-200">
                Back to Previous Step
            </Button>
        </div>
    )
}
