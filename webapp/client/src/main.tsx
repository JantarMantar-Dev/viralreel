import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import posthog from 'posthog-js'
import App from './App'
import './index.css'

posthog.init('phc_Pvxpy70enymJ3fGuvqBDIkZu2G2lbIXqap2uwMHdmdl', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
