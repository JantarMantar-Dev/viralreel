import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function PromptEditor({ 
    initialPrompt, 
    onSave,
    className 
}: { 
    initialPrompt: string, 
    onSave: (val: string) => void,
    className?: string 
}) {
    const [prompt, setPrompt] = useState(initialPrompt)

    useEffect(() => {
        setPrompt(initialPrompt)
    }, [initialPrompt])

    return (
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => {
                if (prompt !== initialPrompt) {
                    onSave(prompt)
                }
            }}
            className={cn(
                "w-full min-h-[120px] p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none resize-none transition-all text-sm",
                className
            )}
            placeholder="Describe the image you want for this segment..."
        />
    )
}
