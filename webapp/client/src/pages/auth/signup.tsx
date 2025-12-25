import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import posthog from "posthog-js"

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
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignupPage() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authClient.signUp.email(
                {
                    email,
                    password,
                    name,
                },
                {
                    onSuccess: () => {
                        posthog.capture("user_signed_up", { email, name })
                        toast.success("Account created successfully. Please login.")
                        navigate("/auth/login")
                    },
                    onError: (ctx) => {
                        posthog.capture("signup_failed", { email, error: ctx.error.message })
                        toast.error(ctx.error.message)
                    },
                }
            )
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0"
                        asChild
                    >
                        <a href={import.meta.env.VITE_LENDING_URL || "http://localhost:3001"}>
                            <ArrowLeft className="h-4 w-4" />
                        </a>
                    </Button>
                    <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
                </div>
                <CardDescription className="text-center">
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignup} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="Max Robinson"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
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
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create an account
                    </Button>
                </form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Sign up with Google
                </Button>
            </CardContent>
            <CardFooter>
                <div className="text-center text-sm w-full">
                    Already have an account?{" "}
                    <Link to="/auth/login" className="underline">
                        Sign in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
