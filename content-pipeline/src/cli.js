#!/usr/bin/env node
// content-pipeline CLI
//
//   node src/cli.js credits
//   node src/cli.js accounts
//   node src/cli.js generate image  "a glass of water at sunrise" [--model m] [--out dir]
//   node src/cli.js generate video  "cinematic water droplet"     [--aspect 9:16]
//   node src/cli.js generate music  "upbeat lofi about hydration" [--instrumental]
//   node src/cli.js generate speech "Drink water. Feel great."    [--voice id]
//   node src/cli.js post --caption "…" --media <file-or-url> --platforms instagram,tiktok
//                        [--publish-now | --schedule 2026-07-10T16:00:00Z] [--timezone tz]
//   node src/cli.js run jobs/example-job.json [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, requireEnv } from './env.js';
import { KieClient, DEFAULT_MODELS } from './kie.js';
import { LateClient } from './late.js';
import { runPipeline } from './pipeline.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUTPUT_DIR = path.join(PACKAGE_ROOT, 'output');

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function makeKie() {
  return new KieClient({ apiKey: requireEnv('KIE_API_KEY'), log: console.log });
}

function makeLate() {
  return new LateClient({ apiKey: requireEnv('LATE_API_KEY'), log: console.log });
}

function usage() {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 13).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
}

async function main() {
  loadEnv();
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, ...rest] = positional;

  switch (command) {
    case 'credits': {
      const credits = await makeKie().getCredits();
      console.log(`KIE.ai credits remaining: ${JSON.stringify(credits)}`);
      break;
    }

    case 'accounts': {
      const accounts = await makeLate().listAccounts();
      if (!Array.isArray(accounts) || accounts.length === 0) {
        console.log('No social accounts connected on Late yet — connect them at https://getlate.dev');
        break;
      }
      console.log('Connected Late accounts:');
      for (const a of accounts) {
        console.log(`  ${a.platform.padEnd(12)} ${a.username ?? a.name ?? ''}  (id: ${a._id ?? a.id})`);
      }
      break;
    }

    case 'generate': {
      const [type, prompt] = rest;
      if (!type || !prompt) throw new Error('Usage: generate <image|video|music|speech> "<prompt>"');
      const kie = makeKie();
      const outDir = flags.out ?? DEFAULT_OUTPUT_DIR;
      let result;
      if (type === 'image') {
        result = await kie.generateImage({ prompt, model: flags.model, ...(flags.aspect ? { aspect_ratio: flags.aspect } : {}) });
      } else if (type === 'video') {
        result = await kie.generateVideo({ prompt, ...(flags.model ? { model: flags.model } : {}), ...(flags.aspect ? { aspectRatio: flags.aspect } : {}) });
      } else if (type === 'music') {
        result = await kie.generateMusic({ prompt, ...(flags.model ? { model: flags.model } : {}), instrumental: Boolean(flags.instrumental) });
      } else if (type === 'speech' || type === 'audio') {
        result = await kie.generateSpeech({ text: prompt, ...(flags.model ? { model: flags.model } : {}), ...(flags.voice ? { voice: flags.voice } : {}) });
      } else {
        throw new Error(`Unknown type "${type}" (expected image | video | music | speech)`);
      }
      console.log(`Generated ${result.urls.length} file(s):`);
      for (const [i, url] of result.urls.entries()) {
        const ext = path.extname(new URL(url).pathname) || { image: '.png', video: '.mp4', music: '.mp3', speech: '.mp3', audio: '.mp3' }[type];
        const dest = path.join(outDir, `${type}-${Date.now()}${result.urls.length > 1 ? `-${i + 1}` : ''}${ext}`);
        await kie.download(url, dest);
        console.log(`  ${url}\n  → saved to ${path.relative(process.cwd(), dest)}`);
      }
      break;
    }

    case 'post': {
      if (!flags.caption && !flags.media) throw new Error('Usage: post --caption "…" [--media <file-or-url>] --platforms instagram,tiktok');
      if (!flags.platforms) throw new Error('post requires --platforms (comma-separated, e.g. instagram,tiktok)');
      const late = makeLate();
      const platforms = await late.resolvePlatformTargets(String(flags.platforms).split(',').map((s) => s.trim()));
      const mediaItems = [];
      if (flags.media) {
        for (const media of String(flags.media).split(',').map((s) => s.trim())) {
          const isUrl = /^https?:\/\//.test(media);
          const url = isUrl ? media : await late.uploadFile(media);
          const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
          mediaItems.push({ type: isVideo ? 'video' : 'image', url });
        }
      }
      const response = await late.createPost({
        content: flags.caption ?? '',
        platforms,
        mediaItems,
        publishNow: Boolean(flags['publish-now']),
        scheduledFor: flags.schedule,
        timezone: flags.timezone,
      });
      console.log('Post created:', JSON.stringify(response, null, 2));
      break;
    }

    case 'run': {
      const [jobPath] = rest;
      if (!jobPath) throw new Error('Usage: run <job.json> [--dry-run]');
      const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
      const dryRun = Boolean(flags['dry-run']);
      const kie = dryRun ? null : makeKie();
      const late = job.post?.enabled && !dryRun ? makeLate() : null;
      await runPipeline({
        job,
        kie,
        late,
        outputDir: flags.out ?? DEFAULT_OUTPUT_DIR,
        dryRun,
      });
      break;
    }

    case 'models': {
      console.log('Default models (override with --model or per-asset "model" in a job spec):');
      for (const [type, model] of Object.entries(DEFAULT_MODELS)) {
        console.log(`  ${type.padEnd(8)} ${model}`);
      }
      console.log('\nFull catalog: https://kie.ai/market');
      break;
    }

    default:
      usage();
      if (command) {
        console.error(`\nUnknown command: ${command}`);
        process.exitCode = 1;
      }
  }
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exitCode = 1;
});
