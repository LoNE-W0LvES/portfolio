import type { VercelRequest, VercelResponse } from '@vercel/node'
import { donationPayload } from '../server/donations.js'
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const channel = req.query.channel === 'website' ? 'website' : 'api'
  try { return res.status(200).json(await donationPayload(channel)) }
  catch (error) { return res.status(503).json({ schema_version: 1, enabled: false, channel, updated_at: null, methods: [], error: error instanceof Error ? error.message : 'Donation service unavailable' }) }
}
