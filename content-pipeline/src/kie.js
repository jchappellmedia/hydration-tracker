// KIE.ai API client — https://docs.kie.ai
//
// KIE exposes two API styles, both used here:
//   1. The unified "jobs" API used by most marketplace models (images, many
//      video models, ElevenLabs speech): POST /api/v1/jobs/createTask then
//      poll GET /api/v1/jobs/recordInfo?taskId=...
//   2. Dedicated APIs for Veo video (/api/v1/veo/*) and Suno music
//      (/api/v1/generate*).
//
// Every response is wrapped as { code, msg, data }; code 200 means success.
// Generation is asynchronous: create a task, then poll until it succeeds or
// fails. Result URLs returned by KIE are temporary — download anything you
// want to keep (see download()).

import fs from 'node:fs';
import path from 'node:path';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export const DEFAULT_MODELS = {
  // See https://kie.ai/market for the full catalog and exact model ids.
  image: 'google/nano-banana',
  video: 'veo3_fast', // served by the dedicated Veo API
  music: 'V4_5', // Suno model version
  speech: 'elevenlabs/text-to-speech-multilingual-v2',
};

export class KieError extends Error {
  constructor(message, { code, taskId, body } = {}) {
    super(message);
    this.name = 'KieError';
    this.code = code;
    this.taskId = taskId;
    this.body = body;
  }
}

export class KieClient {
  constructor({
    apiKey,
    baseUrl = process.env.KIE_BASE_URL || 'https://api.kie.ai',
    pollIntervalMs = 10_000,
    timeoutMs = 20 * 60 * 1000,
    log = () => {},
  } = {}) {
    if (!apiKey) throw new KieError('KIE API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.pollIntervalMs = pollIntervalMs;
    this.timeoutMs = timeoutMs;
    this.log = log;
  }

  async request(apiPath, { method = 'GET', body, query } = {}) {
    const url = new URL(this.baseUrl + apiPath);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json;
    try {
      json = await res.json();
    } catch {
      throw new KieError(`KIE ${method} ${apiPath} returned non-JSON (HTTP ${res.status})`, { code: res.status });
    }
    if (!res.ok || (json.code !== undefined && json.code !== 200)) {
      throw new KieError(`KIE ${method} ${apiPath} failed: ${json.msg ?? res.statusText}`, {
        code: json.code ?? res.status,
        body: json,
      });
    }
    return json;
  }

  async #poll(fetchStatus, taskId) {
    const deadline = Date.now() + this.timeoutMs;
    while (true) {
      const status = await fetchStatus();
      if (status.done) return status;
      if (Date.now() > deadline) {
        throw new KieError(`Timed out after ${this.timeoutMs / 1000}s waiting for task`, { taskId });
      }
      this.log(`  task ${taskId}: ${status.label ?? 'in progress'}…`);
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  // ---- Unified jobs API (images, marketplace video models, speech) ----

  async createJobTask(model, input, callBackUrl) {
    const json = await this.request('/api/v1/jobs/createTask', {
      method: 'POST',
      body: { model, input, ...(callBackUrl ? { callBackUrl } : {}) },
    });
    return json.data.taskId;
  }

  async getJobRecord(taskId) {
    const json = await this.request('/api/v1/jobs/recordInfo', { query: { taskId } });
    return json.data;
  }

  async waitForJob(taskId) {
    const result = await this.#poll(async () => {
      const data = await this.getJobRecord(taskId);
      if (data.state === 'fail') {
        throw new KieError(`Task failed: ${data.failMsg ?? 'unknown error'}`, { taskId, body: data });
      }
      if (data.state === 'success') {
        let parsed = {};
        try {
          parsed = typeof data.resultJson === 'string' ? JSON.parse(data.resultJson) : (data.resultJson ?? {});
        } catch {
          throw new KieError('Task succeeded but resultJson was unparseable', { taskId, body: data });
        }
        return { done: true, urls: parsed.resultUrls ?? [], raw: data };
      }
      return { done: false, label: data.state };
    }, taskId);
    return result;
  }

  async runJob(model, input) {
    this.log(`  creating KIE task (model: ${model})`);
    const taskId = await this.createJobTask(model, input);
    this.log(`  task created: ${taskId}`);
    const { urls, raw } = await this.waitForJob(taskId);
    return { taskId, urls, raw };
  }

  // ---- High-level generators ----

  /** Generate image(s). Extra input fields (aspect_ratio, image_urls, …) pass through. */
  async generateImage({ prompt, model = DEFAULT_MODELS.image, ...input }) {
    return this.runJob(model, { prompt, ...input });
  }

  /**
   * Generate a video. Veo model names (veo3, veo3_fast) use the dedicated Veo
   * API; anything else (e.g. kling/text-to-video, sora-2-text-to-video) goes
   * through the unified jobs API.
   */
  async generateVideo({ prompt, model = DEFAULT_MODELS.video, aspectRatio = '9:16', ...input }) {
    if (!/^veo/i.test(model)) {
      return this.runJob(model, { prompt, aspect_ratio: aspectRatio, ...input });
    }
    this.log(`  creating Veo task (model: ${model})`);
    const created = await this.request('/api/v1/veo/generate', {
      method: 'POST',
      body: { prompt, model, aspectRatio, ...input },
    });
    const taskId = created.data.taskId;
    this.log(`  task created: ${taskId}`);
    const result = await this.#poll(async () => {
      const json = await this.request('/api/v1/veo/record-info', { query: { taskId } });
      const data = json.data;
      // successFlag: 0 = generating, 1 = success, 2/3 = failed
      if (data.successFlag === 1) {
        let urls = data.response?.resultUrls ?? [];
        if (typeof urls === 'string') {
          try { urls = JSON.parse(urls); } catch { urls = [urls]; }
        }
        return { done: true, urls, raw: data };
      }
      if (data.successFlag === 2 || data.successFlag === 3) {
        throw new KieError(`Veo task failed: ${data.errorMessage ?? 'unknown error'}`, { taskId, body: data });
      }
      return { done: false, label: 'generating' };
    }, taskId);
    return { taskId, urls: result.urls, raw: result.raw };
  }

  /**
   * Generate music via Suno. Simple mode: pass a `prompt` describing the song
   * (customMode false). Custom mode: pass customMode: true plus style/title
   * (and prompt as exact lyrics unless instrumental).
   */
  async generateMusic({
    prompt,
    model = DEFAULT_MODELS.music,
    instrumental = false,
    customMode = false,
    style,
    title,
    ...extra
  }) {
    this.log(`  creating Suno task (model: ${model})`);
    const created = await this.request('/api/v1/generate', {
      method: 'POST',
      body: { prompt, model, instrumental, customMode, ...(style ? { style } : {}), ...(title ? { title } : {}), ...extra },
    });
    const taskId = created.data.taskId;
    this.log(`  task created: ${taskId}`);
    const result = await this.#poll(async () => {
      const json = await this.request('/api/v1/generate/record-info', { query: { taskId } });
      const data = json.data;
      const status = data.status;
      if (status === 'SUCCESS') {
        const tracks = data.response?.sunoData ?? [];
        return {
          done: true,
          urls: tracks.map((t) => t.audioUrl).filter(Boolean),
          tracks,
          raw: data,
        };
      }
      if (typeof status === 'string' && (status.includes('FAILED') || status.includes('ERROR'))) {
        throw new KieError(`Suno task failed: ${data.errorMessage ?? status}`, { taskId, body: data });
      }
      return { done: false, label: status };
    }, taskId);
    return { taskId, urls: result.urls, tracks: result.tracks, raw: result.raw };
  }

  /** Text-to-speech via ElevenLabs on the KIE marketplace. */
  async generateSpeech({ text, model = DEFAULT_MODELS.speech, ...input }) {
    return this.runJob(model, { text, ...input });
  }

  /** Remaining credit balance for the account. */
  async getCredits() {
    const json = await this.request('/api/v1/chat/credit');
    return json.data;
  }

  /** Download a result URL to a local file. Returns the destination path. */
  async download(url, destPath) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new KieError(`Download failed (HTTP ${res.status}): ${url}`);
    await streamPipeline(Readable.fromWeb(res.body), fs.createWriteStream(destPath));
    return destPath;
  }
}
