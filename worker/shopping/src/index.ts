// Where-to-buy relay (Cloudflare Worker). The app POSTs one shopping-list item; the Worker asks Claude where
// to buy it on this trip and returns { ok, advice }. The Anthropic API key never leaves Cloudflare.
// Setup: worker/shopping/README.md.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { cleanRequest, SYSTEM_PROMPT, tidyAdvice, userPrompt, WantAdvice, type LookupRequest } from '../../../src/lib/wantAdvice';

export interface Env {
  ANTHROPIC_API_KEY?: string;   // secret
  ALLOWED_ORIGINS: string;      // var, comma-separated, e.g. https://mdigirol.github.io
  MODEL?: string;               // var, defaults to DEFAULT_MODEL below
  LOOKUP_LIMITER?: { limit(o: { key: string }): Promise<{ success: boolean }> };
}

// Not exported: Workers treats every named export of the entry file as an entrypoint, so a string export stops it starting.
const DEFAULT_MODEL = 'claude-opus-5-5';

// The one call to Claude, swappable in tests.
export type Ask = (env: Env, req: LookupRequest) => Promise<{ advice: WantAdvice | null; refused: boolean }>;

export const askClaude: Ask = async (env, req) => {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 });
  const msg = await client.beta.messages.parse({
    model: env.MODEL || DEFAULT_MODEL,
    max_tokens: 4000,
    // A short, factual lookup: low effort keeps it quick and cheap.
    output_config: { effort: 'low', format: betaZodOutputFormat(WantAdvice) },
    // If a safety classifier declines, the API reruns the request on its recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(req) }]
  });
  if (msg.stop_reason === 'refusal') return { advice: null, refused: true };
  return { advice: msg.parsed_output ?? null, refused: false };
};

const cors = (origin: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin'
});

export async function handle(req: Request, env: Env, ask: Ask = askClaude): Promise<Response> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return new Response('Forbidden', { status: 403 });
  const reply = (status: number, data: object) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method' });
  if (!env.ANTHROPIC_API_KEY) return reply(503, { ok: false, error: 'not configured' });

  const ip = req.headers.get('CF-Connecting-IP') ?? '';
  if (env.LOOKUP_LIMITER && !(await env.LOOKUP_LIMITER.limit({ key: ip || 'unknown' })).success) {
    return reply(429, { ok: false, error: 'rate' });
  }

  let body: unknown;
  try { body = JSON.parse(await req.text()); } catch { return reply(400, { ok: false, error: 'json' }); }
  const r = cleanRequest(body);
  if (!r) return reply(400, { ok: false, error: 'invalid' });

  try {
    const { advice, refused } = await ask(env, r);
    if (refused) return reply(422, { ok: false, error: 'declined' });
    if (!advice) return reply(502, { ok: false, error: 'empty' });
    return reply(200, { ok: true, advice: tidyAdvice(advice, r.areas) });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return reply(429, { ok: false, error: 'busy' });
    console.error('Lookup failed', e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return reply(502, { ok: false, error: 'upstream' });
  }
}

export default { fetch: (req: Request, env: Env) => handle(req, env) };
