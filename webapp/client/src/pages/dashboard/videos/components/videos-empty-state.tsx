import { Plus, Sparkles, Video, FileText, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideosEmptyStateProps {
    onCreateNew: () => void
}

export function VideosEmptyState({ onCreateNew }: VideosEmptyStateProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.03)_0%,transparent_70%)] min-h-[calc(100vh-4rem)]">
            {/* Illustration */}
            <div className="relative mb-8">
                <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl shadow-purple-100 flex items-center justify-center border border-slate-50 overflow-hidden">
                    <div className="relative">
                        <Video className="w-12 h-12 text-purple-600 fill-purple-50" />
                        <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
                    </div>
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white rounded-lg shadow-lg border border-slate-50 flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-sm" />
                </div>
                {/* Floating Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-50">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                </div>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                No videos found
            </h2>
            <p className="text-lg text-slate-500 mb-10 max-w-md">
                You haven't created any videos yet. Let's create some! Start your first AI video project now.
            </p>

            <Button
                onClick={onCreateNew}
                className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-8 rounded-2xl shadow-lg shadow-purple-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 text-lg font-semibold mb-16"
            >
                <Plus className="w-6 h-6" />
                Create New Project
            </Button>

            <div className="flex flex-col items-center w-full">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                    Or try a template
                </span>
                <div className="flex gap-4">
                    <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all w-36 group">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Blog Post</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all w-36 group">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Product Ad</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
