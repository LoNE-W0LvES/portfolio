import type { Handler } from '@netlify/functions'
import usersHandler from '../../api/admin/users.js'
import { runApiHandler } from './_adapter.js'
export const handler: Handler = event => runApiHandler(usersHandler, event)
