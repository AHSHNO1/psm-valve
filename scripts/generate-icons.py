"""Generate PWA icons (192/512) from the brand logo.

Usage: python scripts/generate-icons.py
Output: public/icons/icon-192.png, public/icons/icon-512.png
"""
from pathlib import Path

from PIL import Image

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo" / "logo-main.png"
OUT_DIR = ROOT / "public" / "icons"


def rounded_tile(size: int, radius: int) -> Image.Image:
    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=radius, fill=(255, 255, 255, 255)
    )
    return tile


def make_icon(size: int) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    target = int(size * 0.74)
    ratio = min(target / logo.width, target / logo.height)
    logo = logo.resize(
        (max(1, round(logo.width * ratio)), max(1, round(logo.height * ratio))),
        Image.Resampling.LANCZOS,
    )

    canvas = rounded_tile(size, int(size * 0.18))
    canvas.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        icon = make_icon(size)
        path = OUT_DIR / f"icon-{size}.png"
        icon.save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
