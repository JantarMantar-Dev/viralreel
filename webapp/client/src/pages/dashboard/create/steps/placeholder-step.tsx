import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreation } from "../layout"

export default function PlaceholderStep() {
    const { currentStep, prevStep } = useCreation()

    return (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-in fade-in zoom-in duration-500">
            <div className="p-4 md:p-6 rounded-full bg-purple-100 text-purple-600 mb-4 md:mb-6">
                <Zap className="h-8 w-8 md:h-12 md:w-12" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4 text-center">
                Step {currentStep} is coming soon
            </h2>
            <p className="text-base md:text-lg text-slate-500 mb-6 md:mb-8 max-w-md text-center px-4">
                We're currently building the perfect user experience for this step. Stay tuned!
            </p>
            <Button onClick={prevStep} variant="outline" className="w-full sm:w-auto px-8 border-slate-200 h-12 rounded-xl">
                Back to Previous Step
            </Button>
        </div>
    )
}
