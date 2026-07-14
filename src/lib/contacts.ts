import type { ContactLink, PortfolioSettings } from './supabase'

export const contactLogo = (link: string) => {
  try { const url = new URL(link); return ['http:','https:'].includes(url.protocol) ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=64` : '' } catch { return '' }
}

export function getContactLinks(settings: PortfolioSettings): ContactLink[] {
  if (settings.contacts?.length) return settings.contacts.filter(contact => contact.platform_name && contact.platform_link)
  return [
    settings.email && { platform_name: 'Email', platform_link: `mailto:${settings.email}`, platform_username: settings.email },
    settings.phone && { platform_name: 'Phone', platform_link: `tel:${settings.phone.replace(/\s/g,'')}`, platform_username: settings.phone },
    settings.whatsapp && { platform_name: 'WhatsApp', platform_link: `https://wa.me/${settings.whatsapp.replace(/\D/g,'')}`, platform_username: settings.whatsapp },
    settings.linkedin_url && { platform_name: 'LinkedIn', platform_link: settings.linkedin_url, platform_username: 'Connect' },
    settings.github_username && { platform_name: 'GitHub', platform_link: `https://github.com/${settings.github_username}`, platform_username: `@${settings.github_username}` },
    settings.discord_username && { platform_name: 'Discord', platform_link: 'https://discord.com/', platform_username: settings.discord_username },
    settings.twitter_url && { platform_name: 'Twitter / X', platform_link: settings.twitter_url, platform_username: 'Follow' },
    settings.website_url && { platform_name: 'Website', platform_link: settings.website_url, platform_username: 'Visit website' },
  ].filter(Boolean) as ContactLink[]
}
