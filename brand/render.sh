#!/usr/bin/env bash
# render.sh <input.svg> <output.png> [scale]
# Renders an SVG to PNG via headless Chrome at its natural size.
set -euo pipefail
SVG="$1"; OUT="$2"; SCALE="${3:-2}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# read width/height from the <svg> tag
read -r W H < <(python3 - "$SVG" <<'PY'
import re,sys
s=open(sys.argv[1]).read()
w=re.search(r'width="([0-9.]+)"',s).group(1)
h=re.search(r'height="([0-9.]+)"',s).group(1)
print(int(float(w)+0.999), int(float(h)+0.999))
PY
)

TMP="$(mktemp -d)"
HTML="$TMP/wrap.html"
cat > "$HTML" <<HTMLDOC
<!doctype html><meta charset="utf-8">
<style>*{margin:0;padding:0}html,body{width:${W}px;height:${H}px;overflow:hidden}</style>
<body>$(cat "$SVG")</body>
HTMLDOC

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor="$SCALE" \
  --window-size="${W},${H}" \
  --screenshot="$OUT" "file://$HTML" >/dev/null 2>&1
rm -rf "$TMP"
echo "rendered $OUT (${W}x${H} @${SCALE}x)"
