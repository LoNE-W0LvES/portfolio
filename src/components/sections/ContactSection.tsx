import React from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function ContactSection({ settings }: Props) {
  if (!settings?.email && !settings?.linkedin_url && !settings?.phone) return null

  const links = [
    settings?.email && { href: `mailto:${settings.email}`, label: settings.email, icon: 'mail', type: 'email' },
    settings?.phone && { href: `tel:${settings.phone.replace(/\s/g,'')}`, label: settings.phone, icon: 'phone', type: 'phone' },
    settings?.whatsapp && { href: `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g,'')}`, label: 'WhatsApp', icon: 'message', type: 'whatsapp' },
    settings?.linkedin_url && { href: settings.linkedin_url, label: 'LinkedIn', icon: 'linkedin', type: 'linkedin', external: true },
    settings?.github_username && { href: `https://github.com/${settings.github_username}`, label: `@${settings.github_username}`, icon: 'github', type: 'github', external: true },
    settings?.twitter_url && { href: settings.twitter_url, label: 'Twitter / X', icon: 'twitter', type: 'twitter', external: true },
  ].filter(Boolean) as { href: string; label: string; icon: string; type: string; external?: boolean }[]

  return (
    <section id="contact" className="section contact-section">
      <div className="section-inner">
        <h2 className="section-title">Get In Touch</h2>
        <p className="contact-intro">
          Open to new opportunities, collaborations, or just a friendly chat. Feel free to reach out!
        </p>
        <div className="contact-grid">
          {links.map(link => (
            <a
              key={link.type}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
              className="contact-card"
            >
              <div className="contact-card-icon">
                <ContactIcon type={link.icon} />
              </div>
              <span className="contact-card-label">{link.label}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="contact-card-arrow"><path d="M7 17L17 7M7 7h10v10"/></svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactIcon({ type }: { type: string }) {
  switch (type) {
    case 'mail': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    case 'phone': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 10.77 19.79 19.79 0 01.43 2.18 2 2 0 012.42 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    case 'message': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    case 'linkedin': return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    case 'github': return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
    case 'twitter': return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.853L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    default: return null
  }
}
