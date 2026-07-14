import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { usePortfolio } from './context/PortfolioContext'
import Portfolio from './pages/Portfolio'
import PrivateLogin from './pages/PrivateLogin'
import EditPage from './pages/EditPage'
import BugOverlay from './components/BugOverlay'

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { settings, updateTheme } = usePortfolio()
  const [showBugs, setShowBugs] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const theme = settings?.theme ?? 'dark'
    const accent = settings?.accent_color ?? '#3b82f6'

    root.setAttribute('data-theme', theme)
    root.setAttribute('lang', settings?.preferred_language ?? 'en')
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--accent-hover', accent + 'dd')

    const bugsEnabled = settings?.viewer_theme === 'default' && settings?.show_light_mode_bugs === true
    setShowBugs(theme === 'light' && bugsEnabled)
  }, [settings?.theme, settings?.accent_color, settings?.viewer_theme, settings?.show_light_mode_bugs, settings?.preferred_language])

  const keepLight = () => setShowBugs(true)

  const switchDark = async () => {
    setShowBugs(false)
    await updateTheme('dark')
  }

  return (
    <>
      {children}
      {showBugs && <BugOverlay onKeepLight={keepLight} onSwitchDark={switchDark} />}
    </>
  )
}

export default function App() {
  return (
    <ThemeApplicator>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/login" element={<PrivateLogin />} />
        <Route path="/:username/edit" element={<EditPage />} />
        <Route path="/:username" element={<Portfolio />} />
        <Route path="/:username/" element={<Portfolio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeApplicator>
  )
}
