# TermiAI

Describe what you want to do in plain English and TermiAI writes the command for **PowerShell, Command Prompt, Bash or Termux** — with a one-line explanation, a risk level (read-only / changes things / high risk) and a warning when something deserves one.

**Copy-only by design:** TermiAI never runs anything. You copy the command into your own terminal and decide.

Live: https://termi.praxel.space

## How it works

- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui. History, settings and export live in the browser (`localStorage`).
- **AI:** `api/generate.ts` is a Vercel Function that calls Claude (`claude-opus-5-5` at low effort) with a fixed system prompt and a JSON schema, so every answer comes back as `{ command, explanation, risk, caveat }`. The system prompt is marked for prompt caching. If a safety classifier declines a request, Anthropic's server-side fallback retries it on a recommended model; a full refusal returns a friendly "can't help with that".
- **Guard rails on the function:** same-origin check, input validation (≤ 500 characters, known shell), per-IP rate limit (20 requests / 10 min per instance), and the API key only ever on the server.
- **Demo mode:** when the function isn't available (plain `npm run dev`, or no API key yet), the app falls back to a small keyword lookup and labels those results **Demo**. It never invents command output.

## Setup

```sh
npm install
npm run dev          # UI on http://localhost:8080 (demo mode — the function isn't served)
npm run typecheck
npm run build
```

To try the real AI locally, use `vercel dev` with `ANTHROPIC_API_KEY` set.

### Deploy (Vercel)

1. Import the repo in Vercel (framework preset: Vite).
2. Settings → Environment Variables → add `ANTHROPIC_API_KEY` (Production), from https://console.anthropic.com → API keys. Redeploy.
3. Settings → Domains → add `termi.praxel.space`, then create the CNAME record Vercel shows at your DNS provider.

`vercel.json` adds SPA routing and security headers (CSP, HSTS, no framing).

### Cost

Each request is one short Claude call (a few hundred input tokens, a short JSON answer). Set a monthly spend limit in the Anthropic Console to cap costs; the per-IP rate limit stops a single visitor from running it up.
