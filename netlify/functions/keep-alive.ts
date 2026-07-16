import type { Handler } from '@netlify/functions'
import keepAliveHandler from '../../api/cron/keep-alive.js'
import { runApiHandler } from './_adapter.js'
export const handler: Handler = event => runApiHandler(keepAliveHandler, event)
