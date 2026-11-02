// Small helpers shared by the /api/push endpoints (Web Request/Response handlers).
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

/** Requests are tiny (a push subscription is about 500 bytes). */
export const MAX_BODY_BYTES = 4096;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function readBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'body_too_large');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new HttpError(413, 'body_too_large');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, 'invalid_body');
  return parsed.data;
}

/** Wraps a handler: known errors become JSON responses, anything else a generic 500 (no details leaked). */
export function handle(fn: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.code }, err.status);
      console.error('push api error', err instanceof Error ? err.message : err);
      return json({ error: 'server_error' }, 500);
    }
  };
}
