#!/usr/bin/env python3
"""Download PDFs listed in a queue file and extract their text.

Usage: python scripts/pdf_to_text.py <queue-file> <output-dir>

Each non-empty line of the queue file is a URL to a PDF. The extracted
text is written to <output-dir>/<basename>.txt. Requires: pip install pypdf
"""

import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from pypdf import PdfReader

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    queue, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    if not queue.exists():
        sys.exit(0)

    ok = 0
    for url in [l.strip() for l in queue.read_text().splitlines() if l.strip()]:
        try:
            name = Path(urllib.parse.urlparse(url).path).stem or "document"
            pdf_path = Path("/tmp") / f"{name}.pdf"
            print(f"downloading {url}")
            origin = f"{urllib.parse.urlparse(url).scheme}://{urllib.parse.urlparse(url).netloc}"
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept": "application/pdf,text/plain,*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": origin + "/",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-origin",
                "Upgrade-Insecure-Requests": "1",
            })
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            pdf_path.write_bytes(data)
            print(f"downloaded {len(data)} bytes")

            if data[:5] == b"%PDF-":
                reader = PdfReader(str(pdf_path))
                pages = [(page.extract_text() or "") for page in reader.pages]
                text = "\n\n".join(pages)
                print(f"parsed {len(reader.pages)} PDF pages")
            else:
                text = data.decode("utf-8", "replace")
                print("not a PDF; saved as plain text")
            text = re.sub(r"[ \t]+", " ", text)
            out = out_dir / f"{name}.txt"
            out.write_text(text, encoding="utf-8")
            print(f"saved {out} ({len(text)} chars)")
            ok += 1
        except Exception as exc:
            print(f"FAILED {url}: {exc}")
    if not ok:
        sys.exit("no documents extracted")


if __name__ == "__main__":
    main()
