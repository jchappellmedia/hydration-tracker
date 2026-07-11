#!/usr/bin/env python3
"""Fetch a YouTube video's transcript and save it as a markdown file.

Usage:
    python scripts/transcribe.py <youtube-url-or-video-id> [options]

Examples:
    python scripts/transcribe.py https://youtu.be/y5ks4FhoGfQ
    python scripts/transcribe.py "https://www.youtube.com/watch?v=y5ks4FhoGfQ"
    python scripts/transcribe.py y5ks4FhoGfQ --timestamps
    python scripts/transcribe.py y5ks4FhoGfQ --lang es --output-dir notes

Requires:
    pip install youtube-transcript-api

The transcript comes from YouTube's own captions (manual if available,
otherwise auto-generated). Videos with captions disabled can't be fetched
this way — for those, download the audio with yt-dlp and transcribe it
with Whisper instead:
    yt-dlp -x --audio-format mp3 -o audio.mp3 <url>
    pip install faster-whisper && whisper audio.mp3
"""

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(url_or_id: str) -> str:
    """Accept a bare video ID or any common YouTube URL format."""
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
            # /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
            parts = [p for p in parsed.path.split("/") if p]
            candidate = parts[1] if len(parts) >= 2 else ""
    else:
        candidate = ""

    if not VIDEO_ID_RE.match(candidate):
        sys.exit(f"error: could not extract a video ID from {url_or_id!r}")
    return candidate


def fetch_metadata(video_id: str) -> dict:
    """Get title/channel via YouTube's oEmbed endpoint (no API key needed)."""
    url = (
        "https://www.youtube.com/oembed?format=json&url="
        + urllib.parse.quote(f"https://www.youtube.com/watch?v={video_id}")
    )
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.load(resp)
        return {"title": data.get("title", ""), "channel": data.get("author_name", "")}
    except Exception:
        return {"title": "", "channel": ""}


def fetch_transcript(video_id: str, languages: list[str]) -> list[dict]:
    """Return a list of {text, start} snippets, handling both major
    youtube-transcript-api versions (1.x fetch() and 0.x get_transcript())."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        sys.exit("error: youtube-transcript-api is not installed.\n"
                 "Run: pip install youtube-transcript-api")

    try:
        if hasattr(YouTubeTranscriptApi, "fetch"):  # 1.x instance API
            fetched = YouTubeTranscriptApi().fetch(video_id, languages=languages)
            return [{"text": s.text, "start": s.start} for s in fetched]
        raw = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        return [{"text": s["text"], "start": s["start"]} for s in raw]
    except Exception as exc:
        sys.exit(
            f"error: could not fetch a transcript for {video_id}: {exc}\n"
            "The video may have captions disabled, be private, or not have "
            "captions in the requested language.\n"
            "Fallback: yt-dlp -x --audio-format mp3 <url>, then transcribe "
            "the audio with Whisper."
        )


def format_timestamp(seconds: float) -> str:
    total = int(seconds)
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def build_markdown(video_id: str, meta: dict, snippets: list[dict],
                   timestamps: bool) -> str:
    lines = ["# Video Transcript", ""]
    if meta["title"]:
        lines += [f"- **Title:** {meta['title']}"]
    if meta["channel"]:
        lines += [f"- **Channel:** {meta['channel']}"]
    lines += [
        f"- **Source:** https://youtu.be/{video_id}",
        f"- **Saved:** {date.today().isoformat()}",
        "",
        "---",
        "",
    ]

    if timestamps:
        for s in snippets:
            text = s["text"].replace("\n", " ").strip()
            if text:
                lines.append(f"**[{format_timestamp(s['start'])}]** {text}")
                lines.append("")
    else:
        # Join snippets into flowing text, breaking into paragraphs
        # roughly every ~1000 characters at a sentence boundary.
        text = " ".join(s["text"].replace("\n", " ").strip()
                        for s in snippets if s["text"].strip())
        text = re.sub(r"\s+", " ", text)
        paragraph, length = [], 0
        for sentence in re.split(r"(?<=[.!?]) ", text):
            paragraph.append(sentence)
            length += len(sentence)
            if length > 1000:
                lines += [" ".join(paragraph), ""]
                paragraph, length = [], 0
        if paragraph:
            lines += [" ".join(paragraph), ""]

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Save a YouTube video's transcript as markdown.")
    parser.add_argument("video", help="YouTube URL or 11-character video ID")
    parser.add_argument("--timestamps", action="store_true",
                        help="include a timestamp on each caption line")
    parser.add_argument("--lang", action="append", default=None,
                        help="preferred language code (repeatable), default: en")
    parser.add_argument("--output-dir", default="transcripts",
                        help="directory for the output file (default: transcripts/)")
    args = parser.parse_args()

    video_id = extract_video_id(args.video)
    languages = args.lang or ["en"]

    print(f"Fetching transcript for {video_id} ...")
    snippets = fetch_transcript(video_id, languages)
    meta = fetch_metadata(video_id)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{video_id}-transcript.md"
    out_path.write_text(build_markdown(video_id, meta, snippets,
                                       args.timestamps), encoding="utf-8")

    title = f" — {meta['title']}" if meta["title"] else ""
    print(f"Saved {out_path}{title} ({len(snippets)} caption segments)")


if __name__ == "__main__":
    main()
