import { useState, useRef } from "react"
import { API_BASE_URL } from "@/lib/config"
import { CloudUpload, FolderOpen, Loader2, AlertCircle, Music } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadMusicDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUploadSuccess?: () => void
}

export default function UploadMusicDialog({ open, onOpenChange, onUploadSuccess }: UploadMusicDialogProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleUpload(file)
    }

    const handleUpload = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
            setError("Please upload an audio file (MP3, WAV, etc.)")
            return
        }

        // Validate size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError("File size exceeds 50MB limit")
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${API_BASE_URL}/api/music`, {
                method: 'POST',
                body: formData,
                credentials: 'include', // Crucial for session cookie
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to upload file")
            }

            // Success
            onUploadSuccess?.()
            onOpenChange(false)
        } catch (err: any) {
            console.error("Upload error:", err)
            setError(err.message || "Failed to upload file. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-8 gap-8">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-3xl font-extrabold text-center text-slate-900">
                        Upload New Music
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-500 text-base max-w-[500px] mx-auto leading-relaxed">
                        Add your own audio tracks, voiceovers, or sound effects to personalize your video series.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative group">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="audio/*"
                        className="hidden"
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-6 transition-all duration-300",
                            isDragging
                                ? "border-purple-600 bg-purple-50 scale-[1.02]"
                                : "border-slate-200 bg-slate-50/30 group-hover:bg-slate-50 group-hover:border-purple-200",
                            isUploading && "pointer-events-none opacity-50"
                        )}
                    >
                        {isUploading ? (
                            <div className="text-center space-y-4 py-8">
                                <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">Uploading track...</h3>
                                    <p className="text-slate-500 font-medium">Please wait while we process your audio.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={cn(
                                    "w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                    isDragging ? "bg-purple-600 text-white shadow-purple-200" : "bg-white text-purple-600 shadow-purple-100"
                                )}>
                                    <CloudUpload className="h-8 w-8" />
                                </div>

                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {isDragging ? "Drop audio file now" : "Drag and drop files here"}
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-400">
                                        Support for MP3, WAV, AAC, and FLAC.
                                    </p>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        Max file size 50MB
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 w-full max-w-[200px]">
                                    <div className="h-px bg-slate-100 flex-1" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or</span>
                                    <div className="h-px bg-slate-100 flex-1" />
                                </div>

                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-bold flex items-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95"
                                >
                                    <FolderOpen className="h-5 w-5" />
                                    Browse Files
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="font-semibold text-sm">{error}</p>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}
