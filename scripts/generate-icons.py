"""Generate PWA / app icons from the brand logo.

Usage: python scripts/generate-icons.py
Output:
  public/icons/icon-192.png
  public/icons/icon-512.png
  public/icons/icon-maskable-512.png   (full-bleed, safe area for maskable)
  public/icons/apple-touch-icon.png    (180x180)
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo" / "logo-main.png"
OUT_DIR = ROOT / "public" / "icons"


def logo_scaled(size: int, fill: float) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    target = int(size * fill)
    ratio = min(target / logo.width, target / logo.height)
    return logo.resize(
        (max(1, round(logo.width * ratio)), max(1, round(logo.height * ratio))),
        Image.Resampling.LANCZOS,
    )


def tile(size: int, radius_ratio: float) -> Image.Image:
    tile_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if radius_ratio <= 0:
        tile_img.paste(Image.new("RGBA", (size, size), (255, 255, 255, 255)), (0, 0))
    else:
        ImageDraw.Draw(tile_img).rounded_rectangle(
            (0, 0, size - 1, size - 1),
            radius=int(size * radius_ratio),
            fill=(255, 255, 255, 255),
        )
    return tile_img


def compose(size: int, fill: float, radius_ratio: float) -> Image.Image:
    canvas = tile(size, radius_ratio)
    logo = logo_scaled(size, fill)
    canvas.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    outputs = [
        ("icon-192.png", compose(192, 0.74, 0.18)),
        ("icon-512.png", compose(512, 0.74, 0.18)),
        # Maskable icons are cropped by the OS: full-bleed background and a
        # smaller logo inside the 80% safe area.
        ("icon-maskable-512.png", compose(512, 0.58, 0)),
        ("apple-touch-icon.png", compose(180, 0.70, 0)),
    ]

    for name, image in outputs:
        path = OUT_DIR / name
        image.save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
