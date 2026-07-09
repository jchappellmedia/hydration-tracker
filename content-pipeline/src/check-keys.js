#!/usr/bin/env node
// Validates both API keys without spending generation credits:
//   - KIE.ai:  GET /api/v1/chat/credit  (free, confirms the key + shows balance)
//   - Late:    GET /api/v1/accounts     (free, confirms the key + lists connected socials)
//
// Run:  node src/check-keys.js

import { loadEnv, requireEnv } from './env.js';
import { KieClient } from './kie.js';
import { LateClient } from './late.js';

loadEnv();

let failed = false;

try {
  const kie = new KieClient({ apiKey: requireEnv('KIE_API_KEY') });
  const credits = await kie.getCredits();
  console.log(`✔ KIE.ai key is valid — credits remaining: ${JSON.stringify(credits)}`);
} catch (err) {
  failed = true;
  console.error(`✘ KIE.ai check failed: ${err.message}`);
}

try {
  const late = new LateClient({ apiKey: requireEnv('LATE_API_KEY') });
  const accounts = await late.listAccounts();
  const list = Array.isArray(accounts) ? accounts : [];
  console.log(`✔ Late key is valid — ${list.length} social account(s) connected`);
  for (const a of list) console.log(`    ${a.platform}: ${a.username ?? a.name ?? a._id ?? a.id}`);
  if (list.length === 0) {
    console.log('    (connect accounts at https://getlate.dev before posting)');
  }
} catch (err) {
  failed = true;
  console.error(`✘ Late check failed: ${err.message}`);
}

process.exitCode = failed ? 1 : 0;
