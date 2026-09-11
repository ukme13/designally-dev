#!/usr/bin/env python3
"""
Turn the client logo JPGs in `originals/` into one-ink transparent PNG masks.

Output goes to `public/clients/<slug>.png`, in manifest order. Each file is
grayscale-plus-alpha: black, with alpha set by how far each source pixel is from
white. The homepage strip uses these files as CSS masks, which read only the
alpha, so the logo's shape is kept and its colours are not.

Nothing is redrawn, traced, upscaled or sharpened. The only changes are:
  - white becomes transparent, on a ramp: distance below LO is clear, above HI
    is solid, anti-aliased edges in between stay partial;
  - the empty margin around the logo is cropped away, so each file's ratio is
    the logo's own rather than the 174 x 123 tile it was published in.

White shapes INSIDE a logo (the SCG elephant, the Bitazza cube) become holes,
which is how a one-colour version of each logo reads.

Distance from white is the strongest channel's shortfall, max(255-R, 255-G,
255-B), rather than darkness. A saturated green is as far from white as black
is, so bright logos do not come out faint.

Requirements: macOS `sips` to decode JPEG, and the Python standard library.
Run from the repository root:

    python3 docs/assets/client-logos/prepare-masks.py
"""
import hashlib
import json
import pathlib
import struct
import subprocess
import tempfile
import zlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parents[2] / "public" / "clients"

LO = 12  # at or below: background, or JPEG noise next to an edge
HI = 64  # at or above: ink, fully opaque


def read_bmp(path):
    b = path.read_bytes()
    offset = struct.unpack_from("<I", b, 10)[0]
    width, height = struct.unpack_from("<ii", b, 18)
    step = struct.unpack_from("<H", b, 28)[0] // 8
    top_down = height < 0
    height = abs(height)
    stride = (width * step + 3) & ~3
    rows = []
    for y in range(height):
        base = offset + (y if top_down else height - 1 - y) * stride
        rows.append(
            [(b[base + x * step + 2], b[base + x * step + 1], b[base + x * step])
             for x in range(width)]
        )
    return width, height, rows


def alpha_of(pixel):
    distance = max(255 - pixel[0], 255 - pixel[1], 255 - pixel[2])
    if distance <= LO:
        return 0
    if distance >= HI:
        return 255
    return round((distance - LO) / (HI - LO) * 255)


def write_png(path, width, height, alpha_rows):
    raw = b"".join(b"\x00" + bytes(v for a in row for v in (0, a)) for row in alpha_rows)

    def chunk(kind, data):
        return (struct.pack(">I", len(data)) + kind + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF))

    # Colour type 4: grayscale with alpha, 8 bits each.
    header = struct.pack(">IIBBBBB", width, height, 8, 4, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
                     + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    manifest = json.loads((HERE / "manifest.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for entry in sorted(manifest, key=lambda e: (e["row"], e["order"])):
            source = HERE / entry["file"]
            bmp = pathlib.Path(tmp) / f"{entry['slug']}.bmp"
            subprocess.run(["sips", "-s", "format", "bmp", str(source), "--out", str(bmp)],
                           check=True, capture_output=True)
            width, height, rows = read_bmp(bmp)
            alpha = [[alpha_of(p) for p in row] for row in rows]
            xs = [x for row in alpha for x, a in enumerate(row) if a]
            ys = [y for y, row in enumerate(alpha) if any(row)]
            left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)
            crop = [row[left:right + 1] for row in alpha[top:bottom + 1]]
            target = OUT / f"{entry['slug']}.png"
            write_png(target, right - left + 1, bottom - top + 1, crop)
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
            print(json.dumps({
                "slug": entry["slug"], "row": entry["row"], "order": entry["order"],
                "width": right - left + 1, "height": bottom - top + 1,
                "bytes": target.stat().st_size, "sha256": digest,
            }))


if __name__ == "__main__":
    main()
