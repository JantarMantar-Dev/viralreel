import { Volume2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InitialAudioGeneratorProps {
    isSynthesizing: boolean
    isCreatingDraft: boolean
    hasSelectedVoice: boolean
    onGenerate: () => void
}

export function InitialAudioGenerator({ 
    isSynthesizing, 
    isCreatingDraft, 
    hasSelectedVoice, 
    onGenerate 
}: InitialAudioGeneratorProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                    <Volume2 className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Audio Preview</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Generate audio to preview how your video will sound
                    </p>
                </div>
            </div>

            <Button
                onClick={onGenerate}
                disabled={isSynthesizing || !hasSelectedVoice}
                className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl disabled:opacity-50"
            >
                {isSynthesizing ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isCreatingDraft ? "Creating video..." : "Synthesizing Audio..."}
                    </>
                ) : (
                    <>
                        <Volume2 className="h-5 w-5" />
                        Generate Audio
                    </>
                )}
            </Button>
        </div>
    )
}
