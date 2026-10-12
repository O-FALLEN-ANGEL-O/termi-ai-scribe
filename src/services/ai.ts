import { GeneratedCommand, ShellType } from '@/types/terminal';
import { generateDemoCommand } from '@/services/mockAI';

/** An error with a message that is safe to show the user. */
export class GenerationError extends Error {}

const MESSAGES: Record<string, string> = {
  invalid: 'Please describe what you want in under 500 characters.',
  'rate-limited': "You're sending requests quickly. Wait a few minutes and try again.",
  refused: "TermiAI can't help with that request.",
  busy: 'The AI is busy right now. Try again in a moment.',
  incomplete: "The AI couldn't finish that answer. Try rephrasing.",
};

/**
 * Asks the /api/generate function (Claude) for a command. Falls back to the offline
 * keyword demo when the function isn't available — e.g. plain `vite dev`, or no API key.
 */
export async function generateCommand(prompt: string, shell: ShellType): Promise<GeneratedCommand> {
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, shell }),
    });
  } catch {
    return generateDemoCommand(prompt, shell);
  }

  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    return {
      command: String(body.command ?? ''),
      explanation: String(body.explanation ?? ''),
      risk: body.risk === 'high' || body.risk === 'medium' ? body.risk : 'low',
      caveat: String(body.caveat ?? ''),
      source: 'ai',
    };
  }
  if (res.status === 404 || body.error === 'not-configured') return generateDemoCommand(prompt, shell);
  throw new GenerationError(MESSAGES[body.error] ?? 'Something went wrong generating that command. Please try again.');
}
