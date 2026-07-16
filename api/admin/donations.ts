import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const fail = (res: any, status: number, error: string) => res.status(status).json({ error })

export default async function handler(req: any, res: any) {
  if (!url || !anonKey || !serviceKey) return fail(res, 500, 'Supabase server environment variables are incomplete.')
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return fail(res, 401, 'Missing access token.')

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  const email = authData.user?.email?.toLowerCase()
  if (authError || !email) return fail(res, 401, 'Invalid or expired session.')
  const { data: caller } = await admin.from('site_user_emails').select('site_users!inner(role)').ilike('email', email).maybeSingle()
  if ((caller as any)?.site_users?.role !== 'admin') return fail(res, 403, 'Admin access required.')

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.from('donation_methods').select('*').order('sort_order')
      if (error) throw error
      return res.status(200).json({ methods: data || [] })
    }
    if (req.method === 'PUT') {
      const methods = Array.isArray(req.body?.methods) ? req.body.methods : null
      if (!methods) return fail(res, 400, 'Methods must be an array.')
      const cleaned = methods.map((row: any, index: number) => ({
        id: String(row.id),
        platform_name: String(row.platform_name || '').trim(),
        payment_url: String(row.payment_url || '').trim(),
        account_name: String(row.account_name || '').trim(),
        description: String(row.description || '').trim(),
        icon_url: String(row.icon_url || '').trim(),
        website_visible: row.website_visible === true,
        api_visible: row.api_visible === true,
        sort_order: index,
      }))
      if (cleaned.some((row: any) => !row.platform_name || !/^https?:\/\//i.test(row.payment_url))) {
        return fail(res, 400, 'Every method needs a platform name and a valid HTTP(S) payment URL.')
      }
      const ids = cleaned.map((row: any) => row.id)
      let deleteQuery = admin.from('donation_methods').delete()
      deleteQuery = ids.length ? deleteQuery.not('id', 'in', `(${ids.join(',')})`) : deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000')
      const { error: deleteError } = await deleteQuery
      if (deleteError) throw deleteError
      if (cleaned.length) {
        const { error: saveError } = await admin.from('donation_methods').upsert(cleaned)
        if (saveError) throw saveError
      }
      const { data: saved, error: readError } = await admin.from('donation_methods').select('*').order('sort_order')
      if (readError) throw readError
      return res.status(200).json({ success: true, methods: saved || [] })
    }
    res.setHeader('Allow', 'GET, PUT')
    return fail(res, 405, 'Method not allowed.')
  } catch (error) {
    return fail(res, 400, error instanceof Error ? error.message : 'Donation operation failed.')
  }
}
