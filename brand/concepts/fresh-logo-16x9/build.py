#!/usr/bin/env python3
"""
Atlas Rouge — fresh logo concept.

This concept is intentionally independent from the existing vectorized logo
kit. It uses only the owner brief: luxury real estate in Marrakech, French
investor audience, Atlas/rouge meaning, and the existing palette/type system.
"""
from __future__ import annotations

import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.abspath(os.path.join(HERE, "..", ".."))
FONTS = os.path.join(BRAND, "fonts")
OUT = os.path.join(HERE, "out")

TERRACOTTA = "#B5533A"
SAND = "#D8C3A5"
CREAM = "#F6EEE1"
MIDNIGHT = "#172033"
INK = "#0F1419"
PALM = "#315C45"

NEWSREADER = ("Newsreader.ttf", 560)
SCHIBSTED = ("SchibstedGrotesk.ttf", 520)

_cache: dict[tuple[str, int], dict] = {}


def load_font(file_name: str, weight: int) -> dict:
    key = (file_name, weight)
    if key in _cache:
        return _cache[key]

    font = TTFont(os.path.join(FONTS, file_name))
    axes = {axis.axisTag: (axis.minValue, axis.maxValue) for axis in font["fvar"].axes} if "fvar" in font else {}
    limits = {}
    if "wght" in axes:
        limits["wght"] = max(axes["wght"][0], min(weight, axes["wght"][1]))
    if "opsz" in axes:
        limits["opsz"] = axes["opsz"][1]
    if limits:
        instantiateVariableFont(font, limits, inplace=True)

    info = {
        "cmap": font.getBestCmap(),
        "glyphs": font.getGlyphSet(),
        "hmtx": font["hmtx"],
        "upem": font["head"].unitsPerEm,
    }
    _cache[key] = info
    return info


def glyph_name(info: dict, char: str) -> str | None:
    return info["cmap"].get(ord(char))


def text_metrics(text: str, size: float, tracking_em: float, file_name: str, weight: int) -> tuple[float, float, float]:
    info = load_font(file_name, weight)
    scale = size / info["upem"]
    tracking = tracking_em * size
    advance = 0.0
    ymin = ymax = 0.0

    for char in text:
        name = glyph_name(info, char)
        if name is None:
            advance += info["upem"] * 0.28 * scale + tracking
            continue
        bounds = BoundsPen(info["glyphs"])
        info["glyphs"][name].draw(bounds)
        if bounds.bounds:
            _, gymin, _, gymax = bounds.bounds
            ymin = min(ymin, gymin)
            ymax = max(ymax, gymax)
        advance += info["hmtx"][name][0] * scale + tracking

    return advance - tracking if text else 0.0, ymax * scale, -ymin * scale


def text_paths(text: str, size: float, tracking_em: float, color: str, file_name: str, weight: int) -> tuple[str, float]:
    info = load_font(file_name, weight)
    scale = size / info["upem"]
    tracking = tracking_em * size
    x = 0.0
    parts = []

    for char in text:
        name = glyph_name(info, char)
        if name is None:
            x += info["upem"] * 0.28 * scale + tracking
            continue
        pen = SVGPathPen(info["glyphs"])
        info["glyphs"][name].draw(pen)
        path = pen.getCommands()
        if path:
            parts.append(
                f'<path transform="translate({x:.3f},0) scale({scale:.6f},{-scale:.6f})" '
                f'd="{path}" fill="{color}"/>'
            )
        x += info["hmtx"][name][0] * scale + tracking

    return "".join(parts), x - tracking if text else 0.0


def text_box(text: str, visual_height: float, tracking_em: float, color: str, font: tuple[str, int]) -> tuple[str, float, float]:
    file_name, weight = font
    _, asc, desc = text_metrics(text, 1000, tracking_em, file_name, weight)
    size = 1000 * (visual_height / (asc + desc))
    width, asc, desc = text_metrics(text, size, tracking_em, file_name, weight)
    paths, _ = text_paths(text, size, tracking_em, color, file_name, weight)
    return f'<g transform="translate(0,{asc:.3f})">{paths}</g>', width, asc + desc


def svg(width: int, height: int, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" '
        f'aria-label="Atlas Rouge logo concept">{body}</svg>\n'
    )


def contour_lines(cx: float, y: float, scale: float, main: str, secondary: str) -> str:
    top = (
        f'M {cx - 350 * scale:.2f} {y + 42 * scale:.2f} '
        f'C {cx - 210 * scale:.2f} {y - 14 * scale:.2f}, {cx - 82 * scale:.2f} {y - 34 * scale:.2f}, {cx:.2f} {y - 28 * scale:.2f} '
        f'C {cx + 116 * scale:.2f} {y - 20 * scale:.2f}, {cx + 224 * scale:.2f} {y + 18 * scale:.2f}, {cx + 350 * scale:.2f} {y + 42 * scale:.2f}'
    )
    mid = (
        f'M {cx - 282 * scale:.2f} {y + 70 * scale:.2f} '
        f'C {cx - 134 * scale:.2f} {y + 34 * scale:.2f}, {cx - 42 * scale:.2f} {y + 26 * scale:.2f}, {cx + 54 * scale:.2f} {y + 36 * scale:.2f} '
        f'C {cx + 142 * scale:.2f} {y + 45 * scale:.2f}, {cx + 216 * scale:.2f} {y + 65 * scale:.2f}, {cx + 286 * scale:.2f} {y + 78 * scale:.2f}'
    )
    earth = (
        f'M {cx - 96 * scale:.2f} {y + 104 * scale:.2f} '
        f'C {cx - 38 * scale:.2f} {y + 91 * scale:.2f}, {cx + 42 * scale:.2f} {y + 91 * scale:.2f}, {cx + 96 * scale:.2f} {y + 104 * scale:.2f}'
    )
    return (
        f'<path d="{top}" fill="none" stroke="{secondary}" stroke-width="{1.6 * scale:.2f}" stroke-linecap="round"/>'
        f'<path d="{mid}" fill="none" stroke="{secondary}" stroke-width="{1.2 * scale:.2f}" stroke-linecap="round" opacity="0.70"/>'
        f'<path d="{earth}" fill="none" stroke="{main}" stroke-width="{2.8 * scale:.2f}" stroke-linecap="round"/>'
    )


def build_artboard(name: str, bg: str, atlas_color: str, rouge_color: str, small_color: str, contour_color: str) -> None:
    width, height = 1920, 1080
    cx = width / 2

    atlas, atlas_w, atlas_h = text_box("Atlas", 166, -0.035, atlas_color, NEWSREADER)
    rouge, rouge_w, rouge_h = text_box("Rouge", 166, -0.035, rouge_color, NEWSREADER)
    gap = 34
    word_w = atlas_w + gap + rouge_w
    word_h = max(atlas_h, rouge_h)

    descriptor = "IMMOBILIER DE LUXE - MARRAKECH"
    desc, desc_w, desc_h = text_box(descriptor, 24, 0.20, small_color, SCHIBSTED)

    word_y = 440
    word_x = cx - word_w / 2
    desc_y = word_y + word_h + 70
    desc_x = cx - desc_w / 2

    body = [
        f'<rect width="{width}" height="{height}" fill="{bg}"/>',
        contour_lines(cx, 305, 0.86, TERRACOTTA, contour_color),
        f'<g transform="translate({word_x:.2f},{word_y:.2f})">{atlas}</g>',
        f'<g transform="translate({word_x + atlas_w + gap:.2f},{word_y:.2f})">{rouge}</g>',
        f'<line x1="{cx - 64:.2f}" y1="{desc_y - 34:.2f}" x2="{cx + 64:.2f}" y2="{desc_y - 34:.2f}" '
        f'stroke="{TERRACOTTA}" stroke-width="2" stroke-linecap="round"/>',
        f'<g transform="translate({desc_x:.2f},{desc_y:.2f})">{desc}</g>',
    ]

    with open(os.path.join(OUT, name), "w", encoding="utf-8") as file:
        file.write(svg(width, height, "".join(body)))
    print(name)


def build_caps_artboard(name: str, bg: str, atlas_color: str, rouge_color: str, small_color: str, contour_color: str) -> None:
    width, height = 1920, 1080
    cx = width / 2

    atlas, atlas_w, atlas_h = text_box("ATLAS", 146, 0.07, atlas_color, NEWSREADER)
    rouge, rouge_w, rouge_h = text_box("ROUGE", 146, 0.07, rouge_color, NEWSREADER)
    gap = 44
    word_w = atlas_w + gap + rouge_w
    word_h = max(atlas_h, rouge_h)

    descriptor = "IMMOBILIER DE LUXE - MARRAKECH"
    desc, desc_w, _ = text_box(descriptor, 22, 0.22, small_color, SCHIBSTED)

    word_y = 456
    word_x = cx - word_w / 2
    desc_y = word_y + word_h + 78
    desc_x = cx - desc_w / 2

    body = [
        f'<rect width="{width}" height="{height}" fill="{bg}"/>',
        contour_lines(cx, 302, 0.78, TERRACOTTA, contour_color),
        f'<g transform="translate({word_x:.2f},{word_y:.2f})">{atlas}</g>',
        f'<g transform="translate({word_x + atlas_w + gap:.2f},{word_y:.2f})">{rouge}</g>',
        f'<line x1="{cx - 58:.2f}" y1="{desc_y - 36:.2f}" x2="{cx + 58:.2f}" y2="{desc_y - 36:.2f}" '
        f'stroke="{TERRACOTTA}" stroke-width="2" stroke-linecap="round"/>',
        f'<g transform="translate({desc_x:.2f},{desc_y:.2f})">{desc}</g>',
    ]

    with open(os.path.join(OUT, name), "w", encoding="utf-8") as file:
        file.write(svg(width, height, "".join(body)))
    print(name)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    build_artboard(
        "atlas-rouge-fresh-logo-16x9-light.svg",
        CREAM,
        MIDNIGHT,
        TERRACOTTA,
        MIDNIGHT,
        SAND,
    )
    build_artboard(
        "atlas-rouge-fresh-logo-16x9-dark.svg",
        INK,
        CREAM,
        TERRACOTTA,
        SAND,
        PALM,
    )
    build_caps_artboard(
        "atlas-rouge-fresh-logo-16x9-caps-light.svg",
        CREAM,
        MIDNIGHT,
        TERRACOTTA,
        MIDNIGHT,
        SAND,
    )
    build_caps_artboard(
        "atlas-rouge-fresh-logo-16x9-caps-dark.svg",
        INK,
        CREAM,
        TERRACOTTA,
        SAND,
        PALM,
    )
