// Pipeline orchestrator: reads a job spec, generates every asset via KIE.ai
// (concurrently), downloads results locally, then optionally publishes to
// social platforms via Late.
//
// Job spec shape (see jobs/example-job.json):
// {
//   "name": "daily-hydration-reel",
//   "caption": "Post caption text #hashtags",
//   "assets": [
//     { "id": "hero", "type": "image", "prompt": "…", "model": "optional-override" },
//     { "id": "reel", "type": "video", "prompt": "…", "aspectRatio": "9:16" },
//     { "id": "track", "type": "music", "prompt": "…", "instrumental": true },
//     { "id": "voiceover", "type": "speech", "text": "…" }
//   ],
//   "post": {
//     "enabled": false,
//     "platforms": ["instagram", "tiktok"],
//     "mediaFrom": ["reel"],           // asset ids to attach (default: all image/video assets)
//     "publishNow": false,
//     "scheduledFor": "2026-07-10T16:00:00Z",
//     "timezone": "America/New_York"
//   }
// }

import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = { image: '.png', video: '.mp4', music: '.mp3', speech: '.mp3' };
const MEDIA_TYPE = { image: 'image', video: 'video' };

export async function generateAsset(kie, asset) {
  const { type } = asset;
  switch (type) {
    case 'image': {
      const { id, type: _t, ...input } = asset;
      return kie.generateImage(input);
    }
    case 'video': {
      const { id, type: _t, ...input } = asset;
      return kie.generateVideo(input);
    }
    case 'music': {
      const { id, type: _t, ...input } = asset;
      return kie.generateMusic(input);
    }
    case 'speech':
    case 'audio': {
      const { id, type: _t, ...input } = asset;
      if (input.prompt && !input.text) {
        input.text = input.prompt;
        delete input.prompt;
      }
      return kie.generateSpeech(input);
    }
    default:
      throw new Error(`Unknown asset type "${type}" (expected image | video | music | speech)`);
  }
}

export async function runPipeline({ job, kie, late, outputDir, dryRun = false, log = console.log }) {
  if (!job.assets?.length) throw new Error('Job spec has no assets to generate');
  for (const [i, asset] of job.assets.entries()) {
    asset.id ??= `${asset.type}-${i}`;
  }

  const runDir = path.join(outputDir, `${job.name ?? 'job'}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  const manifest = { job, startedAt: new Date().toISOString(), assets: {}, post: null };

  if (dryRun) {
    log('[dry-run] Would generate:');
    for (const asset of job.assets) {
      log(`  - ${asset.id} (${asset.type}): ${JSON.stringify(asset.prompt ?? asset.text ?? '').slice(0, 100)}`);
    }
    if (job.post?.enabled) {
      log(`[dry-run] Would post to: ${job.post.platforms?.join(', ')} (${job.post.publishNow ? 'immediately' : job.post.scheduledFor ? `scheduled ${job.post.scheduledFor}` : 'as draft'})`);
    } else {
      log('[dry-run] Posting disabled (post.enabled is false)');
    }
    return { dryRun: true, manifest };
  }

  // 1. Generate all assets concurrently.
  log(`Generating ${job.assets.length} asset(s)…`);
  const results = await Promise.all(
    job.assets.map(async (asset) => {
      log(`[${asset.id}] starting ${asset.type} generation`);
      const result = await generateAsset(kie, asset);
      log(`[${asset.id}] done — ${result.urls.length} file(s)`);
      return { asset, result };
    })
  );

  // 2. Download everything locally so results survive KIE's temporary URLs.
  fs.mkdirSync(runDir, { recursive: true });
  for (const { asset, result } of results) {
    const files = [];
    for (const [i, url] of result.urls.entries()) {
      const ext = path.extname(new URL(url).pathname) || EXTENSIONS[asset.type] || '';
      const dest = path.join(runDir, `${asset.id}${result.urls.length > 1 ? `-${i + 1}` : ''}${ext}`);
      log(`[${asset.id}] downloading → ${path.relative(process.cwd(), dest)}`);
      await kie.download(url, dest);
      files.push(dest);
    }
    manifest.assets[asset.id] = { type: asset.type, taskId: result.taskId, urls: result.urls, files };
  }

  // 3. Optionally publish via Late.
  if (job.post?.enabled) {
    if (!late) throw new Error('Job has post.enabled but no Late client configured (set LATE_API_KEY)');
    const post = job.post;
    const mediaAssetIds =
      post.mediaFrom ?? job.assets.filter((a) => MEDIA_TYPE[a.type]).map((a) => a.id);
    const mediaItems = mediaAssetIds.flatMap((id) => {
      const entry = manifest.assets[id];
      if (!entry) throw new Error(`post.mediaFrom references unknown asset id "${id}"`);
      if (!MEDIA_TYPE[entry.type]) throw new Error(`Asset "${id}" is ${entry.type}; only image/video can be attached to posts`);
      return entry.urls.map((url) => ({ type: MEDIA_TYPE[entry.type], url }));
    });
    const platforms = await late.resolvePlatformTargets(post.platforms ?? []);
    const response = await late.createPost({
      content: post.caption ?? job.caption ?? '',
      platforms,
      mediaItems,
      publishNow: post.publishNow ?? false,
      scheduledFor: post.scheduledFor,
      timezone: post.timezone,
    });
    manifest.post = { platforms: post.platforms, mediaItems, response };
    log(`Posted to Late (${post.publishNow ? 'published now' : post.scheduledFor ? `scheduled for ${post.scheduledFor}` : 'draft'})`);
  }

  manifest.finishedAt = new Date().toISOString();
  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log(`Manifest written → ${path.relative(process.cwd(), manifestPath)}`);
  return { runDir, manifest };
}
