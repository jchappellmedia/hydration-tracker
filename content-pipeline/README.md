# AI Content Generation Pipeline

Generate **video, images, music, and speech** with [KIE.ai](https://kie.ai), then publish to
social media via [Late / Zernio](https://getlate.dev) — from one CLI or a single job file.

Zero dependencies. Requires Node.js ≥ 18.17.

```
content-pipeline/
├── src/
│   ├── cli.js         CLI entry point
│   ├── kie.js         KIE.ai client (jobs API + Veo + Suno)
│   ├── late.js        Late client (accounts, media upload, posts)
│   ├── pipeline.js    orchestrator (generate → download → post)
│   ├── check-keys.js  validates both API keys without spending credits
│   └── env.js         .env loader
├── jobs/              job specs (see example-job.json)
├── test/              mock-server test suite (npm test)
└── output/            generated media + manifests (gitignored)
```

## Setup

```bash
cd content-pipeline
cp .env.example .env
# edit .env and paste your keys:
#   KIE_API_KEY=...    from https://kie.ai/api-key
#   LATE_API_KEY=sk_... from https://getlate.dev

node src/check-keys.js   # verifies both keys (free — no credits spent)
```

> **Never commit `.env`** — it's gitignored. If a key has ever been pasted into a chat,
> issue tracker, or commit, rotate it in the provider's dashboard.

## Usage

### Generate individual assets

```bash
node src/cli.js generate image  "a condensation-covered glass of ice water, golden hour"
node src/cli.js generate video  "slow-motion water splash, vertical" --aspect 9:16
node src/cli.js generate music  "upbeat lofi instrumental, summer morning" --instrumental
node src/cli.js generate speech "Drink a glass of water right now."
```

Files download to `output/`. Override the model per call with `--model`
(catalog: <https://kie.ai/market>), or see defaults with `node src/cli.js models`.

| Type   | Default model                             | API                     |
|--------|-------------------------------------------|-------------------------|
| image  | `google/nano-banana`                      | KIE unified jobs API    |
| video  | `veo3_fast`                               | KIE Veo API             |
| music  | `V4_5`                                    | KIE Suno API            |
| speech | `elevenlabs/text-to-speech-multilingual-v2` | KIE unified jobs API  |

Non-Veo video models (e.g. `kling/text-to-video`, `sora-2-text-to-video`) automatically
route through the unified jobs API.

### Post to social media

```bash
node src/cli.js accounts    # list social accounts connected on Late

# post a local file (uploads via Late) or a URL, immediately:
node src/cli.js post --caption "Stay hydrated 💧" \
  --media output/video-123.mp4 --platforms instagram,tiktok --publish-now

# or schedule it:
node src/cli.js post --caption "Morning reminder" \
  --media https://example.com/reel.mp4 --platforms instagram \
  --schedule 2026-07-10T16:00:00Z --timezone America/New_York
```

Connect your social accounts at <https://getlate.dev> first — the CLI resolves
platform names to your connected account ids automatically.

### Full pipeline (one job file → generated content → social post)

```bash
node src/cli.js run jobs/example-job.json --dry-run   # preview, costs nothing
node src/cli.js run jobs/example-job.json             # generate + (optionally) post
```

A job spec declares the assets to generate and, optionally, a post:

```json
{
  "name": "hydration-daily",
  "caption": "Your body is 60% water — top it up. 💧 #hydration",
  "assets": [
    { "id": "reel",  "type": "video", "prompt": "…", "aspectRatio": "9:16" },
    { "id": "track", "type": "music", "prompt": "…", "instrumental": true }
  ],
  "post": {
    "enabled": true,
    "platforms": ["instagram", "tiktok"],
    "mediaFrom": ["reel"],
    "publishNow": false,
    "scheduledFor": "2026-07-10T16:00:00Z",
    "timezone": "America/New_York"
  }
}
```

- Assets generate **concurrently**; everything downloads to `output/<name>-<timestamp>/`
  with a `manifest.json` recording task ids, URLs, and local files.
- Posting is **off by default** (`post.enabled: false`) so a job never publishes by accident.
- `mediaFrom` picks which generated assets get attached (images/videos only —
  music/speech are downloaded for you to edit into videos with your own tooling).
- Omit both `publishNow` and `scheduledFor` to create a draft in Late.

### Scheduled runs via GitHub Actions

`.github/workflows/content-pipeline.yml` runs the pipeline on demand
(Actions → content-pipeline → Run workflow), defaulting to dry-run. Add repo secrets
`KIE_API_KEY` and `LATE_API_KEY`, flip `dry_run` to false, and uncomment the `schedule`
block for daily automated content.

## Tests

```bash
npm test
```

Runs an end-to-end suite against an in-process mock of both APIs (task polling,
Veo/Suno/jobs routing, media upload, post creation, dry-run, failure handling) —
no network, no credits.

## Notes

- KIE result URLs are **temporary** — the pipeline always downloads generated media locally.
- Generation is asynchronous; the client polls every 10s with a 20-minute timeout
  (configurable via the `KieClient` constructor).
- API docs: [docs.kie.ai](https://docs.kie.ai) · [docs.getlate.dev](https://docs.getlate.dev)
