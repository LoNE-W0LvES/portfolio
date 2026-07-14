import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, Service, Testimonial } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null; saving: boolean; onSave: (updates: Partial<PortfolioSettings>) => Promise<void> }
const emptyService = (): Service => ({ title: '', description: '', price: '', link: '', link_label: 'Get in touch' })
const emptyTestimonial = (): Testimonial => ({ name: '', role: '', company: '', quote: '', avatar_url: '' })

export default function EditServicesTestimonials({ settings, saving, onSave }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  useEffect(() => { if (settings) { setServices(structuredClone(settings.services ?? [])); setTestimonials(structuredClone(settings.testimonials ?? [])) } }, [settings])
  const service = (i: number, key: keyof Service, value: string) => setServices(current => current.map((item, index) => index === i ? { ...item, [key]: value } : item))
  const testimonial = (i: number, key: keyof Testimonial, value: string) => setTestimonials(current => current.map((item, index) => index === i ? { ...item, [key]: value } : item))
  return <div className="edit-services-panel">
    <div className="edit-section-group"><h3 className="edit-group-title">Services</h3><p className="edit-hint">Describe work visitors can hire you for. Pricing is optional.</p>
      {services.map((item, i) => <div className="edit-edu-card" key={i}><div className="edit-edu-card-header"><span className="edit-edu-num">Service #{i+1}</span><button className="icon-btn icon-btn-danger" onClick={() => setServices(current => current.filter((_, index) => index !== i))}>×</button></div><div className="edit-form-grid">
        <div className="field field-full"><label>Service title</label><input value={item.title} onChange={e => service(i,'title',e.target.value)} placeholder="Web application development"/></div>
        <div className="field field-full"><label>Description</label><textarea rows={4} value={item.description} onChange={e => service(i,'description',e.target.value)} placeholder="What is included and who this is for..."/></div>
        <div className="field"><label>Price / pricing note</label><input value={item.price} onChange={e => service(i,'price',e.target.value)} placeholder="Starting at $500"/></div>
        <div className="field"><label>Button label</label><input value={item.link_label} onChange={e => service(i,'link_label',e.target.value)}/></div>
        <div className="field field-full"><label>Button URL</label><input value={item.link} onChange={e => service(i,'link',e.target.value)} placeholder="mailto:you@example.com or https://..."/></div>
      </div></div>)}<button className="btn-outline" onClick={() => setServices(current => [...current,emptyService()])}>+ Add Service</button>
    </div>
    <div className="edit-section-group"><h3 className="edit-group-title">Testimonials</h3><p className="edit-hint">Add recommendations from clients, employers, or collaborators.</p>
      {testimonials.map((item, i) => <div className="edit-edu-card" key={i}><div className="edit-edu-card-header"><span className="edit-edu-num">Testimonial #{i+1}</span><button className="icon-btn icon-btn-danger" onClick={() => setTestimonials(current => current.filter((_, index) => index !== i))}>×</button></div><div className="edit-form-grid">
        <div className="field field-full"><label>Quote</label><textarea rows={5} value={item.quote} onChange={e => testimonial(i,'quote',e.target.value)} placeholder="Working with..."/></div>
        <div className="field"><label>Name</label><input value={item.name} onChange={e => testimonial(i,'name',e.target.value)}/></div>
        <div className="field"><label>Role</label><input value={item.role} onChange={e => testimonial(i,'role',e.target.value)} placeholder="Product Manager"/></div>
        <div className="field"><label>Company</label><input value={item.company} onChange={e => testimonial(i,'company',e.target.value)}/></div>
        <div className="field"><label>Avatar URL</label><input type="url" value={item.avatar_url} onChange={e => testimonial(i,'avatar_url',e.target.value)} placeholder="https://..."/></div>
      </div></div>)}<button className="btn-outline" onClick={() => setTestimonials(current => [...current,emptyTestimonial()])}>+ Add Testimonial</button>
    </div>
    <div className="edit-form-footer"><button className="btn-primary" disabled={saving} onClick={() => onSave({ services, testimonials })}>{saving ? 'Saving...' : 'Save Services & Testimonials'}</button></div>
  </div>
}
