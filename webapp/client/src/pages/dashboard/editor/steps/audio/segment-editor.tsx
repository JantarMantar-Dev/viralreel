import { Layers, Save, Loader2, Edit3, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScriptSegment } from "../../../context/editor-creation-context"

interface SegmentEditorProps {
    segments: ScriptSegment[]
    isEditing: boolean
    isSaving: boolean
    hasUnsavedChanges: boolean
    onStartEditing: () => void
    onCancelEditing: () => void
    onSave: () => void
    onEditDialogue: (index: number, newDialogue: string) => void
}

export function SegmentEditor({
    segments,
    isEditing,
    isSaving,
    hasUnsavedChanges,
    onStartEditing,
    onCancelEditing,
    onSave,
    onEditDialogue
}: SegmentEditorProps) {
    // Format time from frames to MM:SS
    const formatFrameTime = (frames: number) => {
        const seconds = frames / 30
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Segments</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            {segments.length} scenes identified. 
                            {isEditing 
                                ? " Edit the dialogue for each segment." 
                                : " Click Edit to modify segment dialogue."}
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
                                className="gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Segments
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

            {/* Segments List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {segments.map((segment, index) => (
                    <div 
                        key={index} 
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                                        <Clock className="h-3 w-3" />
                                        {formatFrameTime(segment.start)} - {formatFrameTime(segment.end)}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        ({segment.duration}s)
                                    </span>
                                </div>
                                
                                {isEditing ? (
                                    <textarea
                                        value={segment.dialogue}
                                        onChange={(e) => onEditDialogue(index, e.target.value)}
                                        className="w-full p-3 rounded-lg border-2 border-purple-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none text-sm leading-relaxed resize-none bg-white transition-all"
                                        rows={Math.max(2, Math.ceil(segment.dialogue.length / 60))}
                                    />
                                ) : (
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {segment.dialogue}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
