#!/bin/bash
# Build the one-file solo page and strip it down for the Artifact wrapper, then publish it to
# https://claude.ai/artifact/AStuC1F92Q1JTRLhSPcJte with the Artifact tool. Usage: scripts/solo.sh OUT.html
set -e
OUT=${1:?usage: scripts/solo.sh OUT.html}
cd "$(dirname "$0")/.."
npx vite build -c vite.solo.config.ts > /dev/null
python3 - "$OUT" <<'PY'
import re,sys
s=open('dist-solo/index.html').read()
s=re.sub(r'<!doctype html>|</?html[^>]*>|</?head>|</?body[^>]*>|<title>[^<]*</title>','',s,flags=re.I)
open(sys.argv[1],'w').write('<title>Relic</title>\n<style>:root{color-scheme:dark;background:#0d0b10}</style>\n'+s)
PY
ls -la "$OUT"
