import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'node:http'

function localApiPlugin(): Plugin {
  return {
    name: 'local-vercel-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname
        const modules: Record<string, () => Promise<{ default: (req: any, res: any) => unknown }>> = {
          '/api/admin/users': () => import('./api/admin/users'),
          '/api/donate': () => import('./api/donate'),
          '/donate': () => import('./api/donate'),
          '/donation': () => import('./api/donate'),
          '/api/cron/keep-alive': () => import('./api/cron/keep-alive'),
        }
        const loadHandler = modules[pathname]
        if (!loadHandler) return next()

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(Buffer.from(chunk))
          const rawBody = Buffer.concat(chunks).toString('utf8')
          const query = Object.fromEntries(new URL(req.url || '/', 'http://localhost').searchParams)
          const apiReq = Object.assign(req, {
            query,
            body: rawBody ? JSON.parse(rawBody) : undefined,
          })
          const apiRes = Object.assign(res, {
            status(code: number) { res.statusCode = code; return apiRes },
            json(value: unknown) {
              if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(value))
              return apiRes
            },
          })
          await (await loadHandler()).default(apiReq, apiRes)
        } catch (error) {
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Local API failed' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
  return {
  plugins: [localApiPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  }
})
