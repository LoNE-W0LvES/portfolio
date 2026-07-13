'use client'

import React, { useEffect, useState } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { PortfolioProvider, usePortfolio } from '@/context/PortfolioContext'
import BugOverlay from '@/components/BugOverlay'

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { settings, updateTheme } = usePortfolio()
  const [showBugs, setShowBugs] = useState(false)
  const [prevTheme, setPrevTheme] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const theme = settings?.theme ?? 'dark'
    const accent = settings?.accent_color ?? '#3b82f6'

    root.setAttribute('data-theme', theme)
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--accent-hover', accent + 'dd')

    if (prevTheme === 'dark' && theme === 'light') {
      setShowBugs(true)
    }
    setPrevTheme(theme)
  }, [settings?.theme, settings?.accent_color])

  const keepLight = () => setShowBugs(false)

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <ThemeApplicator>
          {children}
        </ThemeApplicator>
      </PortfolioProvider>
    </AuthProvider>
  )
}
