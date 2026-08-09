#!/usr/bin/env bash
# Render an application HTML file to PDF and report the page count.
#
#   render_pdf.sh <input.html> [output.pdf] [--preview]
#
# Resumes must be exactly one page. This prints the count so you can verify
# instead of assuming. --preview also writes a PNG you can Read to check
# whether the page is well filled or leaving dead space at the bottom.

set -euo pipefail

IN="${1:?usage: render_pdf.sh <input.html> [output.pdf] [--preview]}"
[[ -f "$IN" ]] || { echo "error: no such file: $IN" >&2; exit 1; }

DIR="$(cd "$(dirname "$IN")" && pwd)"
BASE="$(basename "${IN%.html}")"

OUT="${2:-}"
if [[ -z "$OUT" || "$OUT" == "--preview" ]]; then
  [[ "${2:-}" == "--preview" ]] && set -- "$1" "" "--preview"
  OUT="${BASE}.pdf"
fi
case "$OUT" in /*) OUT_PATH="$OUT" ;; *) OUT_PATH="$DIR/$OUT" ;; esac

PREVIEW=false
for a in "$@"; do [[ "$a" == "--preview" ]] && PREVIEW=true; done

CHROME="${CHROME_BIN:-}"
if [[ -z "$CHROME" ]]; then
  for c in /opt/pw-browsers/chromium "$(command -v chromium || true)" \
           "$(command -v chromium-browser || true)" "$(command -v google-chrome || true)"; do
    [[ -n "$c" && -x "$c" ]] && { CHROME="$c"; break; }
  done
fi
[[ -n "$CHROME" ]] || { echo "error: no chromium found; set CHROME_BIN" >&2; exit 1; }

"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
          --print-to-pdf="$OUT_PATH" "$IN" 2>/dev/null

PAGES=$(python3 -c "
import re,sys
d=open(sys.argv[1],'rb').read()
print(len(re.findall(rb'/Type\s*/Page[^s]', d)))
" "$OUT_PATH")

if $PREVIEW; then
  "$CHROME" --headless --no-sandbox --disable-gpu \
            --window-size=816,1056 --screenshot="$DIR/${BASE}_preview.png" "$IN" 2>/dev/null
  echo "preview: $DIR/${BASE}_preview.png"
fi

echo "wrote: $OUT_PATH"
echo "pages: $PAGES"

if [[ "$BASE" == *resume* && "$PAGES" -ne 1 ]]; then
  cat >&2 <<'EOF'

WARNING: a resume must be exactly one page.

Too long  -> reduce body line-height, .job margin-bottom, li margin-bottom,
             and h2 margins before touching font-size. Cutting a weak bullet
             beats shrinking type.
Too short -> open the same values up until the content reaches the bottom
             margin. Dead space at the bottom reads as a thin candidate.

Re-render after each adjustment; a few passes is normal.
EOF
  exit 2
fi
