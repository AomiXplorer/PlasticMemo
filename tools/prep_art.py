#!/usr/bin/env python3
"""Download generated art, key out the chroma green, crop, and export webp."""
import io, os, sys, json, urllib.request
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw_art')

def fetch(url, name):
    os.makedirs(RAW, exist_ok=True)
    path = os.path.join(RAW, name)
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
            f.write(r.read())
    return path

def key_green(img, tol_green=1.18, threshold=26):
    img = img.convert('RGBA')
    a = np.asarray(img).astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    greenness = g - np.maximum(r, b)
    alpha = np.clip((threshold - greenness) / float(threshold), 0.0, 1.0)
    # solidify the background early
    alpha[(g > 90) & (greenness > 45)] = 0.0
    new = a.copy()
    # despill: pull green down toward the neighbour channels on translucent pixels
    edge = alpha < 1.0
    cap = ((r + b) // 2 + 8)
    new[:, :, 1] = np.where(edge, np.minimum(g, cap), g)
    new[:, :, 3] = (alpha * 255).astype(np.int16)
    return Image.fromarray(np.clip(new, 0, 255).astype(np.uint8), 'RGBA')

def trim_alpha(img, pad=6):
    bbox = img.split()[3].getbbox()
    if not bbox: return img
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))

def report(img):
    arr = np.asarray(img)
    al = arr[:, :, 3]
    green = (arr[:, :, 1].astype(int) - np.maximum(arr[:, :, 0], arr[:, :, 2]).astype(int))
    leftover = int(((al > 40) & (green > 40)).sum())
    return {'size': img.size, 'opaque_pct': round(float((al > 200).mean() * 100), 1), 'green_leftover': leftover}

def do_sprite(url, who, expr, height=1400):
    name = f'sprite_{who}_{expr}.png'
    src = fetch(url, name)
    img = Image.open(src)
    keyed = trim_alpha(key_green(img))
    scale = height / keyed.height
    if scale < 1:
        keyed = keyed.resize((max(1, int(keyed.width * scale)), height), Image.LANCZOS)
    out_dir = os.path.join(ROOT, 'assets', 'sprites', who)
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, expr + '.webp')
    keyed.save(out, 'WEBP', quality=90, method=6)
    return {name: report(keyed), 'out': os.path.relpath(out, ROOT), 'kb': round(os.path.getsize(out) / 1024, 1)}

def do_cg(url, bid, width=1600):
    name = f'cg_{bid}.png'
    src = fetch(url, name)
    img = Image.open(src).convert('RGB')
    target = (width, int(round(width * 9 / 16)))
    sw, sh = img.size
    tr = target[0] / target[1]; sr = sw / sh
    if sr > tr:
        nw = int(sh * tr); img = img.crop(((sw - nw) // 2, 0, (sw + nw) // 2, sh))
    else:
        nh = int(sw / tr); img = img.crop((0, (sh - nh) // 2, sw, (sh + nh) // 2))
    img = img.resize(target, Image.LANCZOS)
    out_dir = os.path.join(ROOT, 'assets', 'cg')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, bid + '.webp')
    img.save(out, 'WEBP', quality=86, method=6)
    return {'out': os.path.relpath(out, ROOT), 'size': img.size, 'kb': round(os.path.getsize(out) / 1024, 1)}


def do_bg(url, bid, width=1600):
    name = f'bg_{bid}.png'
    src = fetch(url, name)
    img = Image.open(src).convert('RGB')
    target = (width, int(round(width * 9 / 16)))
    # cover-crop to 16:9
    sw, sh = img.size
    tr = target[0] / target[1]
    sr = sw / sh
    if sr > tr:
        nw = int(sh * tr); img = img.crop(((sw - nw) // 2, 0, (sw + nw) // 2, sh))
    else:
        nh = int(sw / tr); img = img.crop((0, (sh - nh) // 2, sw, (sh + nh) // 2))
    img = img.resize(target, Image.LANCZOS)
    out_dir = os.path.join(ROOT, 'assets', 'bg')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, bid + '.webp')
    img.save(out, 'WEBP', quality=84, method=6)
    return {'out': os.path.relpath(out, ROOT), 'size': img.size, 'kb': round(os.path.getsize(out) / 1024, 1)}

if __name__ == '__main__':
    mode = sys.argv[1]
    payload = json.loads(sys.argv[2])
    results = []
    for item in payload:
        if mode == 'sprite':
            results.append(do_sprite(item['url'], item['who'], item['expr']))
        elif mode == 'cg':
            results.append(do_cg(item['url'], item['id']))
        else:
            results.append(do_bg(item['url'], item['id']))
    print(json.dumps(results, indent=1))
