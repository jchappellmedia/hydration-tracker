#!/usr/bin/env python3
"""
Generates the brand images into scripts/water-site/assets/ (the build script
copies that folder to water/assets/).

    python3 -m pip install Pillow && python3 scripts/water-site/make-images.py

The outputs are committed, so nobody needs Pillow to build or deploy the site.
Re-run only if the brand name or colours change.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")
os.makedirs(OUT, exist_ok=True)

BRAND = "East Valley Soft Water"
LINE1 = "Water softener & filtration"
LINE2 = "installation — flat rate"
LINE3 = "Mesa · Gilbert · Chandler · Queen Creek"
DEEP = (11, 93, 117)
DARK = (4, 48, 62)
ACCENT = (217, 95, 34)
WHITE = (255, 255, 255)

FONTS = "/usr/share/fonts/truetype/dejavu/"
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def gradient(w, h, top, bottom, diagonal=True):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(0, w, 4):
            t = ((x / w) * 0.45 + (y / h) * 0.55) if diagonal else y / h
            px_c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
            for dx in range(4):
                if x + dx < w:
                    px[x + dx, y] = px_c
    return img

def droplet(draw, cx, cy, size, fill=None, outline=None, width=6):
    """A teardrop: a circle with a point on top, drawn as a polygon."""
    r = size / 2
    pts = []
    for i in range(0, 361, 3):
        a = math.radians(i - 90)
        # squeeze the top of the circle into a point
        squeeze = max(0.0, -math.sin(a))
        rr = r * (1 - 0.55 * squeeze ** 1.4)
        x = cx + math.cos(a) * rr
        y = cy + math.sin(a) * rr * (1 + 0.45 * squeeze ** 1.6)
        pts.append((x, y))
    draw.polygon(pts, fill=fill, outline=outline, width=width)

# --- Open Graph card: 1200x630 --------------------------------------------
og = gradient(1200, 630, DEEP, DARK)
d = ImageDraw.Draw(og, "RGBA")
# faint droplet watermark on the right
droplet(d, 990, 300, 460, fill=(255, 255, 255, 18))
droplet(d, 990, 300, 460, outline=(255, 255, 255, 46), width=4)
# accent rule
d.rectangle([80, 132, 80 + 92, 132 + 7], fill=ACCENT)

d.text((80, 168), BRAND, font=font("DejaVuSans-Bold.ttf", 44), fill=(255, 255, 255, 235))
d.text((80, 244), LINE1, font=font("DejaVuSans-Bold.ttf", 62), fill=WHITE)
d.text((80, 316), LINE2, font=font("DejaVuSans-Bold.ttf", 62), fill=WHITE)
d.text((80, 416), LINE3, font=font("DejaVuSans.ttf", 30), fill=(210, 232, 240, 245))
d.text((80, 486), "$495–$645 installed  ·  We install the unit you bought",
       font=font("DejaVuSans-Bold.ttf", 30), fill=(255, 190, 150))
og.save(os.path.join(OUT, "og-image.png"), optimize=True)

# --- App / touch icon: 512x512 ---------------------------------------------
icon = gradient(512, 512, DEEP, DARK)
di = ImageDraw.Draw(icon, "RGBA")
droplet(di, 256, 262, 300, fill=(255, 255, 255, 30))
droplet(di, 256, 262, 300, outline=WHITE, width=18)
# two little waves inside the drop
for i, y in enumerate((300, 348)):
    di.arc([164, y - 34, 256, y + 34], 200, 340, fill=WHITE, width=15)
    di.arc([256, y - 34, 348, y + 34], 200, 340, fill=WHITE, width=15)
icon.save(os.path.join(OUT, "icon-512.png"), optimize=True)
icon.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "icon-180.png"), optimize=True)

# --- favicon.svg (crisp at any size; PNG above is the fallback) ------------
with open(os.path.join(OUT, "favicon.svg"), "w") as f:
    f.write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        '<rect width="32" height="32" rx="7" fill="#0b5d75"/>'
        '<path d="M16 5.5S7 14 7 19.4C7 24.1 11 27.5 16 27.5S25 24.1 25 19.4C25 14 16 5.5 16 5.5Z" '
        'fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/>'
        '<path d="M11.5 19.2c1.4 0 1.4 1.7 2.8 1.7s1.4-1.7 2.8-1.7 1.4 1.7 2.8 1.7" '
        'fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>'
        '</svg>\n'
    )

print("wrote og-image.png, icon-512.png, icon-180.png, favicon.svg")
