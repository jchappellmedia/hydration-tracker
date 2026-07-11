#!/usr/bin/env python3
"""Convert yt-dlp caption files (.vtt) into transcript markdown files.

Usage: python scripts/vtt_to_md.py <input-dir-with-vtt> <output-dir>

Used by the transcribe workflow as a fallback when youtube-transcript-api
fails. Deduplicates the overlapping rolling lines that YouTube auto-captions
produce and writes <video_id>-transcript.md in the same format as
scripts/transcribe.py.
"""

import re
import sys
from datetime import date
from pathlib import Path


def vtt_to_text(vtt: str) -> str:
    lines, seen_tail = [], ""
    for raw in vtt.splitlines():
        line = raw.strip()
        if (not line or line == "WEBVTT" or "-->" in line
                or line.startswith(("Kind:", "Language:", "NOTE", "STYLE"))
                or line.isdigit()):
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if not line or line == seen_tail:
            continue
        seen_tail = line
        if lines and (line in lines[-1] or lines[-1] in line):
            lines[-1] = line if len(line) >= len(lines[-1]) else lines[-1]
        else:
            lines.append(line)
    return " ".join(lines)


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
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    in_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    vtt_files = sorted(in_dir.glob("*.vtt"))
    if not vtt_files:
        sys.exit(f"error: no .vtt files in {in_dir}")

    done = set()
    for vtt_path in vtt_files:
        video_id = vtt_path.name.split(".")[0]
        if video_id in done:
            continue
        done.add(video_id)
        text = to_paragraphs(vtt_to_text(vtt_path.read_text(encoding="utf-8")))
        out_path = out_dir / f"{video_id}-transcript.md"
        out_path.write_text(
            "# Video Transcript\n\n"
            f"- **Source:** https://youtu.be/{video_id}\n"
            f"- **Saved:** {date.today().isoformat()}\n\n---\n\n"
            f"{text}\n",
            encoding="utf-8",
        )
        print(f"Saved {out_path}")


if __name__ == "__main__":
    main()
