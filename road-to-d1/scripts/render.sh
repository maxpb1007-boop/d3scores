#!/usr/bin/env bash
# Chunked Remotion render + mux. Run from road-to-d1/ in the background:
#   nohup scripts/render.sh ep01 final > logs/render.log 2>&1 &
#   nohup scripts/render.sh ep01 draft > logs/draft.log 2>&1 &     (half scale, quick look)
# Chunks are rendered at CRF 14, joined, then encoded once at CRF 20 as TV-range yuv420p.
# Chunks are rendered separately (each well under the tool timeout), then joined with the concat
# demuxer (no re-encode) and muxed with the mastered audio (Remotion's own track is muted).
set -euo pipefail
EP=${1:-ep01}; MODE=${2:-final}; CHUNK=${CHUNK:-600}
COMP="$(echo ${EP:0:1} | tr a-z A-Z)${EP:1}"
export REMOTION_TMP="$PWD/tmp" TMPDIR="$PWD/tmp"
OUT="out/$EP/$MODE"; mkdir -p "$OUT" tmp
TOTAL=$(python3 -c "import json;print(json.load(open('src/episodes/$EP/timeline.json'))['durationInFrames'])")
SCALE=1; CRF=${FINAL_CRF:-20}; [ "$MODE" = "draft" ] && SCALE=0.5 && CRF=26
df -h . | tail -1
rm -rf tmp/remotion-* tmp/react-motion-* 2>/dev/null || true
i=0; : > "$OUT/list.txt"
for ((s=0; s<TOTAL; s+=CHUNK)); do
  e=$(( s+CHUNK-1 < TOTAL-1 ? s+CHUNK-1 : TOTAL-1 ))
  part="$OUT/part_$(printf %02d $i).mp4"
  if [ ! -s "$part" ]; then
    echo "[$(date +%T)] frames $s-$e -> $part"
    npx remotion render src/index.ts "$COMP" "$part" --frames="$s-$e" --scale=$SCALE --gl=swangle \
      --codec=h264 --crf=14 --muted --concurrency=${CONC:-4} --log=error --timeout=120000
  fi
  echo "file '$(basename $part)'" >> "$OUT/list.txt"; i=$((i+1))
done
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/video_hq.mp4"
# One final encode: Remotion's JPEG frames come out full-range (yuvj420p); platforms expect TV-range yuv420p.
ffmpeg -v error -y -i "$OUT/video_hq.mp4" -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf $CRF -profile:v high -pix_fmt yuv420p -color_range tv -r 30 -an "$OUT/video.mp4"
for MIX in music nomusic; do
  NAME="${EP}_$([ $MIX = music ] && echo final || echo no_music)"
  ffmpeg -v error -y -i "$OUT/video.mp4" -i "out/$EP/mix_$MIX.wav" -map 0:v:0 -map 1:a:0 -c:v copy \
    -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart "$OUT/$NAME.mp4"
  echo "wrote $OUT/$NAME.mp4"
done
echo "[$(date +%T)] done"
