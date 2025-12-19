import { useQuery } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useState } from 'react'

interface HealthData {
  status: string;
  message: string;
}

function App() {
  const { isPending, error, data } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/health`).then((res) =>
        res.json(),
      ),
  })

  // Auth state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { data: session } = authClient.useSession()

  const handleSignUp = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    })
    if (error) alert(error.message)
    if (data) alert('Signed up!')
  }

  const handleSignIn = async () => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    })
    if (error) alert(error.message)
    if (data) alert('Signed in!')
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    alert('Signed out!')
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Web App Scaffolding</h1>

      <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground w-full max-w-md mb-4">
        <h2 className="text-2xl font-semibold mb-4">Backend Status</h2>

        {isPending && <p>Loading...</p>}
        {error && <p className="text-destructive">Error: {error.message}</p>}
        {data && (
          <div className="space-y-4">
            <p className="text-muted-foreground">{data.message}</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Status: {data.status}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>

      <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>

        {session ? (
          <div className="space-y-4">
            <p>Welcome, {session.user.name}!</p>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              className="border p-2 w-full rounded bg-background"
              placeholder="Name (for Sign Up)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border p-2 w-full rounded bg-background"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="border p-2 w-full rounded bg-background"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleSignIn}>Sign In</Button>
              <Button variant="outline" onClick={handleSignUp}>Sign Up</Button>
            </div>
            <div className="pt-2 border-t">
              <Button variant="secondary" className="w-full" onClick={handleGoogleSignIn}>
                Sign in with Google
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
