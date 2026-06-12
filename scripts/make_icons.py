"""Generate PNG app icon from favicon SVG colors."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "assets" / "icons"
SIZE = 180


def draw_potato(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    w = int(36 * scale)
    h = int(40 * scale)
    draw.ellipse((cx - w, cy - h, cx + w, cy + h), fill="#d9b67b", outline="#c49a5c", width=2)
    draw.ellipse((cx - 18 * scale, cy - 8 * scale, cx - 10 * scale, cy), fill="#efb8a6")
    draw.ellipse((cx + 10 * scale, cy - 8 * scale, cx + 18 * scale, cy), fill="#efb8a6")
    draw.ellipse((cx - 10 * scale, cy - 12 * scale, cx - 5 * scale, cy - 6 * scale), fill="#4a3f35")
    draw.ellipse((cx + 5 * scale, cy - 12 * scale, cx + 10 * scale, cy - 6 * scale), fill="#4a3f35")
    draw.arc((cx - 12 * scale, cy + 2 * scale, cx + 12 * scale, cy + 16 * scale), 10, 170, fill="#4a3f35", width=3)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (SIZE, SIZE), "#fdfbf0")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((8, 8, SIZE - 8, SIZE - 8), radius=28, fill="#ffffff", outline="#7a8b5f", width=4)
    draw_potato(draw, SIZE // 2, SIZE // 2 + 8, scale=1.35)
    img.save(OUT / "apple-touch-icon.png", optimize=True)
    img.resize((32, 32), Image.Resampling.LANCZOS).save(OUT / "favicon-32.png", optimize=True)
    print("Icons saved to", OUT)


if __name__ == "__main__":
    main()
