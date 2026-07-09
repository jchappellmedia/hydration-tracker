import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startMockServer } from './mock-server.mjs';
import { KieClient } from '../src/kie.js';
import { LateClient } from '../src/late.js';
import { runPipeline } from '../src/pipeline.js';

function makeClients(mock) {
  const kie = new KieClient({ apiKey: 'test-key', baseUrl: mock.baseUrl, pollIntervalMs: 5, timeoutMs: 5000 });
  const late = new LateClient({ apiKey: 'sk_test', baseUrl: `${mock.baseUrl}/api/v1` });
  return { kie, late };
}

test('image generation via unified jobs API (create → poll → success)', async () => {
  const mock = await startMockServer();
  try {
    const { kie } = makeClients(mock);
    const result = await kie.generateImage({ prompt: 'a glass of water' });
    assert.equal(result.urls.length, 1);
    assert.match(result.urls[0], /result\.png$/);
    assert.match(result.taskId, /^job-task-/);
    // polling actually happened (task required 2 status checks)
    assert.equal(mock.state.tasks.get(result.taskId).polls, 2);
  } finally {
    await mock.close();
  }
});

test('video generation routes veo models to the dedicated Veo API', async () => {
  const mock = await startMockServer();
  try {
    const { kie } = makeClients(mock);
    const result = await kie.generateVideo({ prompt: 'water splash', aspectRatio: '9:16' });
    assert.match(result.taskId, /^veo-task-/);
    assert.match(result.urls[0], /video\.mp4$/);
    assert.equal(mock.state.tasks.get(result.taskId).input.aspectRatio, '9:16');
    assert.equal(mock.state.tasks.get(result.taskId).input.model, 'veo3_fast');
  } finally {
    await mock.close();
  }
});

test('non-veo video models go through the jobs API', async () => {
  const mock = await startMockServer();
  try {
    const { kie } = makeClients(mock);
    const result = await kie.generateVideo({ prompt: 'water splash', model: 'kling/text-to-video' });
    assert.match(result.taskId, /^job-task-/);
    assert.equal(mock.state.tasks.get(result.taskId).input.model, 'kling/text-to-video');
  } finally {
    await mock.close();
  }
});

test('music generation via Suno API returns all track URLs', async () => {
  const mock = await startMockServer();
  try {
    const { kie } = makeClients(mock);
    const result = await kie.generateMusic({ prompt: 'upbeat lofi', instrumental: true });
    assert.equal(result.urls.length, 2);
    assert.equal(result.tracks[0].title, 'Track A');
    assert.equal(mock.state.tasks.get(result.taskId).input.instrumental, true);
  } finally {
    await mock.close();
  }
});

test('speech generation maps text through the jobs API', async () => {
  const mock = await startMockServer();
  try {
    const { kie } = makeClients(mock);
    const result = await kie.generateSpeech({ text: 'Drink water.' });
    const task = mock.state.tasks.get(result.taskId);
    assert.equal(task.input.input.text, 'Drink water.');
    assert.equal(task.input.model, 'elevenlabs/text-to-speech-multilingual-v2');
  } finally {
    await mock.close();
  }
});

test('late client lists accounts, uploads media, and creates posts', async () => {
  const mock = await startMockServer();
  try {
    const { late } = makeClients(mock);
    const accounts = await late.listAccounts();
    assert.equal(accounts.length, 2);

    const tmp = path.join(os.tmpdir(), `cp-test-${process.pid}.png`);
    fs.writeFileSync(tmp, 'fake image bytes');
    const publicUrl = await late.uploadFile(tmp);
    fs.unlinkSync(tmp);
    assert.match(publicUrl, /uploaded-\d+-cp-test/);
    assert.equal(mock.state.uploads.length, 1);

    const targets = await late.resolvePlatformTargets(['instagram', 'tiktok']);
    assert.deepEqual(targets[0], { platform: 'instagram', accountId: 'acc-ig-1' });

    const post = await late.createPost({
      content: 'hello',
      platforms: targets,
      mediaItems: [{ type: 'image', url: publicUrl }],
      publishNow: true,
    });
    assert.equal(post.post.status, 'published');
    assert.equal(mock.state.posts[0].publishNow, true);
  } finally {
    await mock.close();
  }
});

test('resolvePlatformTargets rejects platforms with no connected account', async () => {
  const mock = await startMockServer();
  try {
    const { late } = makeClients(mock);
    await assert.rejects(() => late.resolvePlatformTargets(['youtube']), /No connected youtube account/);
  } finally {
    await mock.close();
  }
});

test('full pipeline: generates, downloads, and posts', async () => {
  const mock = await startMockServer();
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-out-'));
  try {
    const { kie, late } = makeClients(mock);
    const job = {
      name: 'test-run',
      caption: 'caption from job',
      assets: [
        { id: 'img', type: 'image', prompt: 'p1' },
        { id: 'vid', type: 'video', prompt: 'p2' },
        { id: 'track', type: 'music', prompt: 'p3', instrumental: true },
        { id: 'vo', type: 'speech', text: 'p4' },
      ],
      post: { enabled: true, platforms: ['instagram'], mediaFrom: ['vid'], publishNow: true },
    };
    const { manifest, runDir } = await runPipeline({ job, kie, late, outputDir, log: () => {} });

    assert.equal(Object.keys(manifest.assets).length, 4);
    for (const entry of Object.values(manifest.assets)) {
      for (const file of entry.files) {
        assert.ok(fs.existsSync(file), `downloaded file missing: ${file}`);
        assert.ok(fs.statSync(file).size > 0);
      }
    }
    assert.ok(fs.existsSync(path.join(runDir, 'manifest.json')));

    // the post attached only the video, with caption from the job
    assert.equal(mock.state.posts.length, 1);
    const posted = mock.state.posts[0];
    assert.equal(posted.content, 'caption from job');
    assert.equal(posted.mediaItems.length, 1);
    assert.equal(posted.mediaItems[0].type, 'video');
    assert.equal(posted.platforms[0].accountId, 'acc-ig-1');
  } finally {
    await mock.close();
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('dry run makes no network calls and creates no files', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-dry-'));
  try {
    // no mock server at all — dry run must not touch the network
    const kie = new KieClient({ apiKey: 'test', baseUrl: 'http://127.0.0.1:1' });
    const job = {
      name: 'dry',
      assets: [{ type: 'image', prompt: 'x' }],
      post: { enabled: true, platforms: ['instagram'] },
    };
    const result = await runPipeline({ job, kie, late: null, outputDir, dryRun: true, log: () => {} });
    assert.equal(result.dryRun, true);
    assert.equal(fs.readdirSync(outputDir).length, 0);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('failed KIE task surfaces the failure message', async () => {
  const mock = await startMockServer();
  try {
    // monkey-patch: make the mock return a failure by pointing at a task that fails
    const { kie } = makeClients(mock);
    const taskId = await kie.createJobTask('google/nano-banana', { prompt: 'x' });
    // simulate failure state directly
    mock.state.tasks.get(taskId).polls = 99;
    const original = kie.getJobRecord.bind(kie);
    kie.getJobRecord = async () => ({ state: 'fail', failMsg: 'content policy violation' });
    await assert.rejects(() => kie.waitForJob(taskId), /content policy violation/);
    kie.getJobRecord = original;
  } finally {
    await mock.close();
  }
});
