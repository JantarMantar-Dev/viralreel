"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export function WaitlistModal({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (open) {
            setIsLoading(true)
            // Re-run the script when modal opens to ensure iframe resizing
            const script = document.createElement("script")
            script.src = "https://opnform.com/widgets/iframe.min.js"
            script.async = true
            script.onload = () => {
                // @ts-ignore
                if (window.initEmbed) {
                    // @ts-ignore
                    window.initEmbed('email-waitlist-form-x9ev9w', { autoResize: true })
                }
            }
            document.body.appendChild(script)

            return () => {
                document.body.removeChild(script)
            }
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none rounded-2xl">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-center">
                    <DialogTitle className="text-xl font-bold text-white mb-1">Join the Waitlist</DialogTitle>
                    <p className="text-purple-100 text-sm">Get early access to Viral Reel</p>
                </div>
                <div className="p-4 relative min-h-[350px]">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                    )}
                    <iframe
                        style={{ border: 'none', width: '100%', minHeight: '350px' }}
                        id="email-waitlist-form-x9ev9w"
                        src="https://opnform.com/forms/email-waitlist-form-x9ev9w"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
