#!/usr/bin/env python3
"""Fetch a YouTube transcript via public third-party transcript services.

Usage: python scripts/thirdparty_transcript.py <url-or-video-id> [--output-dir DIR]

Last-resort fallback for hosts whose IPs YouTube bot-gates (CI runners,
cloud sandboxes). These services fetch captions through their own
infrastructure. Tries several and uses the first that returns a real
transcript (junk/error responses are rejected).

Stdlib only.
"""

import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
BROWSER_HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
}
JUNK_MARKERS = ("blocking us", "we're sorry", "currently blocking",
                "captcha", "try again later", "unavailable")


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


def http(url, data=None, headers=None, timeout=60):
    req = urllib.request.Request(url, data=data,
                                 headers=headers or dict(BROWSER_HEADERS))
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def via_youtubetotranscript(video_id: str):
    raw = http(f"https://youtubetotranscript.com/transcript?v={video_id}"
               "&current_language_code=en").decode("utf-8", "replace")
    segs = [html.unescape(re.sub(r"<[^>]+>", "", m)).strip()
            for m in re.findall(
                r'<span[^>]*class="[^"]*transcript-segment[^"]*"[^>]*>(.*?)</span>',
                raw, re.S)]
    segs = [s for s in segs if s]
    m = re.search(r"<title>(.*?)</title>", raw, re.S)
    title = html.unescape(m.group(1)).strip() if m else ""
    title = re.sub(r"\s*-\s*YouTube\s*To\s*Transcript.*$", "", title, flags=re.I)
    return segs, title


def via_kome(video_id: str):
    body = json.dumps({"video_id": f"https://www.youtube.com/watch?v={video_id}",
                       "format": True}).encode()
    raw = http("https://kome.ai/api/transcript", data=body,
               headers={"Content-Type": "application/json", "User-Agent": UA,
                        "Origin": "https://kome.ai",
                        "Referer": "https://kome.ai/tools/youtube-transcript-generator"})
    data = json.loads(raw)
    transcript = data.get("transcript") or ""
    return ([transcript] if transcript.strip() else []), ""


def via_notegpt(video_id: str):
    raw = http("https://notegpt.io/api/v2/video-transcript?platform=youtube"
               f"&video_id={video_id}",
               headers={"User-Agent": UA, "Referer": "https://notegpt.io/youtube-transcript-generator"})
    data = json.loads(raw)
    segs = []
    def collect(obj):
        if isinstance(obj, dict):
            if "text" in obj and isinstance(obj["text"], str):
                segs.append(obj["text"].strip())
            for v in obj.values():
                collect(v)
        elif isinstance(obj, list):
            for v in obj:
                collect(v)
    collect(data.get("data", {}))
    return [s for s in segs if s], ""


def via_youtubetranscript_com(video_id: str):
    raw = http(f"https://www.youtubetranscript.com/?server_vid2={video_id}"
               ).decode("utf-8", "replace")
    segs = [html.unescape(t).strip()
            for t in re.findall(r"<text[^>]*>(.*?)</text>", raw, re.S)]
    return [s for s in segs if s], ""


def save(video_id, segs, title, out_dir):
    text = re.sub(r"\s+", " ", " ".join(segs)).strip()
    out, para, length = [], [], 0
    for sentence in re.split(r"(?<=[.!?]) ", text):
        para.append(sentence)
        length += len(sentence)
        if length > 1000:
            out.append(" ".join(para))
            para, length = [], 0
    if para:
        out.append(" ".join(para))
    lines = ["# Video Transcript", ""]
    if title:
        lines.append(f"- **Title:** {title}")
    lines += [f"- **Source:** https://youtu.be/{video_id}",
              f"- **Saved:** {date.today().isoformat()}", "", "---", "",
              "\n\n".join(out), ""]
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{video_id}-transcript.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--output-dir", default="transcripts")
    args = parser.parse_args()
    video_id = extract_video_id(args.video)

    for name, fn in (("youtubetotranscript", via_youtubetotranscript),
                     ("kome.ai", via_kome),
                     ("notegpt", via_notegpt),
                     ("youtubetranscript.com", via_youtubetranscript_com)):
        try:
            segs, title = fn(video_id)
        except Exception as e:
            print(f"{name}: failed ({e})")
            continue
        text = " ".join(segs)
        if not segs or len(text) < 300 or any(m in text.lower() for m in JUNK_MARKERS):
            print(f"{name}: returned no usable transcript "
                  f"({len(segs)} segs, {len(text)} chars)")
            continue
        path = save(video_id, segs, title, Path(args.output_dir))
        print(f"{name}: OK — saved {path} ({len(segs)} segments)")
        return
    sys.exit("all third-party services failed")


if __name__ == "__main__":
    main()
