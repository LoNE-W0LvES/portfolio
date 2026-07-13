import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { usePortfolio } from './context/PortfolioContext'
import Portfolio from './pages/Portfolio'
import PrivateLogin from './pages/PrivateLogin'
import EditPage from './pages/EditPage'

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { settings } = usePortfolio()

  useEffect(() => {
    const root = document.documentElement
    const theme = settings?.theme ?? 'dark'
    const accent = settings?.accent_color ?? '#3b82f6'

    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--accent-hover', accent + 'dd')
  }, [settings?.theme, settings?.accent_color])

  return <>{children}</>
}

export default function App() {
  return (
    <ThemeApplicator>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/private-login" element={<PrivateLogin />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeApplicator>
  )
}
