import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import { contactLogo, getContactLinks } from '../../../lib/contacts'

interface Props { settings: PortfolioSettings | null }
export default function ContactSection({ settings }: Props) {
  if (!settings) return null
  const contacts = getContactLinks(settings)
  if (!contacts.length) return null
  return <section id="contact" className="section contact-section"><div className="section-inner"><h2 className="section-title">Get In Touch</h2><p className="contact-intro">Open to opportunities, collaborations, or a friendly chat.</p><div className="contact-grid">{contacts.map((contact,index) => <a key={`${contact.platform_name}-${index}`} href={contact.platform_link} target={contact.platform_link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="contact-card"><div className="contact-card-icon">{contactLogo(contact.platform_link) ? <img src={contactLogo(contact.platform_link)} alt="" width="24" height="24" /> : <b>{contact.platform_name.slice(0,1).toUpperCase()}</b>}</div><span className="contact-card-label"><strong>{contact.platform_name}</strong><small>{contact.platform_username}</small></span><span className="contact-card-arrow">↗</span></a>)}</div></div></section>
}
