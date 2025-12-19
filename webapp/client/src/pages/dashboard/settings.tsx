import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import posthog from "posthog-js"
import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function SettingsPage() {
    const navigate = useNavigate()

    useEffect(() => {
        posthog.capture("settings_viewed")
    }, [])

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    posthog.capture("user_logged_out")
                    navigate("/auth/login")
                },
            },
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
