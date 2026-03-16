#!/bin/bash
# Generate placeholder sounds for each preset
# These are simple synth tones — replace with real themed sounds later
# Requires: ffmpeg

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$ROOT_DIR/sounds"/{starcraft,wow,arcade,minimal}

# Helper: generate a tone
tone() {
  local out="$1" freq="$2" duration="$3"
  ffmpeg -y -f lavfi -i "sine=frequency=${freq}:duration=${duration}" \
    -af "afade=t=in:st=0:d=0.05,afade=t=out:st=$(echo "$duration - 0.1" | bc):d=0.1,volume=0.5" \
    "$out" 2>/dev/null
}

# Helper: two-tone chime
chime() {
  local out="$1" f1="$2" f2="$3" dur="${4:-0.3}"
  ffmpeg -y -f lavfi -i "sine=frequency=${f1}:duration=${dur}" \
    -f lavfi -i "sine=frequency=${f2}:duration=${dur}" \
    -filter_complex "[0][1]concat=n=2:v=0:a=1,afade=t=in:st=0:d=0.05,afade=t=out:st=$(echo "$dur * 2 - 0.1" | bc):d=0.1,volume=0.5" \
    "$out" 2>/dev/null
}

echo "Generating minimal preset..."
chime "$ROOT_DIR/sounds/minimal/task-complete.mp3" 880 1320 0.2
chime "$ROOT_DIR/sounds/minimal/need-input.mp3" 660 880 0.15
tone  "$ROOT_DIR/sounds/minimal/idle.mp3" 440 0.4
chime "$ROOT_DIR/sounds/minimal/error.mp3" 440 330 0.2
chime "$ROOT_DIR/sounds/minimal/session-start.mp3" 523 784 0.25

# Copy minimal as placeholder for other presets (replace later with themed sounds)
for preset in starcraft wow arcade; do
  echo "Copying placeholders for $preset..."
  cp "$ROOT_DIR/sounds/minimal/"*.mp3 "$ROOT_DIR/sounds/$preset/"
done

echo "Generated placeholder sounds for all presets."
