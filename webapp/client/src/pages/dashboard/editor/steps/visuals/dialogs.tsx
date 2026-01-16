import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Image } from "lucide-react"

export function RegeneratePromptsDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    isAnalyzing 
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isAnalyzing: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate Visual Prompts?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to regenerate all visual prompts? This will overwrite any manual edits you've made to the prompts.
                        <br /><br />
                        <strong>Note:</strong> Existing generated images will be preserved until you choose to regenerate them.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAnalyzing}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700">
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Regenerate Prompts"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function RegenerateImagesDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    isGenerating,
    count
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isGenerating: boolean
    count: number
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate All Images?</DialogTitle>
                    <DialogDescription>
                        You already have {count} generated images. Regenerating all images will overwrite them and cost additional credits.
                        <br /><br />
                        Are you sure you want to proceed?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Yes, Regenerate All"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ImagePreviewDialog({ 
    open, 
    onOpenChange, 
    imageUrl,
    prompt 
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    imageUrl?: string
    prompt: string
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 border-none">
                <div className="relative w-full h-[80vh] flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt="Full preview" 
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-white/50 flex flex-col items-center">
                            <Image className="h-12 w-12 mb-2 opacity-50" />
                            <p>No image generated yet</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-black/50 backdrop-blur-sm absolute bottom-0 left-0 right-0">
                    <p className="text-white/90 text-sm font-medium line-clamp-2">
                        {prompt}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
