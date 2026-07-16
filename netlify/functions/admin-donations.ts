import type { Handler } from '@netlify/functions'
import donationsHandler from '../../api/admin/donations.js'
import { runApiHandler } from './_adapter.js'
export const handler: Handler = event => runApiHandler(donationsHandler, event)
