// Minimal .env loader — no dependencies.
// Loads KEY=VALUE pairs from a .env file next to the package root (or a given
// path) into process.env without overriding variables that are already set.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv(envPath = path.join(PACKAGE_ROOT, '.env')) {
  if (!fs.existsSync(envPath)) return {};
  const loaded = {};
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    loaded[key] = value;
    if (!(key in process.env)) process.env[key] = value;
  }
  return loaded;
}

export function requireEnv(name, hint = '') {
  const value = process.env[name];
  if (!value || value.startsWith('your_') || value.startsWith('sk_your_')) {
    throw new Error(
      `Missing ${name}. Copy content-pipeline/.env.example to content-pipeline/.env and set it.${hint ? ' ' + hint : ''}`
    );
  }
  return value;
}
