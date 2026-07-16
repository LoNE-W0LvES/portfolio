import { createClient } from '@supabase/supabase-js'
export type DonationChannel = 'website' | 'api'
export async function donationPayload(channel: DonationChannel) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase server environment variables are incomplete.')
  const client = createClient(url, key, { auth: { persistSession: false } })
  const [settingsResult, methodsResult] = await Promise.all([
    client.from('donation_settings').select('website_enabled,updated_at').eq('id', true).maybeSingle(),
    client.from('donation_methods').select('*').order('sort_order'),
  ])
  if (settingsResult.error) throw settingsResult.error
  if (methodsResult.error) throw methodsResult.error
  const visible = (methodsResult.data || []).filter(row => channel === 'website' ? row.website_visible : row.api_visible)
  const enabled = visible.length > 0 && (channel === 'api' || settingsResult.data?.website_enabled === true)
  return {
    schema_version: 1, enabled, channel,
    updated_at: [settingsResult.data?.updated_at, ...visible.map(row => row.updated_at)].filter(Boolean).sort().at(-1) || null,
    methods: enabled ? visible.map(({ website_visible: _w, api_visible: _a, sort_order: _s, created_at: _c, updated_at: _u, ...method }) => method) : [],
  }
}
