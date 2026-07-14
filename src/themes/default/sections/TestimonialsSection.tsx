import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import './services-testimonials.css'

export default function TestimonialsSection({ settings }: { settings: PortfolioSettings }) {
  if (!settings.testimonials?.length) return null
  return <section id="testimonials" className="section testimonials-section"><div className="section-inner"><h2 className="section-title">Testimonials</h2><div className="testimonials-grid">{settings.testimonials.map((item,index) => <figure key={`${item.name}-${index}`}><blockquote>“{item.quote}”</blockquote><figcaption>{item.avatar_url && <img src={item.avatar_url} alt=""/>}<span><strong>{item.name}</strong><small>{[item.role,item.company].filter(Boolean).join(' · ')}</small></span></figcaption></figure>)}</div></div></section>
}
