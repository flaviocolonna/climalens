/**
 * Vercel serverless entry point. The API key lives here, server-side —
 * it must never reach the browser bundle.
 */
import { handleDiscovery } from './_lib/handler';
import { SERVER_TEXT } from './_lib/serverText';

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    // Prima ancora di leggere il corpo: non c'è una lingua da scegliere, si
    // usa l'inglese come per ogni default di infrastruttura in questo progetto.
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: SERVER_TEXT.en.methodNotAllowed });
    return;
  }
  const { status, body } = await handleDiscovery(req.body, clientIp(req));
  res.status(status).json(body);
}
