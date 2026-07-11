#!/usr/bin/env python3
"""Fetch a YouTube transcript via the Innertube API (no API key needed).

Usage: python scripts/innertube_transcript.py <url-or-video-id> [options]

Talks directly to YouTube's internal JSON API — the same one the site's
"Show transcript" panel uses. This avoids the watch-page scrape that
youtube-transcript-api relies on, which is more aggressively bot-gated
on datacenter IPs.

Flow: POST /youtubei/v1/next (video metadata + transcript panel token)
      POST /youtubei/v1/get_transcript (the segments themselves)

Stdlib only — no dependencies.
"""

import argparse
import json
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
CLIENT_VERSION = "2.20260620.05.00"


def extract_video_id(url_or_id: str) -> str:
    if VIDEO_ID_RE.match(url_or_id):
        return url_or_id
    parsed = urllib.parse.urlparse(url_or_id)
    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")
    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
    elif host in ("youtube.com", "youtube-nocookie.com"):
        if parsed.path == "/watch":
            candidate = urllib.parse.parse_qs(parsed.query).get("v", [""])[0]
        else:
            parts = [p for p in parsed.path.split("/") if p]
            candidate = parts[1] if len(parts) >= 2 else ""
    else:
        candidate = ""
    if not VIDEO_ID_RE.match(candidate):
        sys.exit(f"error: could not extract a video ID from {url_or_id!r}")
    return candidate


def innertube(host: str, endpoint: str, body: dict, cafile: str | None) -> dict:
    ctx = ssl.create_default_context(cafile=cafile) if cafile else None
    req = urllib.request.Request(
        f"{host}/youtubei/v1/{endpoint}?prettyPrint=false",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Origin": "https://www.youtube.com",
            "X-YouTube-Client-Name": "1",
            "X-YouTube-Client-Version": CLIENT_VERSION,
        })
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        return json.load(resp)


def walk(obj, key):
    """Yield every value of `key` anywhere in a nested json structure."""
    if isinstance(obj, dict):
        if key in obj:
            yield obj[key]
        for v in obj.values():
            yield from walk(v, key)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v, key)


def runs_text(node: dict) -> str:
    if not node:
        return ""
    if "simpleText" in node:
        return node["simpleText"]
    return "".join(r.get("text", "") for r in node.get("runs", []))


def format_timestamp(ms: int) -> str:
    total = ms // 1000
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def to_paragraphs(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    out, para, length = [], [], 0
    for sentence in re.split(r"(?<=[.!?]) ", text):
        para.append(sentence)
        length += len(sentence)
        if length > 1000:
            out.append(" ".join(para))
            para, length = [], 0
    if para:
        out.append(" ".join(para))
    return "\n\n".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch a YouTube transcript via the Innertube API.")
    parser.add_argument("video", help="YouTube URL or 11-character video ID")
    parser.add_argument("--host", default="https://www.youtube.com",
                        help="Innertube API host (default: https://www.youtube.com)")
    parser.add_argument("--cafile", default=None,
                        help="CA bundle for TLS verification, if needed")
    parser.add_argument("--timestamps", action="store_true",
                        help="include a timestamp on each line")
    parser.add_argument("--output-dir", default="transcripts")
    args = parser.parse_args()

    video_id = extract_video_id(args.video)
    context = {"client": {"clientName": "WEB", "clientVersion": CLIENT_VERSION,
                          "hl": "en", "gl": "US"}}

    print(f"Fetching video info for {video_id} ...")
    nxt = innertube(args.host, "next",
                    {"context": context, "videoId": video_id}, args.cafile)

    title = channel = ""
    for node in walk(nxt, "videoPrimaryInfoRenderer"):
        title = runs_text(node.get("title", {}))
        break
    for node in walk(nxt, "videoOwnerRenderer"):
        channel = runs_text(node.get("title", {}))
        break

    params = None
    for node in walk(nxt, "getTranscriptEndpoint"):
        params = node.get("params")
        if params:
            break
    if not params:
        sys.exit("error: no transcript panel found — the video likely has "
                 "no captions, or the response was gated.")

    print("Fetching transcript segments ...")
    tr = innertube(args.host, "get_transcript",
                   {"context": context, "params": params}, args.cafile)

    segments = []
    for node in walk(tr, "transcriptSegmentRenderer"):
        text = runs_text(node.get("snippet", {})).strip()
        if text:
            segments.append({"text": text,
                             "start_ms": int(node.get("startMs", 0))})
    if not segments:
        sys.exit("error: transcript response contained no segments.")

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{video_id}-transcript.md"

    lines = ["# Video Transcript", ""]
    if title:
        lines.append(f"- **Title:** {title}")
    if channel:
        lines.append(f"- **Channel:** {channel}")
    lines += [f"- **Source:** https://youtu.be/{video_id}",
              f"- **Saved:** {date.today().isoformat()}", "", "---", ""]
    if args.timestamps:
        for s in segments:
            lines.append(f"**[{format_timestamp(s['start_ms'])}]** {s['text']}")
            lines.append("")
    else:
        lines.append(to_paragraphs(" ".join(s["text"] for s in segments)))
        lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Saved {out_path} — {title or video_id} ({len(segments)} segments)")


if __name__ == "__main__":
    main()
