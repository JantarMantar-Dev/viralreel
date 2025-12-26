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
import CreateLayout from "./pages/dashboard/create/layout"
import NicheStep from "./pages/dashboard/create/steps/niche-step"
import ScriptStep from "./pages/dashboard/create/steps/script-step"
import VoiceStep from "./pages/dashboard/create/steps/voice-step"
import MusicStep from "./pages/dashboard/create/steps/music-step"
import SubtitleStep from "./pages/dashboard/create/steps/subtitle-step"
import ReviewStep from "./pages/dashboard/create/steps/review-step"
import SeriesDetailsPage from "./pages/dashboard/series/page"
import PlaceholderStep from "./pages/dashboard/create/steps/placeholder-step"
import NotFoundPage from "./pages/dashboard/not-found"
import PricingPage from "./pages/dashboard/settings/pricing"
import ContactSalesPage from "./pages/dashboard/settings/contact-sales"
import FeedbackPage from "./pages/dashboard/feedback"

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

        {/* Dashboard Routes - No Prefix */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="videos" element={<ProjectsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="videos/series/:id" element={<SeriesDetailsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/account" element={<SettingsPage />} />
          <Route path="settings/billing" element={<SettingsPage />} />
          <Route path="settings/social" element={<SettingsPage />} />
          <Route path="settings/pricing" element={<PricingPage />} />
          <Route path="settings/pricing/contact" element={<ContactSalesPage />} />
          <Route path="create" element={<CreateLayout />}>
            <Route index element={<Navigate to="niche" replace />} />
            <Route path="niche" element={<NicheStep />} />
            <Route path="script" element={<ScriptStep />} />
            <Route path="voice" element={<VoiceStep />} />
            {/* Removed Visuals Route */}
            <Route path="subtitles" element={<SubtitleStep />} />
            <Route path="music" element={<MusicStep />} />
            <Route path="review" element={<ReviewStep />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
