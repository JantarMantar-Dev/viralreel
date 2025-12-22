import { CloudUpload, FolderOpen } from "lucide-react"
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
}

export default function UploadMusicDialog({ open, onOpenChange }: UploadMusicDialogProps) {
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
                    <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 flex flex-col items-center justify-center gap-6 bg-slate-50/30 transition-all group-hover:bg-slate-50 group-hover:border-purple-200">
                        <div className="w-16 h-16 rounded-full bg-white shadow-xl shadow-purple-100 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                            <CloudUpload className="h-8 w-8" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">Drag and drop files here</h3>
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

                        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-bold flex items-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95">
                            <FolderOpen className="h-5 w-5" />
                            Browse Files
                        </Button>
                    </div>
                </div>


            </DialogContent>
        </Dialog>
    )
}
