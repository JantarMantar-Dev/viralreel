import { createContext, useContext, ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

type Session = typeof authClient.$Infer.Session

interface AuthContextType {
    session: Session | null
    isPending: boolean
    error: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, isPending, error } = authClient.useSession()

    return (
        <AuthContext.Provider value={{ session, isPending, error }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
