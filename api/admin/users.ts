import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(res: any, status: number, error: string) {
  return res.status(status).json({ error })
}

export default async function handler(req: any, res: any) {
  if (!url || !anonKey || !serviceKey) return fail(res, 500, 'Supabase server environment variables are incomplete.')
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return fail(res, 401, 'Missing access token.')

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  const callerEmail = authData.user?.email?.toLowerCase()
  if (authError || !callerEmail) return fail(res, 401, 'Invalid or expired session.')

  const { data: caller } = await admin.from('site_user_emails').select('site_users!inner(role)').ilike('email', callerEmail).maybeSingle()
  const callerRole = (caller as any)?.site_users?.role
  if (callerRole !== 'admin') return fail(res, 403, 'Admin access required.')

  try {
    if (req.method === 'GET') {
      const [{ data: logicalUsers, error }, { data: authUsers, error: listError }] = await Promise.all([
        admin.from('site_users').select('id, display_name, role, site_user_emails(email, auth_user_id)').order('created_at'),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ])
      if (error) throw error
      if (listError) throw listError
      const authById = new Map(authUsers.users.map(user => [user.id, user]))
      const users = (logicalUsers ?? []).map((user: any) => ({
        id: user.id,
        display_name: user.display_name,
        role: user.role,
        emails: (user.site_user_emails ?? []).map((entry: any) => ({
          email: entry.email,
          verified: !!authById.get(entry.auth_user_id)?.email_confirmed_at,
        })),
      }))
      return res.status(200).json({ users })
    }

    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return fail(res, 400, 'Email is required.')

    if (req.method === 'POST') {
      const password = String(req.body?.password || '')
      const displayName = String(req.body?.display_name || '').trim()
      if (password.length < 8) return fail(res, 400, 'Password must contain at least 8 characters.')
      const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: false })
      if (createError || !created.user) throw createError || new Error('Auth user was not created.')
      const { data: linked } = await admin.from('site_user_emails').select('user_id').eq('auth_user_id', created.user.id).maybeSingle()
      if (linked) {
        const { error } = await admin.from('site_users').update({ display_name: displayName }).eq('id', linked.user_id)
        if (error) throw error
      } else {
        const { data: logical, error: logicalError } = await admin.from('site_users').insert({ display_name: displayName, handle: email.split('@')[0], role: 'user' }).select('id').single()
        if (logicalError) { await admin.auth.admin.deleteUser(created.user.id); throw logicalError }
        const { error: emailError } = await admin.from('site_user_emails').insert({ user_id: logical.id, email, is_primary: true, auth_user_id: created.user.id })
        if (emailError) { await admin.from('site_users').delete().eq('id', logical.id); await admin.auth.admin.deleteUser(created.user.id); throw emailError }
      }
      return res.status(201).json({ success: true })
    }

    const { data: entry, error: entryError } = await admin.from('site_user_emails').select('user_id, auth_user_id, site_users!inner(role)').ilike('email', email).maybeSingle()
    if (entryError || !entry) return fail(res, 404, 'Managed user not found.')
    if ((entry as any).site_users?.role === 'admin') return fail(res, 403, 'Admin accounts cannot be changed here.')

    if (req.method === 'PATCH') {
      if (req.body?.action === 'verify') {
        const { error } = await admin.auth.admin.updateUserById(entry.auth_user_id, { email_confirm: true })
        if (error) throw error
      } else if (req.body?.action === 'reset') {
        const origin = `https://${req.headers.host}`
        const { error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/private-login` })
        if (error) throw error
      } else return fail(res, 400, 'Unknown action.')
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      if (entry.auth_user_id) {
        const { error } = await admin.auth.admin.deleteUser(entry.auth_user_id)
        if (error) throw error
      }
      const { error } = await admin.from('site_users').delete().eq('id', entry.user_id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return fail(res, 405, 'Method not allowed.')
  } catch (error) {
    return fail(res, 400, error instanceof Error ? error.message : 'User operation failed.')
  }
}
