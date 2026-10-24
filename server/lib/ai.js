import { fail } from './errors.js';
import { ask as askGemini } from './gemini.js';
import { ask as askOpenRouter } from './openrouter.js';

const PROVIDERS = { gemini: askGemini, openrouter: askOpenRouter };

export function ask(system, contents) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const askProvider = PROVIDERS[provider];
  if (!askProvider) throw fail(500, `Unsupported AI_PROVIDER "${provider}". Use gemini or openrouter.`);
  return askProvider(system, contents);
}
