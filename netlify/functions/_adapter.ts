import type { HandlerEvent, HandlerResponse } from '@netlify/functions'

type ApiHandler = (req: any, res: any) => unknown | Promise<unknown>

export async function runApiHandler(handler: ApiHandler, event: HandlerEvent): Promise<HandlerResponse> {
  const responseHeaders: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' }
  let statusCode = 200
  let body = ''
  let finished = false

  const req = {
    method: event.httpMethod,
    headers: Object.fromEntries(Object.entries(event.headers).map(([key, value]) => [key.toLowerCase(), value])),
    query: event.queryStringParameters || {},
    body: event.body ? JSON.parse(event.body) : undefined,
  }
  const res: any = {
    status(code: number) { statusCode = code; return res },
    setHeader(name: string, value: string | number | readonly string[]) {
      responseHeaders[name] = Array.isArray(value) ? value.join(', ') : String(value)
      return res
    },
    json(value: unknown) {
      body = JSON.stringify(value)
      finished = true
      return res
    },
    end(value?: unknown) {
      body = value == null ? '' : String(value)
      finished = true
      return res
    },
  }

  await handler(req, res)
  if (!finished && !body) body = JSON.stringify({ success: statusCode >= 200 && statusCode < 300 })
  return { statusCode, headers: responseHeaders, body }
}
