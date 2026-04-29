#!/usr/bin/env python3
"""Generate MilkyPot Open Graph images (1200x630)."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, shutil, sys

BASE = '/home/user/1'
OUT_CARDAPIO = f'{BASE}/images/og-cardapio.jpg'
OUT_HOME     = f'{BASE}/images/og-home.jpg'
LOGO_PATH    = f'{BASE}/images/logo-milkypot.png'

W, H = 1200, 630

# ── Brand palette ──────────────────────────────────────────────────────────────
DARK_PURPLE = (90,  69, 112)   # #5A4570
PINK        = (233, 30, 140)   # #E91E8C
SKY         = (66, 165, 245)   # #42A5F5
WHITE       = (255, 255, 255)
CREAM       = (255, 248, 253)

# Gradient stops: light lavender → light pink
BG_TOP    = (240, 228, 255)    # #F0E4FF
BG_BOTTOM = (255, 220, 242)    # #FFDCF2

# ── Fonts ──────────────────────────────────────────────────────────────────────
FONT_BOLD   = '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'
FONT_NORMAL = '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
FONT_EMOJI  = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_gradient_bg(draw):
    for y in range(H):
        t = y / (H - 1)
        col = lerp_color(BG_TOP, BG_BOTTOM, t)
        draw.line([(0, y), (W, y)], fill=col)

def draw_bokeh(img):
    """Soft semi-transparent decorative circles."""
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    circles = [
        # (cx, cy, r, color, alpha)
        (  60,  60, 120, PINK,        28),
        (1150, 100, 100, DARK_PURPLE, 22),
        (  80, 560,  90, SKY,         30),
        (1130, 570, 110, PINK,        22),
        ( 600,  30, 140, SKY,         18),
        ( 600, 610, 120, DARK_PURPLE, 14),
    ]
    for cx, cy, r, col, a in circles:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col + (a,))
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=30))
    img.paste(Image.alpha_composite(
        Image.new('RGBA', (W, H), (0, 0, 0, 0)), blurred), mask=blurred.split()[3])

def draw_bottom_bar(draw):
    bar_h = 8
    for x in range(W):
        t = x / (W - 1)
        col = lerp_color(DARK_PURPLE, PINK, t)
        draw.line([(x, H - bar_h), (x, H)], fill=col)

def draw_top_accent(draw):
    for x in range(W):
        t = x / (W - 1)
        col = lerp_color(PINK, SKY, t)
        draw.line([(x, 0), (x, 6)], fill=col)

def paste_logo(img):
    logo = Image.open(LOGO_PATH).convert('RGBA')
    target_h = 195
    target_w = int(logo.width * target_h / logo.height)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)
    x = (W - target_w) // 2
    y = 38
    # subtle shadow
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow_layer = Image.new('RGBA', logo.size, (0, 0, 0, 0))
    shadow_alpha = logo.split()[3].point(lambda p: int(p * 0.25))
    shadow_layer.putalpha(shadow_alpha)
    shadow.paste(shadow_layer, (x + 4, y + 6))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))
    img.paste(shadow, (0, 0), shadow.split()[3])
    img.paste(logo, (x, y), logo.split()[3])
    return y + target_h  # bottom of logo

def center_x(draw, text, font, canvas_w=W):
    bb = draw.textbbox((0, 0), text, font=font)
    return (canvas_w - (bb[2] - bb[0])) // 2

def text_h(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]

def draw_divider(draw, y, width=500):
    x0 = (W - width) // 2
    x1 = x0 + width
    for x in range(x0, x1 + 1):
        t = (x - x0) / (x1 - x0)
        col = lerp_color(DARK_PURPLE, PINK, t)
        draw.point((x, y), fill=col)
    draw.line([(x0, y), (x1, y)], fill=None)  # already drawn via points

def draw_pill(draw, cx, cy, w, h, col):
    r = h // 2
    draw.rounded_rectangle([cx - w//2, cy - h//2, cx + w//2, cy + h//2],
                            radius=r, fill=col + (200,))

def build_image(title_line2="Cardápio Online"):
    img = Image.new('RGB', (W, H), BG_TOP)
    rgba = img.convert('RGBA')

    draw_rgba = ImageDraw.Draw(rgba)
    draw_gradient_bg(draw_rgba)

    # bokeh blobs
    bokeh_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh_overlay)
    circles = [
        (  55,  55, 120, PINK,        30),
        (1150,  90, 100, DARK_PURPLE, 24),
        (  75, 555,  90, SKY,         32),
        (1130, 560, 110, PINK,        24),
        ( 600,  25, 140, SKY,         20),
    ]
    for cx, cy, r, col, a in circles:
        bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col + (a,))
    blurred = bokeh_overlay.filter(ImageFilter.GaussianBlur(radius=36))
    rgba = Image.alpha_composite(rgba, blurred)

    # ── Frosted card behind text ────────────────────────────────────────────
    card = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([100, 255, 1100, 590], radius=28,
                         fill=(255, 255, 255, 120))
    rgba = Image.alpha_composite(rgba, card)

    # ── Convert back and draw text ──────────────────────────────────────────
    img = rgba.convert('RGB')
    draw = ImageDraw.Draw(img)

    # Top & bottom accent bars
    draw_top_accent(draw)
    draw_bottom_bar(draw)

    # ── Logo ────────────────────────────────────────────────────────────────
    logo_bottom = paste_logo(img)
    draw = ImageDraw.Draw(img)  # refresh after paste

    # ── Fonts ───────────────────────────────────────────────────────────────
    f_brand   = ImageFont.truetype(FONT_BOLD,   62)
    f_sub     = ImageFont.truetype(FONT_BOLD,   34)
    f_items   = ImageFont.truetype(FONT_NORMAL, 28)
    f_phone   = ImageFont.truetype(FONT_BOLD,   30)
    # Noto Color Emoji only ships as 109px bitmap
    f_emoji   = ImageFont.truetype(FONT_EMOJI,  109)

    # ── Render emoji into a small RGBA tile, then resize to cap height ──────
    EMOJI_TARGET_H = 58   # match title cap height visually
    tmp_em = Image.new('RGBA', (150, 150), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp_em)
    bb_em_raw = td.textbbox((0, 0), "🍨", font=f_emoji)
    raw_ew = bb_em_raw[2] - bb_em_raw[0]
    raw_eh = bb_em_raw[3] - bb_em_raw[1]
    td.text((-bb_em_raw[0], -bb_em_raw[1]), "🍨", font=f_emoji,
            embedded_color=True)
    emoji_tile = tmp_em.crop((0, 0, raw_ew, raw_eh))
    scale = EMOJI_TARGET_H / raw_eh
    emoji_tile = emoji_tile.resize(
        (max(1, int(raw_ew * scale)), EMOJI_TARGET_H), Image.LANCZOS)
    ew, eh = emoji_tile.size

    # ── Title row: "MilkyPot" [🍨] "Cardápio Online" ─────────────────────
    title_y = logo_bottom + 16

    brand_text  = "MilkyPot"
    line2_text  = title_line2

    bb_brand = draw.textbbox((0, 0), brand_text, font=f_brand)
    bw = bb_brand[2] - bb_brand[0]
    bh = bb_brand[3] - bb_brand[1]

    bb_line2 = draw.textbbox((0, 0), line2_text, font=f_brand)
    lw = bb_line2[2] - bb_line2[0]

    gap = 12
    total_w = bw + gap + ew + gap + lw
    start_x = (W - total_w) // 2

    # draw each piece
    draw.text((start_x, title_y), brand_text, font=f_brand, fill=DARK_PURPLE)
    ex = start_x + bw + gap
    # paste emoji tile (vertically centered on the cap height of text)
    ey = title_y + (bh - eh) // 2
    img.paste(emoji_tile, (ex, ey), emoji_tile.split()[3])
    draw = ImageDraw.Draw(img)
    draw.text((ex + ew + gap, title_y), line2_text, font=f_brand, fill=PINK)

    # ── Divider ─────────────────────────────────────────────────────────────
    div_y = title_y + bh + 18
    for xi in range((W - 480) // 2, (W + 480) // 2 + 1):
        t = (xi - (W - 480) // 2) / 480
        draw.point((xi, div_y), fill=lerp_color(DARK_PURPLE, PINK, t))

    # ── Subtitle (items) ────────────────────────────────────────────────────
    subtitle = "Milkshakes  •  Potinhos  •  Açaí  •  Zero/Fit"
    sub_x = center_x(draw, subtitle, f_items)
    sub_y = div_y + 16
    # draw with color alternation per segment
    segments = ["Milkshakes", "  •  ", "Potinhos", "  •  ", "Açaí", "  •  ", "Zero/Fit"]
    colors   = [DARK_PURPLE, PINK, DARK_PURPLE, PINK, DARK_PURPLE, PINK, DARK_PURPLE]
    # measure full to center
    full_bb = draw.textbbox((0, 0), "".join(segments), font=f_items)
    full_w  = full_bb[2] - full_bb[0]
    cx_start = (W - full_w) // 2
    cur_x = cx_start
    for seg, col in zip(segments, colors):
        draw.text((cur_x, sub_y), seg, font=f_items, fill=col)
        bb = draw.textbbox((0, 0), seg, font=f_items)
        cur_x += bb[2] - bb[0]

    # ── WhatsApp pill ───────────────────────────────────────────────────────
    phone_text = "WhatsApp  (43) 99804-2424"
    phone_y    = sub_y + text_h(draw, subtitle, f_items) + 22

    bb_ph = draw.textbbox((0, 0), phone_text, font=f_phone)
    ph_w  = bb_ph[2] - bb_ph[0]
    ph_h  = bb_ph[3] - bb_ph[1]
    pill_pad_x, pill_pad_y = 28, 12
    pill_x0 = (W - ph_w) // 2 - pill_pad_x
    pill_y0 = phone_y - pill_pad_y
    pill_x1 = pill_x0 + ph_w + pill_pad_x * 2
    pill_y1 = pill_y0 + ph_h + pill_pad_y * 2

    # pill background
    pill_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill_img)
    pd.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1],
                         radius=(pill_y1 - pill_y0) // 2,
                         fill=DARK_PURPLE + (210,))
    img.paste(Image.alpha_composite(img.convert('RGBA'), pill_img).convert('RGB'),
              box=None)
    draw = ImageDraw.Draw(img)
    draw.text(((W - ph_w) // 2, phone_y), phone_text, font=f_phone, fill=WHITE)

    return img

# ── Generate both images ───────────────────────────────────────────────────────
print("Generating og-cardapio.jpg …")
cardapio = build_image(title_line2="Cardápio Online")
cardapio.save(OUT_CARDAPIO, 'JPEG', quality=95, subsampling=0)
print(f"  saved → {OUT_CARDAPIO}")

print("Copying to og-home.jpg …")
shutil.copy2(OUT_CARDAPIO, OUT_HOME)
print(f"  saved → {OUT_HOME}")

print("Done!")
