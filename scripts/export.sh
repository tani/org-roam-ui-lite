#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") [-d path/to/org-roam.db] [-o /path/to/output]"
  echo
  echo "Options / env vars:"
  echo "  -d DATABASE   SQLite DB to export"
  echo "  -o OUTPUT     Destination folder"
  echo "  -h            Show this help"
}

DATABASE=""
OUTPUT=""
while getopts ":d:o:h" opt; do
  case "$opt" in
    d) DATABASE="$OPTARG" ;;
    o) OUTPUT="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

if [[ -z "$DATABASE" || -z "$OUTPUT" ]]; then
  usage
  exit 1
fi

echo "📂  Exporting Org-roam DB: $DATABASE"
echo "📁  Destination:           $OUTPUT"
mkdir -p "$OUTPUT"

echo "▶︎  Copying frontend bundle…"
cp -vR --no-preserve=ownership "$FRONTEND_DIR"/* "$OUTPUT/"

echo "▶︎  Generating JSON API…"
node "$BACKEND_MJS" -m dump -d "$DATABASE" -o "$OUTPUT/api"

chmod a+w "$OUTPUT"
chmod a+w "$OUTPUT/api"
chmod a+w "$OUTPUT/assets"

echo "✅  Export finished."