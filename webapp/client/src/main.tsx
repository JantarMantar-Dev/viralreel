import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import App from './App'
import { AuthProvider } from './context/auth-context'
import './index.css'

posthog.init('phc_Pvxpy70enymJ3fGuvqBDIkZu2G2lbIXqap2uwMHdmdl', {
  api_host: 'https://us.i.posthog.com',
})

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Action failed';
      toast.error(message);
    },
  }),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
