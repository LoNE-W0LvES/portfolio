import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import './services-testimonials.css'

export default function ServicesSection({ settings }: { settings: PortfolioSettings }) {
  if (!settings.services?.length) return null
  return <section id="services" className="section services-section"><div className="section-inner"><h2 className="section-title">Services</h2><div className="services-grid">{settings.services.map((item,index) => <article key={`${item.title}-${index}`}><span>{String(index+1).padStart(2,'0')}</span><h3>{item.title}</h3><p>{item.description}</p>{item.price && <strong>{item.price}</strong>}{item.link && <a className="btn-outline" href={item.link} target={item.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{item.link_label || 'Get in touch'} ↗</a>}</article>)}</div></div></section>
}
