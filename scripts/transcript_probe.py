#!/usr/bin/env python3
"""Diagnostic probe: try every known route to a YouTube transcript and
report what works. Meant to run in CI where the network is open.

Usage: python scripts/transcript_probe.py <video-id>

If any route succeeds it writes transcripts/<video_id>-transcript.md
so the calling workflow can commit it.
"""

import http.cookiejar
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

VIDEO_ID = sys.argv[1] if len(sys.argv) > 1 else "gGmM-Oo4_WA"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def http_call(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()


def section(name):
    print(f"\n===== {name} =====", flush=True)


def walk(obj, key):
    if isinstance(obj, dict):
        if key in obj:
            yield obj[key]
        for v in obj.values():
            yield from walk(v, key)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v, key)


def save_segments(segments, title="", channel=""):
    text = re.sub(r"\s+", " ", " ".join(segments)).strip()
    out, para, length = [], [], 0
    for sentence in re.split(r"(?<=[.!?]) ", text):
        para.append(sentence)
        length += len(sentence)
        if length > 1000:
            out.append(" ".join(para))
            para, length = [], 0
    if para:
        out.append(" ".join(para))
    body = "\n\n".join(out)
    lines = ["# Video Transcript", ""]
    if title:
        lines.append(f"- **Title:** {title}")
    if channel:
        lines.append(f"- **Channel:** {channel}")
    lines += [f"- **Source:** https://youtu.be/{VIDEO_ID}",
              f"- **Saved:** {date.today().isoformat()}", "", "---", "", body, ""]
    Path("transcripts").mkdir(exist_ok=True)
    path = Path("transcripts") / f"{VIDEO_ID}-transcript.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"SAVED {path} ({len(segments)} segments)")


# ---- 1. watch page ----
section("watch page")
status, html_bytes = http_call(
    f"https://www.youtube.com/watch?v={VIDEO_ID}&bpctr=9999999999&has_verified=1",
    headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9",
             "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+678; SOCS=CAISNQgQEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnPpwY"})
html = html_bytes.decode("utf-8", "replace") if status == 200 else ""
print("status:", status, "len:", len(html_bytes))
print("has ytcfg:", "INNERTUBE_API_KEY" in html)
print("has captionTracks:", "captionTracks" in html)
print("has recaptcha:", "g-recaptcha" in html or "recaptcha" in html.lower())
print("cookies now:", [c.name for c in jar])

api_key = client_version = visitor = None
innertube_ctx = None
if html:
    m = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
    api_key = m.group(1) if m else None
    m = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html)
    client_version = m.group(1) if m else None
    m = re.search(r'"visitorData":"([^"]+)"', html)
    visitor = m.group(1) if m else None
    m = re.search(r'"INNERTUBE_CONTEXT":(\{.*?\}),"INNERTUBE_CONTEXT_CLIENT_NAME"', html)
    if m:
        try:
            innertube_ctx = json.loads(m.group(1))
        except Exception as e:
            print("ctx parse fail:", e)
    print("api_key:", api_key)
    print("client_version:", client_version)
    print("visitor:", (visitor or "none")[:40])
    m = re.search(r'"playabilityStatus":\{"status":"([^"]+)"', html)
    print("playability in page:", m.group(1) if m else "not found")

# ---- 2. timedtext straight from watch page playerResponse ----
section("timedtext from page captionTracks")
tracks = []
if "captionTracks" in html:
    m = re.search(r'"captionTracks":(\[.*?\])(,|\})', html)
    if m:
        try:
            tracks = json.loads(m.group(1))
        except Exception:
            # find balanced bracket span
            start = html.index('"captionTracks":') + len('"captionTracks":')
            depth = 0
            for i in range(start, len(html)):
                if html[i] == "[":
                    depth += 1
                elif html[i] == "]":
                    depth -= 1
                    if depth == 0:
                        tracks = json.loads(html[start:i + 1])
                        break
    print("tracks:", [(t.get("languageCode"), t.get("kind")) for t in tracks])
    if tracks:
        base = tracks[0]["baseUrl"].replace("\\u0026", "&")
        st, body = http_call(base + "&fmt=json3",
                             headers={"User-Agent": UA})
        print("timedtext status:", st, "len:", len(body))
        if st == 200 and body.strip():
            data = json.loads(body)
            segs = ["".join(s.get("utf8", "") for s in ev.get("segs", []))
                    for ev in data.get("events", []) if ev.get("segs")]
            segs = [s.strip() for s in segs if s.strip()]
            if segs:
                save_segments(segs)
                sys.exit(0)
else:
    print("no captionTracks in page")

# ---- 3. innertube next -> get_transcript with page-derived context ----
section("innertube get_transcript")
ctx_client = {"clientName": "WEB",
              "clientVersion": client_version or "2.20250710.09.00",
              "hl": "en", "gl": "US"}
if visitor:
    ctx_client["visitorData"] = visitor
base_headers = {"Content-Type": "application/json", "User-Agent": UA,
                "Origin": "https://www.youtube.com",
                "Referer": f"https://www.youtube.com/watch?v={VIDEO_ID}",
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": ctx_client["clientVersion"]}
if visitor:
    base_headers["X-Goog-Visitor-Id"] = visitor

key_q = f"&key={api_key}" if api_key else ""
st, body = http_call(
    f"https://www.youtube.com/youtubei/v1/next?prettyPrint=false{key_q}",
    data=json.dumps({"context": {"client": ctx_client},
                     "videoId": VIDEO_ID}).encode(),
    headers=base_headers)
print("next status:", st)
params = None
title = channel = ""
if st == 200:
    nxt = json.loads(body)
    for node in walk(nxt, "videoPrimaryInfoRenderer"):
        title = "".join(r.get("text", "") for r in node.get("title", {}).get("runs", []))
        break
    for node in walk(nxt, "videoOwnerRenderer"):
        channel = "".join(r.get("text", "") for r in node.get("title", {}).get("runs", []))
        break
    for node in walk(nxt, "getTranscriptEndpoint"):
        params = node.get("params")
        if params:
            break
    print("title:", title, "| channel:", channel)
    print("params found:", bool(params))

if params:
    contexts = [("page-derived client", {"client": ctx_client})]
    if innertube_ctx:
        full = dict(innertube_ctx)
        full.setdefault("client", {})["visitorData"] = visitor or full["client"].get("visitorData", "")
        contexts.insert(0, ("full page INNERTUBE_CONTEXT", full))
    for name, context in contexts:
        st, body = http_call(
            f"https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false{key_q}",
            data=json.dumps({"context": context, "params": params}).encode(),
            headers=base_headers)
        print(f"get_transcript [{name}]: status {st}")
        if st != 200:
            print("  body:", body.decode("utf-8", "replace")[:400])
            continue
        tr = json.loads(body)
        segs = []
        for node in walk(tr, "transcriptSegmentRenderer"):
            t = "".join(r.get("text", "") for r in node.get("snippet", {}).get("runs", []))
            if t.strip():
                segs.append(t.strip())
        print("  segments:", len(segs))
        if segs:
            save_segments(segs, title, channel)
            sys.exit(0)

# ---- 4. android player API for caption URLs ----
section("android player captions")
st, body = http_call(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    data=json.dumps({"context": {"client": {
        "clientName": "ANDROID", "clientVersion": "19.09.37",
        "androidSdkVersion": 30, "hl": "en"}},
        "videoId": VIDEO_ID}).encode(),
    headers={"Content-Type": "application/json",
             "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
             "X-YouTube-Client-Name": "3",
             "X-YouTube-Client-Version": "19.09.37"})
print("player status:", st)
if st == 200:
    pl = json.loads(body)
    print("playability:", pl.get("playabilityStatus", {}).get("status"))
    ptracks = (pl.get("captions", {})
               .get("playerCaptionsTracklistRenderer", {})
               .get("captionTracks", []))
    print("caption tracks:", [(t.get("languageCode"), t.get("kind")) for t in ptracks])
    if ptracks:
        st, body = http_call(ptracks[0]["baseUrl"] + "&fmt=json3",
                             headers={"User-Agent": UA})
        print("timedtext status:", st, "len:", len(body))
        if st == 200 and body.strip():
            data = json.loads(body)
            segs = ["".join(s.get("utf8", "") for s in ev.get("segs", []))
                    for ev in data.get("events", []) if ev.get("segs")]
            segs = [s.strip() for s in segs if s.strip()]
            if segs:
                save_segments(segs)
                sys.exit(0)

print("\nALL PROBES FAILED")
sys.exit(1)
