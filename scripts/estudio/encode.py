"""Encode Blender RGB frames for screen blending. Python stdlib + FFmpeg.

Prints every exact FFmpeg command, then validates all final files with ffprobe.
"""

import argparse
import json
from pathlib import Path
import shlex
import struct
import subprocess

COUNTS = {1: 114, 2: 114, 3: 126}
POSTERS = {1: 74, 2: 52, 3: 105}
MAX_BYTES = 400_000
FPS = 30
# Remove the sub-visible tail of Fog Glow before YUV conversion. White stays white.
# This gives screen blending a truly black background, including after compression.
BLACK_POINT = "colorlevels=rimin=0.0078431373:gimin=0.0078431373:bimin=0.0078431373"


def run(command):
    print(shlex.join(str(s) for s in command), flush=True)
    subprocess.run([str(s) for s in command], check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-count_frames", "-show_streams",
        "-show_format", "-of", "json", str(path),
    ]))


def faststart(path):
    atoms = []
    with path.open("rb") as file:
        while header := file.read(8):
            length, kind = struct.unpack(">I4s", header)
            if length == 1:
                length = struct.unpack(">Q", file.read(8))[0]
                header += bytes(8)
            atoms.append(kind)
            if length == 0:
                break
            file.seek(length - len(header), 1)
    return b"moov" in atoms and b"mdat" in atoms and atoms.index(b"moov") < atoms.index(b"mdat")


def webp_has_alpha(path):
    data = path.read_bytes()
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", path
    offset = 12
    while offset + 8 <= len(data):
        kind = data[offset:offset + 4]
        size = struct.unpack_from("<I", data, offset + 4)[0]
        payload = offset + 8
        if kind == b"ALPH":
            return True
        if kind == b"VP8X" and data[payload] & 0x10:
            return True
        if kind == b"VP8L" and struct.unpack_from("<I", data, payload + 1)[0] & (1 << 28):
            return True
        offset = payload + size + (size % 2)
    return False


def validate(path, pillar):
    metadata = probe(path)
    assert path.stat().st_size <= MAX_BYTES, f"Over 400 KB: {path}"
    assert len(metadata["streams"]) == 1, f"Unexpected audio/extra stream: {path}"
    stream = metadata["streams"][0]
    assert (stream["width"], stream["height"]) == (960, 400), path
    assert stream["codec_type"] == "video", path
    if path.suffix in (".mp4", ".webm"):
        assert stream["codec_name"] == ("h264" if path.suffix == ".mp4" else "vp9"), path
        assert stream["pix_fmt"] == "yuv420p", path
        assert stream["r_frame_rate"] == "30/1", path
        assert int(stream["nb_read_frames"]) == COUNTS[pillar], path
        duration = float(metadata["format"]["duration"])
        assert abs(duration - COUNTS[pillar] / FPS) < .001, (path, duration)
        assert stream.get("tags", {}).get("alpha_mode", "0") == "0", path
        if path.suffix == ".mp4":
            assert faststart(path), f"moov must precede mdat: {path}"
    else:
        assert stream["codec_name"] == "webp", path
        # FFmpeg decodes VP8L into ARGB even when the WebP alpha-used bit is zero.
        assert not webp_has_alpha(path), f"Poster must be opaque: {path}"
    return {"file": path.name, "bytes": path.stat().st_size, "codec": stream["codec_name"], "pixel_format": stream["pix_fmt"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", type=Path, default=Path("/tmp/aterna-estudio"))
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[2] / "public/estudio/v1")
    parser.add_argument("--report", type=Path, help="Optional JSON verification report, outside the published assets")
    parser.add_argument("--pillar", type=int, choices=(1, 2, 3), help="Encode only this icon")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for pillar, count in COUNTS.items():
        if args.pillar is not None and pillar != args.pillar:
            continue
        pattern = args.frames_dir / f"pillar-{pillar}/%04d.png"
        frames = args.frames_dir / f"pillar-{pillar}"
        assert all((frames / f"{n:04d}.png").is_file() for n in range(count)), f"Incomplete sequence: {frames}"
        base = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-framerate", str(FPS), "-start_number", "0", "-i", pattern,
                "-map", "0:v:0", "-frames:v", str(count), "-an", "-map_metadata", "-1",
                "-vf", BLACK_POINT + ",scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p",
                "-r", str(FPS), "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
        for extension in ("webm", "mp4"):
            output = args.output_dir / f"pillar-{pillar}.{extension}"
            # The first passing quality is used. The byte limit is strict, not an average bitrate estimate.
            qualities = (18, 21, 24, 27, 30, 33) if extension == "webm" else (16, 18, 20, 22, 24, 26)
            for quality in qualities:
                if extension == "webm":
                    codec = ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(quality), "-qmin", str(quality), "-qmax", str(quality), "-deadline", "good", "-cpu-used", "2", "-row-mt", "1", "-threads", "8", "-g", str(count)]
                else:
                    codec = ["-c:v", "libx264", "-preset", "slow", "-qp", str(quality), "-pix_fmt", "yuv420p", "-threads", "8", "-g", str(count), "-movflags", "+faststart"]
                # Match intra-frame quantization at both sides of the loop boundary.
                run(base + codec + ["-force_key_frames", f"expr:eq(n,{count - 1})", output])
                if output.stat().st_size <= MAX_BYTES:
                    break
            results.append(validate(output, pillar))
        poster = args.output_dir / f"pillar-{pillar}.webp"
        run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", frames / f"{POSTERS[pillar]:04d}.png", "-frames:v", "1", "-an", "-map_metadata", "-1", "-vf", BLACK_POINT, "-c:v", "libwebp", "-lossless", "1", "-compression_level", "6", "-pix_fmt", "bgra", poster])
        results.append(validate(poster, pillar))
    summary = json.dumps(results, indent=2) + "\n"
    print(summary)
    if args.report:
        args.report.write_text(summary)


if __name__ == "__main__":
    main()
