import React, { useEffect, useState } from 'react'
import type { ContactLink, PortfolioSettings } from '../../lib/supabase'
import { contactLogo, getContactLinks } from '../../lib/contacts'

interface Props { settings: PortfolioSettings | null; saving: boolean; onSave: (updates: Partial<PortfolioSettings>) => Promise<void> }
const empty = (): ContactLink => ({ platform_name: '', platform_link: '', platform_username: '' })

export default function EditContacts({ settings, saving, onSave }: Props) {
  const [contacts, setContacts] = useState<ContactLink[]>([])
  useEffect(() => { if (settings) setContacts(JSON.parse(JSON.stringify(getContactLinks(settings)))) }, [settings])
  const update = (index: number, key: keyof ContactLink, value: string) => setContacts(items => items.map((item, i) => i === index ? { ...item, [key]: value } : item))
  return <div className="edit-edu-panel">
    <p className="edit-hint">Add as many contact platforms as you want. The platform logo is detected from its link.</p>
    {contacts.map((contact, index) => <div className="edit-edu-card" key={index}>
      <div className="edit-edu-card-header"><div className="contact-edit-heading">{contactLogo(contact.platform_link) ? <img src={contactLogo(contact.platform_link)} alt="" /> : <span>{contact.platform_name.slice(0,1).toUpperCase() || '?'}</span>}<b>{contact.platform_name || `Contact #${index+1}`}</b></div><button type="button" className="icon-btn icon-btn-danger" onClick={() => setContacts(items => items.filter((_, i) => i !== index))} aria-label="Remove contact">×</button></div>
      <div className="edit-form-grid"><div className="field"><label>Platform Name</label><input value={contact.platform_name} onChange={e => update(index,'platform_name',e.target.value)} placeholder="LinkedIn" /></div><div className="field"><label>Platform Username</label><input value={contact.platform_username} onChange={e => update(index,'platform_username',e.target.value)} placeholder="@username" /></div><div className="field field-full"><label>Platform Link</label><input type="url" value={contact.platform_link} onChange={e => update(index,'platform_link',e.target.value)} placeholder="https://linkedin.com/in/username" /></div></div>
    </div>)}
    <button type="button" className="btn-outline" onClick={() => setContacts(items => [...items, empty()])}>+ Add Contact</button>
    <div className="edit-form-footer"><button type="button" className="btn-primary" disabled={saving} onClick={() => onSave({ contacts })}>{saving ? 'Saving…' : 'Save Contacts'}</button></div>
  </div>
}
