import { useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // @ts-ignore
            await authClient.forgetPassword(
                {
                    email,
                    redirectTo: "/auth/reset-password/confirm"
                },
                {
                    onSuccess: () => {
                        setSubmitted(true)
                        toast.success("Password reset link sent to your email.")
                    },
                    onError: (ctx: any) => {
                        toast.error(ctx.error.message)
                    },
                }
            )
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription>
                        We have sent a password reset link to {email}.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild className="w-full" variant="outline">
                        <Link to="/auth/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your email address and we will send you a link to reset your
                    password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleResetPassword} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <div className="text-center text-sm w-full">
                    Remember your password?{" "}
                    <Link to="/auth/login" className="underline">
                        Back to Login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
