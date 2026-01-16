import { FileText, Save, Loader2, Edit3, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SubtitleWord } from "../../../context/editor-creation-context"

interface TranscriptionEditorProps {
    subtitles: SubtitleWord[]
    isEditing: boolean
    isSaving: boolean
    hasUnsavedChanges: boolean
    onStartEditing: () => void
    onCancelEditing: () => void
    onSave: () => void
    onEditWord: (index: number, newText: string) => void
}

export function TranscriptionEditor({
    subtitles,
    isEditing,
    isSaving,
    hasUnsavedChanges,
    onStartEditing,
    onCancelEditing,
    onSave,
    onEditWord
}: TranscriptionEditorProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Transcription</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            {subtitles.length} words detected. 
                            {isEditing 
                                ? " Click on any word to edit it." 
                                : " Click Edit to modify any words."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancelEditing}
                                disabled={isSaving}
                                className="gap-1.5 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={onSave}
                                disabled={isSaving || !hasUnsavedChanges}
                                className="gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onStartEditing}
                            className="gap-1.5 rounded-lg"
                        >
                            <Edit3 className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Unsaved changes warning */}
            {hasUnsavedChanges && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">You have unsaved changes</span>
                </div>
            )}

            {/* Word list */}
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-xl">
                {subtitles.map((word, index) => (
                    <div key={index} className="relative group">
                        {isEditing ? (
                            <input
                                type="text"
                                value={word.text}
                                onChange={(e) => onEditWord(index, e.target.value)}
                                className={cn(
                                    "px-2 py-1 rounded-lg text-sm font-medium border-2 outline-none transition-all",
                                    "bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                                    "min-w-[40px] max-w-[150px]"
                                )}
                                style={{ width: `${Math.max(40, word.text.length * 10)}px` }}
                            />
                        ) : (
                            <span className="inline-block px-2 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700">
                                {word.text}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Timestamp info */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                    Word-level timestamps are preserved. Editing words will not affect timing.
                </p>
            </div>
        </div>
    )
}
