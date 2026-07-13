#!/usr/bin/env python3
"""Seed a plan document into a user's own skillstack_state row.

Signs in with the user's email/password (from env), then merges the plan
into their row through PostgREST under row-level security — exactly the
write path the app itself uses. Never prints tokens, credentials, or data.

Merge rules (mirrors the app's pullRemote logic so progress is never lost):
  - Row exists: keep everything in `data` as-is, just set/replace `data.plan`.
    The stored `updatedAt` is untouched, so a device with newer local state
    still wins on sync — the app adopts a plan from remote whenever local
    lacks one, without adopting anything else.
  - No row yet: insert {"plan": ..., "updatedAt": 1} so any real local
    state (updatedAt = Date.now()) outranks the seed.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = "https://utupgcayrwocavdmhyle.supabase.co"
# Publishable key — safe to commit, already public in skillstack/config.js.
SUPABASE_KEY = "sb_publishable_dfuSJkpp1yZy5yg4tlKsGw_ync0kLXy"


def request(method, url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw.strip() else None
    except urllib.error.HTTPError as e:
        return e.code, None


def main():
    email = os.environ["ACCOUNT_EMAIL"]
    password = os.environ["ACCOUNT_PASSWORD"]
    plan = json.loads(base64.b64decode(os.environ["PLAN_B64"]))
    if not isinstance(plan, dict) or "sections" not in plan:
        print("INVALID PLAN PAYLOAD")
        return 1

    status, auth = request(
        "POST",
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        {"apikey": SUPABASE_KEY, "Content-Type": "application/json"},
        {"email": email, "password": password},
    )
    if status != 200 or not auth or "access_token" not in auth:
        print(f"AUTH FAILED (status {status})")
        return 1
    token = auth["access_token"]
    uid = auth["user"]["id"]
    api = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    status, rows = request(
        "GET",
        f"{SUPABASE_URL}/rest/v1/skillstack_state?user_id=eq.{uid}&select=data",
        api,
    )
    if status != 200:
        print(f"READ FAILED (status {status})")
        return 1

    now = datetime.now(timezone.utc).isoformat()
    if rows:
        data = rows[0].get("data") or {}
        data["plan"] = plan
        status, _ = request(
            "PATCH",
            f"{SUPABASE_URL}/rest/v1/skillstack_state?user_id=eq.{uid}",
            api,
            {"data": data, "updated_at": now},
        )
        mode = "merged into existing row"
    else:
        status, _ = request(
            "POST",
            f"{SUPABASE_URL}/rest/v1/skillstack_state",
            api,
            {"user_id": uid, "data": {"plan": plan, "updatedAt": 1}, "updated_at": now},
        )
        mode = "created new row"

    if status not in (200, 201, 204):
        print(f"WRITE FAILED (status {status})")
        return 1
    print(f"PLAN SEEDED — {mode}, {len(plan['sections'])} sections")
    return 0


if __name__ == "__main__":
    sys.exit(main())
