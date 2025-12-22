import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-purple-50 p-6 rounded-full mb-6">
                <AlertTriangle className="h-12 w-12 text-purple-600" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Page Not Found
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-md">
                Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
            </p>

            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200">
                <a href="/dashboard">
                    Go to Dashboard
                </a>
            </Button>
        </div>
    )
}
