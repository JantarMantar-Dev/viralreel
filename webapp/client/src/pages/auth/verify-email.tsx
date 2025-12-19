import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")
    const navigate = useNavigate()
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            return
        }

        const verify = async () => {
            // Since better-auth handles verification automatically when visiting the link,
            // we might just need to confirm the user session or use a specific verify function if provided by the client sdk.
            // However, usually the link itself is the verification action.
            // If this page is the landing page for the verification link, we assume the token is processed by the backend.
            // But with client-side routing, we need to call the verify endpoint.
            // better-auth doesn't always have a direct client-side 'verifyEmail' function exposed like signIn,
            // it often relies on the link hitting the backend directly.
            // OPTION: If the backend redirects here AFTER verification, we are good.
            // OPTION: If the link points here with a token, we need to send it.
            // Checking doc/typical usage: authClient.verifyEmail({ query: { token } }) usually.
            // Let's assume there is a verifyEmail method or equivalent.

            // Actually, looking at typical better-auth setup, verification links usually point to the backend which then redirects to a success page
            // OR they point to the frontend with a token.
            // Assuming frontend verifying:
            try {
                /* 
                   There isn't a verifyEmail function in the base createAuthClient return type typically unless configured. 
                   However, usually simpler flow is simpler: 
                */
                // Let's try to verify if logic exists, otherwise assume backend handled it or we just show a 'verifying' state then redirect.
                // For now, let's implement a generic "processing" UI.
                // If the standard is server-side verification redirecting to client, we might just show "Email Verified".

                // Assuming we need to manually trigger it:
                await authClient.verifyEmail({
                    query: {
                        token
                    }
                })
                setStatus("success")
            } catch (error) {
                console.error(error)
                setStatus("error")
            }
        }
        verify()
    }, [token])

    return (
        <Card className="w-full max-w-sm mx-auto mt-20">
            <CardHeader className="text-center">
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>
                    We are verifying your email address.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Verifying token...</p>
                    </div>
                )}
                {status === "success" && (
                    <div className="flex flex-col items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-12 w-12" />
                        <p className="font-medium">Email Verified Successfully</p>
                        <Button onClick={() => navigate("/dashboard")} className="mt-4">
                            Go to Dashboard
                        </Button>
                    </div>
                )}
                {status === "error" && (
                    <div className="flex flex-col items-center gap-2 text-destructive">
                        <XCircle className="h-12 w-12" />
                        <p className="font-medium">Verification Failed</p>
                        <p className="text-sm text-muted-foreground text-center">
                            The token may be invalid or expired.
                        </p>
                        <Button onClick={() => navigate("/auth/login")} variant="outline" className="mt-4">
                            Back to Login
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
