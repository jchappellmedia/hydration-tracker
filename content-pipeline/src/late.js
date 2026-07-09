// Late (getlate.dev / Zernio) API client — https://docs.getlate.dev
//
// Late is a unified social posting API (Instagram, TikTok, X/Twitter,
// YouTube, LinkedIn, Facebook, Threads, Reddit, Pinterest, Bluesky, …).
// Auth is a Bearer token (sk_...). Media can be passed as public URLs
// directly in mediaItems, or uploaded first via the presign flow.

import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

export class LateError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'LateError';
    this.status = status;
    this.body = body;
  }
}

export class LateClient {
  constructor({
    apiKey,
    baseUrl = process.env.LATE_BASE_URL || 'https://getlate.dev/api/v1',
    log = () => {},
  } = {}) {
    if (!apiKey) throw new LateError('Late API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.log = log;
  }

  async request(apiPath, { method = 'GET', body } = {}) {
    const res = await fetch(this.baseUrl + apiPath, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      throw new LateError(`Late ${method} ${apiPath} failed (HTTP ${res.status}): ${json.error ?? json.message ?? text}`, {
        status: res.status,
        body: json,
      });
    }
    return json;
  }

  /** Connected social accounts: [{ _id, platform, username, … }] */
  async listAccounts() {
    const json = await this.request('/accounts');
    return json.accounts ?? json.data ?? json;
  }

  async listProfiles() {
    const json = await this.request('/profiles');
    return json.profiles ?? json.data ?? json;
  }

  /** Upload a local file via the presigned-URL flow. Returns its public URL. */
  async uploadFile(filePath) {
    const filename = path.basename(filePath);
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    this.log(`  requesting presigned upload for ${filename}`);
    const presign = await this.request('/media/presign', {
      method: 'POST',
      body: { filename, contentType },
    });
    const uploadUrl = presign.uploadUrl ?? presign.url;
    const publicUrl = presign.publicUrl ?? presign.fileUrl ?? presign.mediaUrl;
    if (!uploadUrl) throw new LateError('Presign response missing uploadUrl', { body: presign });
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: fs.readFileSync(filePath),
    });
    if (!put.ok) throw new LateError(`Media upload failed (HTTP ${put.status})`, { status: put.status });
    this.log(`  uploaded ${filename}`);
    return publicUrl ?? uploadUrl.split('?')[0];
  }

  /**
   * Create a post.
   *   content      caption text
   *   platforms    [{ platform: 'instagram', accountId: '…', platformSpecificData? }]
   *   mediaItems   [{ type: 'image'|'video', url }]
   *   publishNow   true to publish immediately
   *   scheduledFor ISO timestamp (with optional timezone) to schedule
   */
  async createPost({ content, platforms, mediaItems = [], publishNow = false, scheduledFor, timezone, ...extra }) {
    if (!platforms?.length) throw new LateError('createPost requires at least one platform target');
    const body = {
      content,
      platforms,
      mediaItems,
      ...(publishNow ? { publishNow: true } : {}),
      ...(scheduledFor ? { scheduledFor } : {}),
      ...(timezone ? { timezone } : {}),
      ...extra,
    };
    this.log(`  creating Late post for ${platforms.map((p) => p.platform).join(', ')}`);
    return this.request('/posts', { method: 'POST', body });
  }

  /**
   * Resolve platform names (['instagram', 'tiktok']) to platform targets using
   * the account list. Throws if a requested platform has no connected account.
   */
  async resolvePlatformTargets(platformNames) {
    const accounts = await this.listAccounts();
    if (!Array.isArray(accounts)) throw new LateError('Unexpected /accounts response shape', { body: accounts });
    return platformNames.map((name) => {
      const account = accounts.find((a) => a.platform === name);
      if (!account) {
        const available = accounts.map((a) => a.platform).join(', ') || 'none';
        throw new LateError(`No connected ${name} account on Late (connected: ${available})`);
      }
      return { platform: name, accountId: account._id ?? account.id };
    });
  }
}
