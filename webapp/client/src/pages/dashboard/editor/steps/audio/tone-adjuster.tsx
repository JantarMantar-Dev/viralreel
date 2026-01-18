import { MessageSquare } from "lucide-react"

interface ToneAdjusterProps {
    tonePrompt: string
    onChange: (value: string) => void
}

export function ToneAdjuster({ tonePrompt, onChange }: ToneAdjusterProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                    <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Tone Adjustment (Optional)</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Describe how you want the voice to sound. Leave empty for default tone.
                    </p>
                </div>
            </div>

            <textarea
                value={tonePrompt}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., Speak with a sense of mystery and suspense, pause slightly before revealing key facts..."
                className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none resize-none transition-all text-sm leading-relaxed"
                maxLength={500}
            />
            <div className="flex justify-end mt-2">
                <span className="text-xs text-slate-400">{tonePrompt.length}/500</span>
            </div>
        </div>
    )
}
