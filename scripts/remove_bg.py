"""Remove cream/off-white backgrounds from potato mascot PNGs."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
TARGETS = [
    "potato-study.png",
    "potato-short-break.png",
    "potato-break.png",
    "potato-long-break.png",
]

# Typical cream backdrop in the source art
REF = (253, 251, 240)


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def remove_background(src: Path, dest: Path, threshold: float = 42.0) -> None:
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            rgb = (r, g, b)

            if color_distance(rgb, REF) <= threshold:
                pixels[x, y] = (r, g, b, 0)
                continue

            # Also fade very light warm pixels near the edges of the cutout
            if r > 236 and g > 232 and b > 218 and min(r, g, b) > 210:
                softness = min(1.0, (r - 210) / 45)
                pixels[x, y] = (r, g, b, int(a * (1 - softness * 0.85)))

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, optimize=True)
    print(f"Saved {dest.name} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    for name in TARGETS:
        src = ROOT / name
        if not src.exists():
            print(f"Skip missing: {src.name}")
            continue
        remove_background(src, ROOT / name.replace(".png", "-transparent.png"))


if __name__ == "__main__":
    main()
