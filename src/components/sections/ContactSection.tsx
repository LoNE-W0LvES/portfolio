import React from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function ContactSection({ settings }: Props) {
  if (!settings?.email && !settings?.linkedin_url) return null

  return (
    <section id="contact" className="section contact-section">
      <div className="section-inner">
        <h2 className="section-title">Contact</h2>
        <p className="contact-intro">Feel free to reach out — I'm always open to new opportunities.</p>
        <div className="contact-links">
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {settings.email}
            </a>
          )}
          {settings.linkedin_url && (
            <a href={settings.linkedin_url} target="_blank" rel="noreferrer" className="contact-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          )}
          {settings?.twitter_url && (
            <a href={settings.twitter_url} target="_blank" rel="noreferrer" className="contact-link">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.853L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
