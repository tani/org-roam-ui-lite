#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
tsx "$DIR/org-roam-example.ts"
