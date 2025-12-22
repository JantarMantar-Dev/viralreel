import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"

import AuthLayout from "./pages/auth/layout"
import LoginPage from "./pages/auth/login"
import SignupPage from "./pages/auth/signup"
import ResetPasswordPage from "./pages/auth/reset-password"
import VerifyEmailPage from "./pages/auth/verify-email"

import DashboardLayout from "./pages/dashboard/layout"
import DashboardPage from "./pages/dashboard/page"
import ProjectsPage from "./pages/dashboard/videos/page"
import SettingsPage from "./pages/dashboard/settings"
import CreateVideoPage from "./pages/dashboard/create/page"
import NotFoundPage from "./pages/dashboard/not-found"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="videos" element={<ProjectsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/dashboard/create" element={<CreateVideoPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
