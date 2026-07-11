#!/usr/bin/env python3
"""Fetch a YouTube transcript by driving a real headless browser against
a transcript website (passes Cloudflare/bot checks that plain HTTP fails).

Usage: python scripts/browser_transcript.py <url-or-video-id> [--output-dir DIR]

Requires: pip install playwright
Uses the system Chrome if available (channel="chrome"), so no browser
download is needed on GitHub Actions runners.
"""

import argparse
import re
import sys
import urllib.parse
from datetime import date
from pathlib import Path

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
JUNK_MARKERS = ("blocking us", "we're sorry", "currently blocking", "captcha")


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


def launch_browser(p):
    for kwargs in ({"channel": "chrome"}, {"channel": "chromium"}, {}):
        try:
            return p.chromium.launch(headless=True, **kwargs)
        except Exception:
            continue
    raise RuntimeError("no chromium available")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--output-dir", default="transcripts")
    args = parser.parse_args()
    video_id = extract_video_id(args.video)

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/126.0.0.0 Safari/537.36",
            locale="en-US")
        url = (f"https://youtubetotranscript.com/transcript?v={video_id}"
               "&current_language_code=en")
        print(f"navigating to {url}")
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        try:
            page.wait_for_selector("span.transcript-segment", timeout=45000)
        except Exception:
            body = page.inner_text("body")[:500]
            browser.close()
            sys.exit(f"no transcript segments appeared; page says: {body!r}")

        segs = page.eval_on_selector_all(
            "span.transcript-segment",
            "els => els.map(e => e.textContent.trim()).filter(Boolean)")
        title = ""
        for sel in ("h1", "title"):
            try:
                title = (page.text_content(sel) or "").strip()
            except Exception:
                pass
            if title:
                break
        title = re.sub(r"\s*-\s*YouTube\s*To\s*Transcript.*$", "", title,
                       flags=re.I).strip()
        browser.close()

    text = " ".join(segs)
    if len(text) < 300 or any(m in text.lower() for m in JUNK_MARKERS):
        sys.exit(f"transcript looks like junk ({len(segs)} segs, {len(text)} chars)")

    path = save(video_id, segs, title, Path(args.output_dir))
    print(f"browser: OK — saved {path} ({len(segs)} segments)")


if __name__ == "__main__":
    main()
