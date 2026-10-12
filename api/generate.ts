// Vercel Function: turns a plain-English request into one shell command using Claude.
// Commands are only generated and explained here — nothing is ever executed.
//
// Env (Vercel → Settings → Environment Variables, server-side only):
//   ANTHROPIC_API_KEY — required; never sent to the browser.

import Anthropic from '@anthropic-ai/sdk';

const SHELLS = {
  powershell: 'Windows PowerShell 5.1+ / PowerShell 7',
  cmd: 'Windows Command Prompt (cmd.exe)',
  bash: 'Bash on Linux/macOS',
  termux: 'Termux on Android (bash, with termux-api and pkg available)',
} as const;
type Shell = keyof typeof SHELLS;

const MAX_PROMPT = 500;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
// Best effort only: each warm function instance keeps its own counts.
const hits = new Map<string, number[]>();

// Frozen so it stays a stable, cacheable prefix — no dates, IDs or per-request text.
const SYSTEM_PROMPT = `You are TermiAI, an assistant that translates a user's plain-English request into a single shell command for the shell they selected.

How to answer:
- Produce exactly one command line for the selected shell. Chain steps with the shell's own operators (|, ;, &&) if needed rather than writing a script. Prefer built-in tools that ship with that shell or OS.
- Use the selected shell's real syntax: PowerShell cmdlets for PowerShell, cmd built-ins for Command Prompt, POSIX/GNU tools for Bash, and termux-* / pkg / Android tools for Termux.
- Use clear placeholders in angle brackets (for example <folder>) for anything the user didn't specify, and mention them in the caveat.
- explanation: one or two plain sentences on what the command does.
- risk: "low" for read-only commands; "medium" for commands that change files, settings, packages or processes in a recoverable way; "high" for anything destructive, recursive deletes, disk/partition changes, security-sensitive changes, or anything needing admin/root that could break the system.
- caveat: what the user should know before running it (admin rights, placeholders to fill in, data loss, OS differences). Use an empty string if there is nothing important.
- If the request isn't something a shell command can do, or is unclear, set command to an empty string and use explanation to say what's missing or ask a short clarifying question.
- Never produce commands whose purpose is to harm systems the user doesn't own (malware, credential theft, attacking networks, disabling security on other machines). For those, return an empty command and say briefly that you can't help with it.
- The user copies and runs the command themselves; you never execute anything.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    explanation: { type: 'string' },
    risk: { type: 'string', enum: ['low', 'medium', 'high'] },
    caveat: { type: 'string' },
  },
  required: ['command', 'explanation', 'risk', 'caveat'],
  additionalProperties: false,
} as const;

type Generated = { command: string; explanation: string; risk: 'low' | 'medium' | 'high'; caveat: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Only accept calls made by pages on this same site. */
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

let client: Anthropic | null = null;

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'not-configured' }, 503);
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);

  let body: { prompt?: unknown; shell?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'too-large' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'bad-request' }, 400);
  }
  // Strip control characters (intentional — they have no place in a prompt).
  // eslint-disable-next-line no-control-regex
  const prompt = String(body.prompt ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
  const shell = String(body.shell ?? '') as Shell;
  if (!prompt || prompt.length > MAX_PROMPT || !(shell in SHELLS)) return json({ error: 'invalid' }, 400);

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate-limited' }, 429);

  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4096,
      // Short, focused task: low effort keeps answers fast and cheap.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      // If a safety classifier declines, retry server-side on Anthropic's recommended fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Shell: ${SHELLS[shell]}\nRequest: ${prompt}` }],
    });

    if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
    if (response.stop_reason === 'max_tokens') return json({ error: 'incomplete' }, 502);

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'empty' }, 502);
    const result = JSON.parse(text.text) as Generated;
    return json({ ...result, shell });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic authentication failed — check ANTHROPIC_API_KEY');
      return json({ error: 'not-configured' }, 503);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json({ error: 'upstream' }, 502);
    }
    console.error('Generation failed:', error);
    return json({ error: 'upstream' }, 502);
  }
}

export function GET() {
  return json({ error: 'method-not-allowed' }, 405);
}
