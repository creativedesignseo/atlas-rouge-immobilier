#!/usr/bin/env python3
"""
Atlas Rouge — logo vectorizer.

Reconstructs the Atlas Rouge brand-book logo as clean, font-independent SVG
(glyph outlines flattened to <path>, not <text>). The wordmark is a mixed
lockup: a custom crossbarless grotesk "ATLAS" based on the brand's Schibsted
Grotesk system, paired with a high-contrast Cormorant "ROUGE". The mountain
mark and AR monogram are hand-built/reconstructed paths.

Outputs -> brand/out/
"""
from __future__ import annotations
import os
import re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

# Brand-book palette
TERRA = "#B5533A"   # terracotta
MID = "#172033"     # midnight
CREAM = "#F6EEE1"   # warm cream background
SAND = "#D8C3A5"    # sand
NEAR_BLACK = "#0F1419"

ATLAS_FONT = ("SchibstedGrotesk.ttf", 500)
ROUGE_FONT = ("Cormorant.ttf", 600)
TAGLINE_FONT = ("Cormorant.ttf", 500)
MONO_FONT = ("Cormorant.ttf", 600)

# ---------------------------------------------------------------------------
_cache: dict = {}


def load(file: str, wght: int):
    key = (file, wght)
    if key in _cache:
        return _cache[key]
    f = TTFont(os.path.join(HERE, "fonts", file))
    axes = {a.axisTag: (a.minValue, a.maxValue) for a in f["fvar"].axes} if "fvar" in f else {}
    lim = {}
    if "wght" in axes:
        lim["wght"] = max(axes["wght"][0], min(wght, axes["wght"][1]))
    if "opsz" in axes:
        lim["opsz"] = axes["opsz"][1]
    if lim:
        instantiateVariableFont(f, lim, inplace=True)
    info = {
        "cmap": f.getBestCmap(),
        "gs": f.getGlyphSet(),
        "hmtx": f["hmtx"],
        "upem": f["head"].unitsPerEm,
    }
    _cache[key] = info
    return info


def _glyph_name(info, ch):
    return info["cmap"].get(ord(ch))


def text_paths(s, size, tracking_em, color, file, wght):
    """Flatten a string to <path>s. Origin (0,0) = baseline at left edge,
    y-down. Returns (markup, width_px)."""
    info = load(file, wght)
    scale = size / info["upem"]
    tpx = tracking_em * size
    parts, x = [], 0.0
    for ch in s:
        name = _glyph_name(info, ch)
        if name is None:
            x += info["upem"] * 0.28 * scale + tpx
            continue
        pen = SVGPathPen(info["gs"])
        info["gs"][name].draw(pen)
        d = pen.getCommands()
        if d:
            parts.append(
                f'<path transform="translate({x:.3f},0) scale({scale:.6f},{-scale:.6f})" '
                f'd="{d}" fill="{color}"/>'
            )
        x += info["hmtx"][name][0] * scale + tpx
    return "".join(parts), (x - tpx if s else 0.0)


def text_vmetrics(s, size, tracking_em, file, wght):
    """Return (width_px, ascent_px, descent_px) of the visual bbox.
    ascent = distance above baseline, descent = distance below (positive)."""
    info = load(file, wght)
    scale = size / info["upem"]
    tpx = tracking_em * size
    x = 0.0
    ymin = ymax = 0.0
    for ch in s:
        name = _glyph_name(info, ch)
        if name is None:
            x += info["upem"] * 0.28 * scale + tpx
            continue
        bp = BoundsPen(info["gs"])
        info["gs"][name].draw(bp)
        if bp.bounds:
            _, gymin, _, gymax = bp.bounds
            ymin = min(ymin, gymin)
            ymax = max(ymax, gymax)
        x += info["hmtx"][name][0] * scale + tpx
    return (x - tpx if s else 0.0), ymax * scale, -ymin * scale


def text_top_paths(s, visual_height, tracking_em, color, file, wght):
    """Flatten a string and return paths in a y-down top-left box.
    Returns (markup, width_px, height_px)."""
    _, asc, desc = text_vmetrics(s, 1000, tracking_em, file, wght)
    size = 1000 * (visual_height / (asc + desc))
    width, asc, desc = text_vmetrics(s, size, tracking_em, file, wght)
    paths, _ = text_paths(s, size, tracking_em, color, file, wght)
    return f'<g transform="translate(0,{asc:.3f})">{paths}</g>', width, asc + desc


def glyph_top_paths(ch, visual_height, color, file, wght):
    """Flatten one glyph into a y-down top-left box."""
    info = load(file, wght)
    name = _glyph_name(info, ch)
    if name is None:
        return "", visual_height * 0.5, visual_height
    bp = BoundsPen(info["gs"])
    info["gs"][name].draw(bp)
    if not bp.bounds:
        return "", visual_height * 0.5, visual_height
    xmin, ymin, xmax, ymax = bp.bounds
    scale = visual_height / (ymax - ymin)
    pen = SVGPathPen(info["gs"])
    info["gs"][name].draw(pen)
    d = pen.getCommands()
    width = (xmax - xmin) * scale
    markup = (f'<path transform="translate({-xmin * scale:.3f},{ymax * scale:.3f}) '
              f'scale({scale:.6f},{-scale:.6f})" d="{d}" fill="{color}"/>')
    return markup, width, visual_height


# ---------------------------------------------------------------------------
# Mixed wordmark: custom crossbarless grotesk ATLAS + Cormorant ROUGE.
# Local construction uses a 100-unit cap height before scaling.
# ---------------------------------------------------------------------------
def atlas_custom_paths(color, height):
    scale = height / 100.0
    fill = color
    stroke = color
    sw = 11 * scale
    x = 0.0
    parts = []

    def tx_path(d):
        return f'<path d="{d}" fill="{fill}"/>'

    # Crossbarless A, matching the brand-book Lambda-like A.
    def add_a():
        nonlocal x
        parts.append(
            f'<path d="M {x + 3 * scale:.3f} {100 * scale:.3f} '
            f'L {x + 40 * scale:.3f} 0 '
            f'L {x + 77 * scale:.3f} {100 * scale:.3f}" '
            f'fill="none" stroke="{stroke}" stroke-width="{sw:.3f}" '
            f'stroke-linecap="butt" stroke-linejoin="miter"/>'
        )
        x += 84 * scale

    def add_t():
        nonlocal x
        parts.append(tx_path(
            f'M {x:.3f} 0 H {x + 86 * scale:.3f} V {13 * scale:.3f} '
            f'H {x + 50 * scale:.3f} V {100 * scale:.3f} '
            f'H {x + 36 * scale:.3f} V {13 * scale:.3f} H {x:.3f} Z'
        ))
        x += 86 * scale

    def add_l():
        nonlocal x
        parts.append(tx_path(
            f'M {x:.3f} 0 H {x + 14 * scale:.3f} V {86 * scale:.3f} '
            f'H {x + 76 * scale:.3f} V {100 * scale:.3f} H {x:.3f} Z'
        ))
        x += 76 * scale

    def add_s():
        nonlocal x
        s_path, s_w, _ = glyph_top_paths("S", height, color, *ATLAS_FONT)
        parts.append(f'<g transform="translate({x:.3f},0)">{s_path}</g>')
        x += s_w

    track = 34 * scale
    add_a(); x += track
    add_t(); x += track
    add_l(); x += track
    add_a(); x += track
    add_s()
    return "".join(parts), x, height


def wordmark_paths(color, atlas_height=170.0):
    atlas_g, atlas_w, atlas_h = atlas_custom_paths(color, atlas_height)
    rouge_g, rouge_w, rouge_h = text_top_paths("ROUGE", atlas_height * 1.08, 0.075, color, *ROUGE_FONT)
    gap = atlas_height * 0.58
    rouge_y = (atlas_h - rouge_h) * 0.15
    body = (
        f'<g transform="translate(0,0)">{atlas_g}</g>'
        f'<g transform="translate({atlas_w + gap:.3f},{rouge_y:.3f})">{rouge_g}</g>'
    )
    return body, atlas_w + gap + rouge_w, max(atlas_h, rouge_y + rouge_h)


# ---------------------------------------------------------------------------
# Mountain mark — two overlapping Atlas peaks, long thin foothills.
# Two crossing strokes (drawn the way it is by hand). Local box 1000 x 150.
# ---------------------------------------------------------------------------
def mountains(color, sw=6.0):
    # Long low foothills + two angular overlapping Atlas peaks. The secondary
    # peak crosses the main peak's right shoulder like the raster artwork.
    big = "M 18 138 L 360 132 L 502 56 L 664 118"
    small = "M 560 118 L 650 74 L 766 84 L 982 138"
    return (f'<path d="{big}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{small}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')


MTN_W, MTN_H = 1000.0, 150.0
MTN_INK_TOP, MTN_INK_BOT = 30.0, 141.0  # vertical extent of actual ink in the box


# ---------------------------------------------------------------------------
def svg(w, h, body, bg=None):
    rect = f'<rect width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.2f}" height="{h:.2f}" '
            f'role="img" aria-label="Atlas Rouge — Luxury Real Estate, Marrakech">'
            f'{rect}{body}</svg>\n')


def write(name, content):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)
    print(f"  {name:38s} {len(content):>7d} b")


def inline_svg_asset(name, x, y, w, h):
    """Inline one generated SVG asset into a preview box."""
    data = open(os.path.join(OUT, name)).read()
    m = re.search(r'viewBox="0 0 ([0-9.]+) ([0-9.]+)"', data)
    if not m:
        return ""
    vw, vh = float(m.group(1)), float(m.group(2))
    inner = data[data.find(">") + 1:data.rfind("</svg>")]
    scale = min(w / vw, h / vh)
    ox = x + (w - vw * scale) / 2
    oy = y + (h - vh * scale) / 2
    return f'<g transform="translate({ox:.3f},{oy:.3f}) scale({scale:.6f})">{inner}</g>'


# ---------------------------------------------------------------------------
# Standalone pieces
# ---------------------------------------------------------------------------
def build_wordmark(color, tag):
    pad = 28
    g, w, h = wordmark_paths(color, 170)
    W, H = w + 2 * pad, h + 2 * pad
    body = f'<g transform="translate({pad},{pad})">{g}</g>'
    write(f"wordmark-{tag}.svg", svg(W, H, body))
    return W


def build_monogram(color, tag):
    size, track, pad = 320, -0.015, 20
    w, asc, desc = text_vmetrics("AR", size, track, *MONO_FONT)
    g, _ = text_paths("AR", size, track, color, *MONO_FONT)
    W, H = w + 2 * pad, asc + desc + 2 * pad
    body = f'<g transform="translate({pad},{pad + asc})">{g}</g>'
    write(f"monogram-ar-{tag}.svg", svg(W, H, body))


def build_mountains(color, tag):
    pad = 24
    scale = 1.0
    W = MTN_W * scale + 2 * pad
    ink_h = (MTN_INK_BOT - MTN_INK_TOP) * scale
    H = ink_h + 2 * pad
    body = (f'<g transform="translate({pad},{pad - MTN_INK_TOP * scale}) scale({scale})">'
            f'{mountains(color)}</g>')
    write(f"mark-mountains-{tag}.svg", svg(W, H, body))


# ---------------------------------------------------------------------------
# Primary stacked lockup: mountains / ATLAS ROUGE / divider / tagline
# ---------------------------------------------------------------------------
def build_primary(wm_color, tag_color, divider_color, tag, bg=None):
    WM_H = 170        # custom ATLAS cap height
    TAG = 52          # tagline size
    TAG_TRACK = 0.05
    PAD = 56

    wm_g, wm_w, wm_h = wordmark_paths(wm_color, WM_H)

    tag_str = "Luxury Real Estate — Marrakech"
    tag_w, tag_asc, tag_desc = text_vmetrics(tag_str, TAG, TAG_TRACK, *TAGLINE_FONT)
    tag_g, _ = text_paths(tag_str, TAG, TAG_TRACK, tag_color, *TAGLINE_FONT)

    # mountains scaled to a fraction of wordmark width
    mtn_w = wm_w * 0.46
    mtn_scale = mtn_w / MTN_W
    mtn_h = (MTN_INK_BOT - MTN_INK_TOP) * mtn_scale

    # vertical rhythm
    gap_mtn = wm_h * 0.42
    gap_div = wm_h * 0.34
    gap_tag = wm_h * 0.30
    div_w = wm_w * 0.13
    div_sw = 2.2

    content_w = wm_w
    W = content_w + 2 * PAD
    cx = PAD + content_w / 2

    y = PAD
    body = []
    # mountains (centered)
    mtn_x = cx - mtn_w / 2
    body.append(f'<g transform="translate({mtn_x:.2f},{y - MTN_INK_TOP * mtn_scale:.2f}) '
                f'scale({mtn_scale:.5f})">{mountains(wm_color)}</g>')
    y += mtn_h + gap_mtn
    # wordmark (centered)
    wm_x = cx - wm_w / 2
    body.append(f'<g transform="translate({wm_x:.2f},{y:.2f})">{wm_g}</g>')
    y += wm_h + gap_div
    # divider
    body.append(f'<line x1="{cx - div_w/2:.2f}" y1="{y:.2f}" x2="{cx + div_w/2:.2f}" '
                f'y2="{y:.2f}" stroke="{divider_color}" stroke-width="{div_sw}" '
                f'stroke-linecap="round"/>')
    y += gap_tag
    # tagline (centered)
    tag_x = cx - tag_w / 2
    body.append(f'<g transform="translate({tag_x:.2f},{y + tag_asc:.2f})">{tag_g}</g>')
    y += tag_asc + tag_desc
    H = y + PAD

    write(f"logo-primary-{tag}.svg", svg(W, H, "".join(body), bg=bg))
    return W, H


def build_logo_16x9(wm_color, tag_color, divider_color, tag, bg):
    """Presentation artboard for brand reviews: exact 16:9, mark only."""
    W, H = 1920, 1080
    WM_H = 126
    TAG = 42
    TAG_TRACK = 0.05

    wm_g, wm_w, wm_h = wordmark_paths(wm_color, WM_H)

    tag_str = "Luxury Real Estate — Marrakech"
    tag_w, tag_asc, tag_desc = text_vmetrics(tag_str, TAG, TAG_TRACK, *TAGLINE_FONT)
    tag_g, _ = text_paths(tag_str, TAG, TAG_TRACK, tag_color, *TAGLINE_FONT)

    mtn_w = wm_w * 0.40
    mtn_scale = mtn_w / MTN_W
    mtn_h = (MTN_INK_BOT - MTN_INK_TOP) * mtn_scale

    gap_mtn = 92
    gap_div = 58
    gap_tag = 45
    div_w = wm_w * 0.095
    div_sw = 2.0

    group_h = mtn_h + gap_mtn + wm_h + gap_div + gap_tag + tag_asc + tag_desc
    y = (H - group_h) / 2 - 10
    cx = W / 2
    body = []

    mtn_x = cx - mtn_w / 2
    body.append(f'<g transform="translate({mtn_x:.2f},{y - MTN_INK_TOP * mtn_scale:.2f}) '
                f'scale({mtn_scale:.5f})">{mountains(wm_color, sw=5.6)}</g>')
    y += mtn_h + gap_mtn

    wm_x = cx - wm_w / 2
    body.append(f'<g transform="translate({wm_x:.2f},{y:.2f})">{wm_g}</g>')
    y += wm_h + gap_div

    body.append(f'<line x1="{cx - div_w/2:.2f}" y1="{y:.2f}" x2="{cx + div_w/2:.2f}" '
                f'y2="{y:.2f}" stroke="{divider_color}" stroke-width="{div_sw}" '
                f'stroke-linecap="round"/>')
    y += gap_tag

    tag_x = cx - tag_w / 2
    body.append(f'<g transform="translate({tag_x:.2f},{y + tag_asc:.2f})">{tag_g}</g>')

    write(f"logo-16x9-{tag}.svg", svg(W, H, "".join(body), bg=bg))


def build_kit_preview():
    W, H = 1600, 1880
    body = [
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>',
        '<text x="64" y="72" fill="#9A8A72" font-family="Arial, sans-serif" '
        'font-size="18" font-weight="700" letter-spacing="6">ATLAS ROUGE - VECTOR ASSET KIT</text>',
        '<text x="64" y="122" fill="#B39D80" font-family="Arial, sans-serif" '
        'font-size="15" font-weight="700" letter-spacing="5">PRIMARY LOCKUP - TERRACOTTA ON LIGHT</text>',
        '<rect x="64" y="148" width="1472" height="420" rx="8" fill="#F6EEE1" stroke="#D8C3A5"/>',
        inline_svg_asset("logo-primary-on-cream.svg", 184, 222, 1232, 290),
        '<text x="64" y="626" fill="#B39D80" font-family="Arial, sans-serif" '
        'font-size="15" font-weight="700" letter-spacing="5">REVERSE - ON DARK</text>',
        f'<rect x="64" y="650" width="1472" height="410" rx="8" fill="{NEAR_BLACK}"/>',
        inline_svg_asset("logo-primary-reverse.svg", 184, 722, 1232, 290),
        '<text x="64" y="1120" fill="#B39D80" font-family="Arial, sans-serif" '
        'font-size="15" font-weight="700" letter-spacing="5">STANDALONE MARKS</text>',
    ]

    cards = [
        ("wordmark-terracotta.svg", "WORDMARK"),
        ("monogram-ar-terracotta.svg", "AR MONOGRAM"),
        ("mark-mountains-terracotta.svg", "MOUNTAIN MARK"),
    ]
    card_w, card_h, gap = 454, 230, 26
    y = 1148
    for i, (file, label) in enumerate(cards):
        x = 64 + i * (card_w + gap)
        body.append(f'<rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="8" fill="#F6EEE1" stroke="#D8C3A5"/>')
        body.append(inline_svg_asset(file, x + 52, y + 42, card_w - 104, 110))
        body.append(f'<text x="{x + card_w / 2}" y="{y + 178}" text-anchor="middle" fill="#B39D80" '
                    'font-family="Arial, sans-serif" font-size="13" font-weight="700" '
                    f'letter-spacing="3">{label}</text>')

    body.append('<text x="64" y="1458" fill="#B39D80" font-family="Arial, sans-serif" '
                'font-size="15" font-weight="700" letter-spacing="5">PALETTE</text>')
    palette = [
        ("Terracotta", TERRA),
        ("Midnight", MID),
        ("Near-black", NEAR_BLACK),
        ("Sand", SAND),
        ("Cream", CREAM),
    ]
    swatch_w, swatch_h = 278, 118
    for i, (name, color) in enumerate(palette):
        x = 64 + i * (swatch_w + 22)
        y = 1490
        body.append(f'<rect x="{x}" y="{y}" width="{swatch_w}" height="{swatch_h}" rx="8" fill="#F6EEE1" stroke="#D8C3A5"/>')
        body.append(f'<rect x="{x}" y="{y}" width="{swatch_w}" height="78" rx="8" fill="{color}"/>')
        body.append(f'<path d="M {x} {y + 70} H {x + swatch_w} V {y + 82} H {x} Z" fill="{color}"/>')
        body.append(f'<text x="{x + 12}" y="{y + 98}" fill="{MID}" font-family="Arial, sans-serif" '
                    f'font-size="16" font-weight="700">{name}</text>')
        body.append(f'<text x="{x + 12}" y="{y + 116}" fill="{MID}" font-family="Arial, sans-serif" '
                    f'font-size="14" font-weight="700">{color}</text>')

    write("kit-preview.svg", svg(W, H, "".join(body)))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("Building Atlas Rouge vector assets...")

    # standalone pieces
    build_wordmark(TERRA, "terracotta")
    build_wordmark(MID, "midnight")
    build_wordmark(CREAM, "cream")

    build_mountains(TERRA, "terracotta")
    build_mountains(MID, "midnight")
    build_mountains(CREAM, "cream")

    build_monogram(TERRA, "terracotta")
    build_monogram(MID, "midnight")
    build_monogram(CREAM, "cream")

    # full lockups
    build_primary(TERRA, MID, TERRA, "terracotta")          # on light, transparent bg
    build_primary(CREAM, SAND, TERRA, "reverse")            # on dark, transparent bg
    build_primary(TERRA, MID, TERRA, "on-cream", bg=CREAM)  # preview on cream
    build_logo_16x9(TERRA, MID, TERRA, "on-cream", bg=CREAM)
    build_logo_16x9(CREAM, SAND, TERRA, "reverse", bg=NEAR_BLACK)
    build_kit_preview()

    print("Done.")
