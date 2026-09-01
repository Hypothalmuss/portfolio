#!/usr/bin/env bash
# Re-encode portfolio videos for the web and generate poster frames.
# Long side capped at 1280px, H.264 CRF 30, faststart for streaming playback.
export PATH="$HOME/scoop/shims:$PATH"
set -u
cd "$(dirname "$0")"
mkdir -p assets/posters _compressed

shopt -s nullglob
for f in assets/videos/*.mp4 ./*.mp4 ./*.webm; do
  [ -f "$f" ] || continue
  base=$(basename "$f"); stem="${base%.*}"
  out="_compressed/${stem}.mp4"
  echo ">>> $base"
  ffmpeg -y -v error -stats -i "$f" \
    -vf "scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30" \
    -c:v libx264 -crf 30 -preset slow -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 64k -ac 1 \
    -movflags +faststart "$out" </dev/null 2>&1 | tail -1
  # Poster frame at 1s (or 0s for very short clips) so cards paint instantly.
  ffmpeg -y -v error -ss 1 -i "$out" -frames:v 1 -q:v 4 \
    "assets/posters/${stem}.jpg" </dev/null 2>/dev/null \
    || ffmpeg -y -v error -i "$out" -frames:v 1 -q:v 4 "assets/posters/${stem}.jpg" </dev/null 2>/dev/null
  printf "    %s -> %s\n" "$(du -h "$f" | cut -f1)" "$(du -h "$out" | cut -f1)"
done
echo "=== TOTALS ==="
echo "before: $(du -ch assets/videos/*.mp4 ./*.mp4 ./*.webm 2>/dev/null | tail -1)"
echo "after:  $(du -ch _compressed/*.mp4 2>/dev/null | tail -1)"
