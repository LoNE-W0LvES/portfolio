import type { Handler } from '@netlify/functions'
import { donationPayload } from '../../server/donations.js'
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json' }
export const handler: Handler = async event => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers }
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  const channel = event.queryStringParameters?.channel === 'website' ? 'website' : 'api'
  try { return { statusCode: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=60, s-maxage=300' }, body: JSON.stringify(await donationPayload(channel)) } }
  catch (error) { return { statusCode: 503, headers, body: JSON.stringify({ schema_version: 1, enabled: false, channel, updated_at: null, methods: [], error: error instanceof Error ? error.message : 'Donation service unavailable' }) } }
}
