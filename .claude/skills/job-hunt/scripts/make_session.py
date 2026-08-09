#!/usr/bin/env python3
"""
Turn a browser cookie export into a Playwright session file, then verify it.

    python3 make_session.py cookies.json          # convert + verify
    python3 make_session.py --verify-only         # just test the existing session

Why this exists: auto-submitting on Indeed requires a logged-in browser session.
Playwright wants a specific "storage state" JSON that no browser exports directly.
A cookie-exporter extension gets you 90% of the way; this script does the last 10%
and then actually loads Indeed to confirm the session works, so you find out here
rather than during a scheduled run at 7am.

Accepts either a Cookie-Editor style array or an already-valid storage_state object.
"""

import json
import os
import sys

OUT = os.path.expanduser("~/.config/job-hunt/session.json")

SAMESITE = {
    "no_restriction": "None", "none": "None",
    "lax": "Lax", "strict": "Strict",
    "unspecified": "Lax", "": "Lax", None: "Lax",
}


def convert(raw):
    """Normalize whatever the extension gave us into Playwright storage_state."""
    if isinstance(raw, dict) and "cookies" in raw:
        state = {"cookies": raw["cookies"], "origins": raw.get("origins", [])}
        return state, len(state["cookies"])

    if not isinstance(raw, list):
        sys.exit("error: expected a list of cookies or a storage_state object.")

    cookies = []
    for c in raw:
        name, domain = c.get("name"), c.get("domain")
        if not name or not domain:
            continue
        expires = c.get("expirationDate", c.get("expires", -1))
        cookies.append({
            "name": name,
            "value": c.get("value", ""),
            "domain": domain,
            "path": c.get("path", "/"),
            "expires": float(expires) if expires else -1,
            "httpOnly": bool(c.get("httpOnly", False)),
            "secure": bool(c.get("secure", False)),
            "sameSite": SAMESITE.get(str(c.get("sameSite", "")).lower(), "Lax"),
        })
    return {"cookies": cookies, "origins": []}, len(cookies)


def verify():
    """Load Indeed with the session and report whether we look signed in."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("! playwright not installed — skipping verification.")
        print("  pip install playwright   (do NOT run 'playwright install')")
        return None

    chrome = os.environ.get("CHROME_BIN", "/opt/pw-browsers/chromium")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=chrome if os.path.exists(chrome) else None,
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        ctx = browser.new_context(
            storage_state=OUT,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        )
        page = ctx.new_page()
        try:
            page.goto("https://www.indeed.com/", timeout=45000, wait_until="domcontentloaded")
            body = page.content().lower()
            shot = os.path.expanduser("~/.config/job-hunt/session-check.png")
            page.screenshot(path=shot)
            signed_in = "sign in" not in body[:200000] or "myindeed" in body or "logout" in body
            print(f"  screenshot: {shot}")
            return signed_in
        except Exception as e:
            print(f"! could not reach Indeed: {e}")
            return None
        finally:
            browser.close()


def main():
    args = [a for a in sys.argv[1:]]
    verify_only = "--verify-only" in args
    args = [a for a in args if not a.startswith("--")]

    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    if not verify_only:
        if not args:
            sys.exit(__doc__)
        src = os.path.expanduser(args[0])
        if not os.path.isfile(src):
            sys.exit(f"error: no such file: {src}")

        with open(src) as f:
            raw = json.load(f)

        state, n = convert(raw)
        if n == 0:
            sys.exit("error: no usable cookies found in that export.")

        with open(OUT, "w") as f:
            json.dump(state, f, indent=2)
        os.chmod(OUT, 0o600)

        domains = sorted({c["domain"].lstrip(".") for c in state["cookies"]})
        print(f"wrote {OUT}  ({n} cookies)")
        print("  domains: " + ", ".join(domains[:6]) + (" …" if len(domains) > 6 else ""))
        if not any("indeed" in d for d in domains):
            print("! no indeed.com cookies here — export again while logged in to Indeed.")

    elif not os.path.isfile(OUT):
        sys.exit(f"error: no session at {OUT}. Convert an export first.")

    print("verifying…")
    ok = verify()
    if ok is True:
        print("OK — session looks signed in. Auto-submission is unblocked.")
    elif ok is False:
        print("! session loaded but Indeed still shows signed-out. Re-export while logged in.")


if __name__ == "__main__":
    main()
