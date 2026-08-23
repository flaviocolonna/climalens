/**
 * Shared cache for expensive lookups (e.g. a discovery result per city).
 *
 * Backed by Upstash Redis when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * are set, so all serverless instances — and all users — see the same entries.
 * Without those env vars (local dev without `vercel env pull`, or a deploy
 * where the integration hasn't been added yet) it falls back to an in-process
 * Map, which only dedupes within a single warm instance.
 */
import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const memory = new Map<string, { at: number; value: unknown }>();

export async function cacheGet<T>(key: string, ttlMs: number): Promise<T | null> {
  if (redis) return (await redis.get<T>(key)) ?? null;

  const hit = memory.get(key);
  if (!hit || Date.now() - hit.at >= ttlMs) return null;
  return hit.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: Math.ceil(ttlMs / 1000) });
    return;
  }
  memory.set(key, { at: Date.now(), value });
}
