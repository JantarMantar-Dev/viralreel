import { useState, useEffect, useCallback, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_BASE_URL } from "@/lib/config"
import StepHeader from "./step-header"
import { useCreation } from "../context/creation-context"

interface CustomNicheFormProps {
    onBack: () => void
}

export default function CustomNicheForm({ onBack }: CustomNicheFormProps) {
    const { updateRequest, nextStep, setCustomNext, setCustomPrev, setCanContinue, setIsStepLoading } = useCreation()
    const queryClient = useQueryClient()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [tags, setTags] = useState("")

    const { mutate: createNiche, isPending: isCreating } = useMutation({
        mutationFn: async (data: { name: string; description: string; tags: string }) => {
            setIsStepLoading(true)
            const res = await fetch(`${API_BASE_URL}/api/niches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...data,
                    iconName: "Sparkles", // Default for custom niches
                })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to create niche")
            }
            return res.json()
        },
        onSuccess: (newNiche) => {
            setIsStepLoading(false)
            toast.success("Niche created successfully!")
            queryClient.invalidateQueries({ queryKey: ["niches"] })
            updateRequest({
                nicheId: newNiche.id,
                nicheName: newNiche.name
            })
            // Reset custom actions before proceeding
            setCustomNext(undefined)
            setCustomPrev(undefined)
            nextStep(true)
        },
        onError: (err: Error) => {
            setIsStepLoading(false)
            toast.error(err.message)
        }
    })

    const handleSubmit = useCallback(() => {
        if (!name.trim() || !description.trim()) {
            toast.error("Name and description are required")
            return
        }
        createNiche({ name, description, tags })
    }, [name, description, tags, createNiche])

    const isValid = name.trim().length > 0 && description.trim().length > 0

    // Use Refs to keep the handle functions stable for the context overrides
    // This prevents the global layout from re-rendering on every keystroke
    const handleSubmitRef = useRef(handleSubmit)
    const handleBackRef = useRef(onBack)

    useEffect(() => {
        handleSubmitRef.current = handleSubmit
        handleBackRef.current = onBack
    }, [handleSubmit, onBack])

    useEffect(() => {
        const stableNext = () => handleSubmitRef.current()
        const stableBack = () => handleBackRef.current()

        setCustomNext(() => stableNext)
        setCustomPrev(() => stableBack)

        return () => {
            setCustomNext(undefined)
            setCustomPrev(undefined)
            // Note: We don't reset setCanContinue here to avoid another render loop
            // The layout's setCanContinue is already managed by the other effect
        }
    }, [setCustomNext, setCustomPrev])

    useEffect(() => {
        setCanContinue(isValid && !isCreating)
    }, [isValid, isCreating, setCanContinue])

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <div className="mb-8">
                <StepHeader
                    title="Create Your Custom Niche"
                    description="Describe the niche you want to build. Our AI will use this to generate relevant content and scripts."
                />
            </div>

            {/* Custom Niche Form */}
            <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-bold text-slate-900">Niche Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Daily Tech Facts, Stoic Wisdom, Funny Dog Stories"
                            className="h-12 rounded-xl border-slate-200 focus:ring-purple-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-bold text-slate-900">Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what kind of content this niche covers..."
                            className="flex min-h-[120px] w-full rounded-xl border-2 border-slate-100 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags" className="text-base font-bold text-slate-900">Keywords (Optional)</Label>
                        <Input
                            id="tags"
                            name="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g. tech, future, gadgets (comma separated)"
                            className="h-12 rounded-xl border-slate-200 focus:ring-purple-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
