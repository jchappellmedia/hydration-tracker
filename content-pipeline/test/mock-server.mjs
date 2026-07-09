// In-process mock of the KIE.ai and Late APIs for end-to-end testing without
// network access. Tasks succeed after `pollsUntilDone` status checks so the
// polling logic is genuinely exercised.

import http from 'node:http';

export function startMockServer({ pollsUntilDone = 2 } = {}) {
  const state = {
    tasks: new Map(), // taskId -> { kind, polls }
    posts: [],
    uploads: [],
    nextId: 1,
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const json = body && req.headers['content-type']?.includes('json') ? JSON.parse(body) : {};
      const send = (status, payload, contentType = 'application/json') => {
        res.writeHead(status, { 'Content-Type': contentType });
        res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
      };
      const auth = req.headers.authorization ?? '';
      if (!auth.startsWith('Bearer ') && !url.pathname.startsWith('/upload/') && !url.pathname.startsWith('/files/')) {
        return send(401, { code: 401, msg: 'unauthorized' });
      }

      const newTask = (kind) => {
        const taskId = `${kind}-task-${state.nextId++}`;
        state.tasks.set(taskId, { kind, polls: 0, input: json });
        return taskId;
      };
      const poll = (taskId) => {
        const task = state.tasks.get(taskId);
        if (!task) return null;
        task.polls++;
        return task.polls >= pollsUntilDone ? task : false; // false = still running
      };
      const base = `http://localhost:${server.address().port}`;

      // ---- KIE unified jobs API ----
      if (req.method === 'POST' && url.pathname === '/api/v1/jobs/createTask') {
        return send(200, { code: 200, msg: 'success', data: { taskId: newTask('job') } });
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/jobs/recordInfo') {
        const done = poll(url.searchParams.get('taskId'));
        if (done === null) return send(200, { code: 422, msg: 'task not found' });
        if (!done) return send(200, { code: 200, data: { state: 'generating' } });
        return send(200, {
          code: 200,
          data: { state: 'success', resultJson: JSON.stringify({ resultUrls: [`${base}/files/result.png`] }) },
        });
      }

      // ---- KIE Veo API ----
      if (req.method === 'POST' && url.pathname === '/api/v1/veo/generate') {
        return send(200, { code: 200, msg: 'success', data: { taskId: newTask('veo') } });
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/veo/record-info') {
        const done = poll(url.searchParams.get('taskId'));
        if (!done) return send(200, { code: 200, data: { successFlag: 0 } });
        return send(200, {
          code: 200,
          data: { successFlag: 1, response: { resultUrls: [`${base}/files/video.mp4`] } },
        });
      }

      // ---- KIE Suno API ----
      if (req.method === 'POST' && url.pathname === '/api/v1/generate') {
        return send(200, { code: 200, msg: 'success', data: { taskId: newTask('suno') } });
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/generate/record-info') {
        const done = poll(url.searchParams.get('taskId'));
        if (!done) return send(200, { code: 200, data: { status: 'PENDING' } });
        return send(200, {
          code: 200,
          data: {
            status: 'SUCCESS',
            response: {
              sunoData: [
                { audioUrl: `${base}/files/track-a.mp3`, title: 'Track A', duration: 31.2 },
                { audioUrl: `${base}/files/track-b.mp3`, title: 'Track B', duration: 29.8 },
              ],
            },
          },
        });
      }

      // ---- KIE credits ----
      if (req.method === 'GET' && url.pathname === '/api/v1/chat/credit') {
        return send(200, { code: 200, data: 1234.5 });
      }

      // ---- Fake file host (KIE result downloads) ----
      if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
        return send(200, `fake-bytes-for-${url.pathname.slice(7)}`, 'application/octet-stream');
      }

      // ---- Late API ----
      if (req.method === 'GET' && url.pathname === '/api/v1/accounts') {
        return send(200, {
          accounts: [
            { _id: 'acc-ig-1', platform: 'instagram', username: 'hydration.daily' },
            { _id: 'acc-tt-1', platform: 'tiktok', username: 'hydrationdaily' },
          ],
        });
      }
      if (req.method === 'POST' && url.pathname === '/api/v1/media/presign') {
        const id = state.nextId++;
        return send(200, {
          uploadUrl: `${base}/upload/${id}`,
          publicUrl: `${base}/files/uploaded-${id}-${json.filename}`,
        });
      }
      if (req.method === 'PUT' && url.pathname.startsWith('/upload/')) {
        state.uploads.push({ path: url.pathname, bytes: body.length });
        return send(200, '');
      }
      if (req.method === 'POST' && url.pathname === '/api/v1/posts') {
        state.posts.push(json);
        return send(200, { post: { _id: `post-${state.nextId++}`, status: json.publishNow ? 'published' : 'scheduled', ...json } });
      }

      send(404, { code: 404, msg: `mock: no route for ${req.method} ${url.pathname}` });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        state,
        port,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}
