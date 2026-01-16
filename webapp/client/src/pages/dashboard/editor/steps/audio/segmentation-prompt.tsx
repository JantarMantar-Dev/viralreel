import { Scissors, Layers, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SegmentationPromptProps {
    isSegmenting: boolean
    onGenerate: () => void
}

export function SegmentationPrompt({ isSegmenting, onGenerate }: SegmentationPromptProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                    <Scissors className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Next Step: Segmentation</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Break down the script into visual scenes based on the audio timing.
                    </p>
                </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-50 to-white border border-purple-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-purple-100 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                    <Layers className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                    Ready to Create Scenes
                </h4>
                <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
                    The transcription is complete. Now we need to split the story into visual segments (scenes) to prepare for image generation.
                </p>
                <Button
                    onClick={onGenerate}
                    disabled={isSegmenting}
                    size="lg"
                    className="h-14 px-8 text-base font-bold bg-purple-600 hover:bg-purple-700 gap-3 rounded-2xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    {isSegmenting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing Story...
                        </>
                    ) : (
                        <>
                            <Scissors className="h-5 w-5" />
                            Generate Segments
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
