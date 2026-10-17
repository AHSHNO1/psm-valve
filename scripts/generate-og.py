"""Generate the Open Graph share image (1200x630) for PSM Valve.

Usage: python scripts/generate-og.py
Output: public/og/og-default.jpg
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo" / "logo-main.png"
OUT = ROOT / "public" / "og" / "og-default.jpg"

W, H = 1200, 630
GOLD = (224, 168, 26)
GOLD_LIGHT = (245, 197, 24)
INK = (15, 17, 20)
CARD = (255, 255, 255)
MUTED = (156, 163, 175)
BODY = (199, 203, 209)

FONT_DIR = Path("C:/Windows/Fonts")
FONT_BOLD = FONT_DIR / "segoeuib.ttf"
FONT_REG = FONT_DIR / "segoeui.ttf"
FONT_SEMI = FONT_DIR / "segoeuisb.ttf" if (FONT_DIR / "segoeuisb.ttf").exists() else FONT_BOLD


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    base = Image.new("RGB", (1, h))
    px = base.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return base.resize((w, h), Image.Resampling.BILINEAR)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def main() -> None:
    canvas = vertical_gradient((W, H), (10, 12, 15), (34, 37, 43)).convert("RGB")

    # Soft gold glow on the right edge for depth.
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((820, -180, 1420, 460), fill=(120, 88, 10))
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    canvas = Image.blend(canvas, Image.blend(canvas, glow, 0.55), 0.5)

    draw = ImageDraw.Draw(canvas)

    # Thin gold rule across the top.
    draw.rectangle((0, 0, W, 6), fill=GOLD)

    # Logo card.
    card_size = 330
    card_pos = (78, (H - card_size) // 2)
    card = Image.new("RGBA", (card_size, card_size), (0, 0, 0, 0))
    card.paste(Image.new("RGB", (card_size, card_size), CARD), (0, 0), rounded_mask((card_size, card_size), 30))
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((250, 250), Image.Resampling.LANCZOS)
    card.alpha_composite(
        logo,
        ((card_size - logo.width) // 2, (card_size - logo.height) // 2),
    )
    canvas.paste(card, card_pos, card)

    x = 470
    draw.rectangle((x, 190, x + 64, 194), fill=GOLD)

    draw.text((x, 214), "PETRO SAZEH MIHAN CO.", font=font(FONT_SEMI, 30), fill=(228, 231, 235))
    draw.text((x, 256), "PSM Valve", font=font(FONT_BOLD, 92), fill=CARD)
    draw.text((x, 360), "Industrial Control Valves", font=font(FONT_REG, 38), fill=GOLD_LIGHT)

    draw.rectangle((x, 428, x + 585, 429), fill=(58, 61, 66))
    draw.text((x, 450), "Engineering · Manufacturing · HVOF Coating", font=font(FONT_REG, 26), fill=BODY)

    draw.text((x, 536), "psmvalve.com", font=font(FONT_BOLD, 30), fill=GOLD)
    draw.text((W - 78, 540), "Arak · Iran", font=font(FONT_REG, 22), fill=MUTED, anchor="ra")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
