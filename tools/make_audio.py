#!/usr/bin/env python3
"""Composes every BGM loop, ambience bed and sound effect used by the game.

Pure numpy synthesis, exported to OGG with ffmpeg. Nothing is sampled from
anywhere: each cue is a short generative piece written for this project.
"""
import math
import os
import subprocess
import wave

import numpy as np

SR = 22050
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio')
rng = np.random.default_rng(20490413)


# --------------------------------------------------------------------- helpers
def secs(s):
    return int(SR * s)


def tt(n):
    return np.arange(n) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ramp(n, a=0.005, r=0.02):
    e = np.ones(n)
    na, nr = max(1, int(SR * a)), max(1, int(SR * r))
    na, nr = min(na, n), min(nr, n)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def piano(freq, dur, amp=0.5, bright=1.0, detune=0.0):
    n = secs(dur)
    t = tt(n) + detune
    out = np.zeros(n)
    for k, w in enumerate([1.0, 0.42, 0.20, 0.10, 0.05, 0.025], start=1):
        decay = np.exp(-t * (1.1 + 0.55 * k) )
        out += (w / (k ** 0.35)) * np.sin(2 * np.pi * freq * k * t * (1 + 0.0007 * k)) * decay
    out *= ramp(n, 0.004, 0.05) * amp * bright
    return out


def felt(freq, dur, amp=0.4):
    """soft electric piano: fewer partials, longer body, gentle tremolo."""
    n = secs(dur)
    t = tt(n)
    out = np.zeros(n)
    for k, w in [(1, 1.0), (2, 0.30), (3, 0.12), (4, 0.05)]:
        out += w * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (0.9 + 0.3 * k))
    out *= (1 + 0.08 * np.sin(2 * np.pi * 4.2 * t))
    return out * ramp(n, 0.01, 0.08) * amp


def pad(freq, dur, amp=0.2):
    n = secs(dur)
    t = tt(n)
    vib = 1 + 0.0025 * np.sin(2 * np.pi * 0.7 * t)
    out = (np.sin(2 * np.pi * freq * t * vib)
           + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
           + 0.18 * np.sin(2 * np.pi * freq * 3.01 * t))
    env_ = np.minimum(1, t / 1.1) * np.minimum(1, np.maximum(0, (dur - t) / 1.4))
    return out * env_ * amp


def bass(freq, dur, amp=0.35):
    n = secs(dur)
    t = tt(n)
    out = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2 * t)
    return out * np.exp(-t * 1.4) * ramp(n, 0.006, 0.05) * amp


def place(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i >= len(buf) or j <= i:
        return
    buf[i:j] += sig[:j - i]


def reverb(x, amount=0.35):
    out = x.copy()
    for delay, gain in [(0.113, 0.34), (0.179, 0.22), (0.263, 0.14), (0.401, 0.08)]:
        d = secs(delay)
        if d < len(x):
            out[d:] += x[:-d] * gain * amount
    return out


def stereo(x, width=0.006, mix=0.75):
    d = secs(width)
    left = x
    right = np.concatenate([np.zeros(d), x[:-d]]) * mix + x * (1 - mix)
    return np.stack([left, right], axis=1)


def spectral(x, shape):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = X * shape(f)
    return np.fft.irfft(X, len(x))


def lp(fc):
    return lambda f: 1 / (1 + (f / fc) ** 2)


def hp(fc):
    return lambda f: (f / fc) ** 2 / (1 + (f / fc) ** 2)


def bp(lo, hi):
    return lambda f: (1 / (1 + (f / lo) ** 2)) * ((f / hi) ** 2 / (1 + (f / hi) ** 2))


def noise(dur, color='white'):
    n = secs(dur)
    if color == 'white':
        return rng.standard_normal(n)
    if color == 'pink':
        return spectral(rng.standard_normal(n), lambda f: 1 / np.sqrt(np.maximum(f, 1)))
    return np.cumsum(rng.standard_normal(n)) * 0.05  # brown


def write(name, data, q=3):
    path_wav = os.path.join(OUT, '_tmp.wav')
    os.makedirs(os.path.dirname(os.path.join(OUT, name)), exist_ok=True)
    x = np.asarray(data)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.88
    pcm = (x * 32767).astype('<i2')
    with wave.open(path_wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, name)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path_wav,
                    '-c:a', 'libvorbis', '-q:a', str(q), out], check=True)
    os.remove(path_wav)
    return round(os.path.getsize(out) / 1024, 1)


# --------------------------------------------------------------------- BGM
BGM = {
    # name: (bpm, bars of 4, progression in midi, texture)
    'midnight_radio': (62, 8, [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], 'arp'),
    'little_things':  (92, 8, [[48, 52, 55], [55, 59, 62], [57, 60, 64], [52, 55, 59]], 'walk'),
    'rain_piano':     (54, 8, [[57, 60, 64], [52, 56, 59], [53, 57, 60], [48, 52, 55]], 'arp'),
    'warm_town':      (84, 8, [[53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64]], 'walk'),
    'holding_on':     (70, 8, [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], 'arp'),
    'thirteen':       (58, 8, [[57, 60, 64], [50, 53, 57], [52, 56, 59], [57, 60, 64]], 'sparse'),
    'summer_light':   (100, 8, [[55, 59, 62], [50, 54, 57], [52, 55, 59], [48, 52, 55]], 'walk'),
    'last_broadcast': (66, 8, [[48, 52, 55], [57, 60, 64], [53, 57, 60], [55, 59, 62]], 'arp'),
    'empty_room':     (50, 8, [[57, 60, 64], [53, 57, 60], [57, 60, 64], [52, 56, 59]], 'sparse'),
    'new_signal':     (76, 8, [[53, 57, 60], [55, 59, 62], [57, 60, 64], [57, 60, 64]], 'walk'),
}


def build_bgm(name, bpm, bars, prog, texture):
    beat = 60 / bpm
    bar = beat * 4
    total = bars * bar
    tail = 3.0
    buf = np.zeros(secs(total + tail))

    for b in range(bars):
        chord = prog[b % len(prog)]
        t0 = b * bar
        # left hand
        place(buf, bass(midi(chord[0] - 12), bar * 0.9, 0.30), t0)
        # sustained pad, quieter
        for note in chord:
            place(buf, pad(midi(note), bar * 1.05, 0.055), t0)

        if texture == 'arp':
            pattern = [0, 1, 2, 1, 2, 1, 0, 1]
            for i, idx in enumerate(pattern):
                at = t0 + i * (bar / len(pattern))
                place(buf, piano(midi(chord[idx % len(chord)] + 12), 1.9, 0.30), at)
        elif texture == 'walk':
            pattern = [0, 2, 1, 2, 0, 1, 2, 1]
            for i, idx in enumerate(pattern):
                at = t0 + i * (bar / len(pattern))
                place(buf, felt(midi(chord[idx % len(chord)] + 12), 1.5, 0.26), at)
            for i in range(2):
                place(buf, felt(midi(chord[0] + 24), 0.9, 0.12), t0 + bar * 0.5 * i)
        else:  # sparse
            place(buf, piano(midi(chord[0] + 12), 3.4, 0.30), t0 + 0.15)
            place(buf, piano(midi(chord[2] + 12), 3.0, 0.20), t0 + beat * 1.6)
            place(buf, piano(midi(chord[1] + 24), 2.4, 0.13), t0 + beat * 2.7)

    buf = reverb(buf, 0.42)
    # fold the tail back into the head so the loop has no seam
    n = secs(total)
    body = buf[:n].copy()
    tailpart = buf[n:]
    body[:len(tailpart)] += tailpart
    return stereo(body, 0.007, 0.7)


# --------------------------------------------------------------------- ambience
def build_amb(name):
    dur = 24.0
    n = secs(dur)
    t = tt(n)

    if name.startswith('rain'):
        heavy = name.endswith('heavy')
        base = spectral(rng.standard_normal(n), bp(500 if heavy else 900, 9000 if heavy else 7000))
        base *= 0.22
        flutter = 1 + 0.1 * np.sin(2 * np.pi * 0.11 * t) + 0.05 * np.sin(2 * np.pi * 0.37 * t)
        drops = np.zeros(n)
        for _ in range(int(28 if heavy else 16)):
            at = rng.uniform(0, dur - 0.4)
            f = rng.uniform(900, 2600)
            ln = secs(0.09)
            drops[int(at * SR):int(at * SR) + ln] += np.sin(2 * np.pi * f * tt(ln)) * np.exp(-tt(ln) * 40) * 0.09
        return stereo(base * flutter + drops, 0.004, 0.6)

    if name == 'waves':
        base = spectral(rng.standard_normal(n), bp(180, 1400)) * 0.35
        swell = (0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 9 - 1.2))) ** 1.6
        return stereo(base * swell, 0.009, 0.7)

    if name == 'train':
        rumble = spectral(rng.standard_normal(n), lp(220)) * 0.30
        clack = np.zeros(n)
        period = 0.72
        k = 0.0
        while k < dur:
            ln = secs(0.06)
            i = int(k * SR)
            burst = rng.standard_normal(ln) * np.exp(-tt(ln) * 60) * 0.12
            clack[i:i + ln] += burst[:max(0, min(ln, n - i))]
            k += period
        hum = 0.02 * np.sin(2 * np.pi * 58 * t)
        return stereo(rumble + clack + hum, 0.005, 0.65)

    if name == 'city_night':
        base = spectral(rng.standard_normal(n), lp(700)) * 0.26
        base += spectral(rng.standard_normal(n), bp(120, 500)) * 0.10
        mod = 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t)
        return stereo(base * mod, 0.008, 0.7)

    if name == 'festival':
        base = spectral(rng.standard_normal(n), bp(300, 2200)) * 0.17
        murmur = spectral(rng.standard_normal(n), bp(200, 900)) * 0.10
        mod = 0.75 + 0.25 * np.sin(2 * np.pi * 0.09 * t + 1.1)
        bells = np.zeros(n)
        for _ in range(6):
            at = rng.uniform(0, dur - 2)
            f = rng.choice([1046.5, 1318.5, 1568.0])
            ln = secs(1.4)
            bells[int(at * SR):int(at * SR) + ln] += np.sin(2 * np.pi * f * tt(ln)) * np.exp(-tt(ln) * 3) * 0.05
        return stereo((base + murmur) * mod + bells, 0.007, 0.65)

    if name == 'crowd_cafe':
        base = spectral(rng.standard_normal(n), bp(250, 1800)) * 0.14
        voice = spectral(rng.standard_normal(n), bp(180, 700)) * 0.10
        mod = 0.7 + 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t))
        clink = np.zeros(n)
        for _ in range(4):
            at = rng.uniform(0, dur - 1)
            ln = secs(0.35)
            clink[int(at * SR):int(at * SR) + ln] += np.sin(2 * np.pi * 2400 * tt(ln)) * np.exp(-tt(ln) * 12) * 0.03
        return stereo((base + voice) * mod + clink, 0.006, 0.6)

    # room_quiet
    base = spectral(rng.standard_normal(n), lp(400)) * 0.05
    hum = 0.012 * np.sin(2 * np.pi * 50 * t) + 0.006 * np.sin(2 * np.pi * 100 * t)
    return stereo(base + hum, 0.004, 0.6)


# --------------------------------------------------------------------- SFX
def build_sfx(name):
    if name == 'click':
        n = secs(0.06)
        x = rng.standard_normal(n) * np.exp(-tt(n) * 180) * 0.6
        return x
    if name == 'page':
        n = secs(0.28)
        x = spectral(rng.standard_normal(n), bp(900, 6000)) * np.exp(-tt(n) * 12) * 0.45
        return x
    if name == 'beep':
        n = secs(0.12)
        x = np.sign(np.sin(2 * np.pi * 1180 * tt(n))) * 0.22
        return x * ramp(n, 0.006, 0.03)
    if name == 'notify':
        out = np.zeros(secs(0.5))
        place(out, np.sin(2 * np.pi * 880 * tt(secs(0.12))) * 0.22 * ramp(secs(0.12), 0.005, 0.04), 0.0)
        place(out, np.sin(2 * np.pi * 1320 * tt(secs(0.2))) * 0.20 * ramp(secs(0.2), 0.005, 0.08), 0.13)
        return out
    if name == 'radio_on':
        n = secs(0.7)
        t = tt(n)
        static = spectral(rng.standard_normal(n), bp(600, 7000)) * 0.20 * np.exp(-t * 5)
        hum = 0.10 * np.sin(2 * np.pi * 120 * t) * np.minimum(1, t / 0.1)
        return static + hum
    if name == 'radio_static':
        n = secs(1.1)
        return spectral(rng.standard_normal(n), bp(500, 8000)) * 0.16 * ramp(n, 0.02, 0.2)
    if name == 'radio_switch':
        out = np.zeros(secs(0.35))
        place(out, rng.standard_normal(secs(0.03)) * np.exp(-tt(secs(0.03)) * 200) * 0.5, 0.0)
        place(out, bass(90, 0.2, 0.3), 0.02)
        return out
    if name == 'keyboard':
        out = np.zeros(secs(0.42))
        for i in range(4):
            place(out, rng.standard_normal(secs(0.03)) * np.exp(-tt(secs(0.03)) * 240) * 0.35, i * 0.09)
        return out
    if name == 'door':
        n = secs(1.0)
        t = tt(n)
        creak = np.sin(2 * np.pi * (220 - 90 * t) * t) * 0.10 * np.exp(-t * 3)
        thud = bass(70, 0.35, 0.28)
        out = creak
        place(out, thud, 0.42)
        return out
    if name == 'train_horn':
        n = secs(1.4)
        t = tt(n)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
        x = (np.sin(2 * np.pi * 233 * t * vib) + np.sin(2 * np.pi * 311 * t * vib) * 0.7)
        return x * 0.16 * ramp(n, 0.09, 0.4)
    if name == 'fireworks':
        n = secs(1.8)
        t = tt(n)
        boom = bass(52, 0.7, 0.45)
        crack = spectral(rng.standard_normal(n), bp(1200, 9000)) * np.exp(-t * 2.4) * 0.22
        out = crack
        place(out, boom, 0.02)
        for _ in range(5):
            place(out, rng.standard_normal(secs(0.02)) * 0.12, rng.uniform(0.25, 1.4))
        return out
    if name == 'heartbeat':
        out = np.zeros(secs(1.1))
        place(out, bass(48, 0.32, 0.5), 0.0)
        place(out, bass(45, 0.30, 0.35), 0.34)
        return out
    if name == 'glitch':
        n = secs(0.9)
        t = tt(n)
        x = np.sign(np.sin(2 * np.pi * (900 - 700 * t) * t)) * 0.16
        mask = (rng.random(n) > 0.55).astype(float)
        return (x * (0.4 + 0.6 * mask)) * ramp(n, 0.01, 0.25)
    if name == 'shutdown':
        n = secs(2.2)
        t = tt(n)
        x = np.sin(2 * np.pi * (700 * np.exp(-t * 1.1)) * t) * 0.22
        x += np.sin(2 * np.pi * 140 * np.exp(-t * 0.8) * t) * 0.12
        return reverb(x * ramp(n, 0.01, 0.8), 0.5)
    return None


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'bgm'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'amb'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'sfx'), exist_ok=True)
    total = 0.0
    report = []
    for name, (bpm, bars, prog, tex) in BGM.items():
        kb = write(f'bgm/{name}.ogg', build_bgm(name, bpm, bars, prog, tex), q=2)
        total += kb
        report.append(f'bgm/{name}.ogg\t{kb}kb')
    for name in ['rain_soft', 'rain_heavy', 'waves', 'train', 'city_night', 'festival', 'crowd_cafe', 'room_quiet']:
        kb = write(f'amb/{name}.ogg', build_amb(name), q=1)
        total += kb
        report.append(f'amb/{name}.ogg\t{kb}kb')
    for name in ['click', 'page', 'beep', 'notify', 'radio_on', 'radio_static', 'radio_switch',
                 'keyboard', 'door', 'train_horn', 'fireworks', 'heartbeat', 'glitch', 'shutdown']:
        data = build_sfx(name)
        kb = write(f'sfx/{name}.ogg', data, q=2)
        total += kb
        report.append(f'sfx/{name}.ogg\t{kb}kb')
    print('\n'.join(report))
    print(f'\nTOTAL AUDIO {total/1024:.1f} MB')
