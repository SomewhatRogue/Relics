"""
Makes the music's recorded instruments (public/music/*.mp3) and their map (src/client/samplemap.ts)
from three free libraries, cloned beside each other:

  VSCO 2 Community Edition (CC0)        git clone https://github.com/sgossner/VSCO-2-CE
  Versilian Community Sample Library    git clone https://github.com/sgossner/VCSL
  (CC0)
  FluidR3_GM choir, as rendered by      git clone https://github.com/gleitz/midi-js-soundfonts
  midi-js-soundfonts (CC BY 3.0)

  python3 -I scripts/make-samples.py <vsco dir> <vcsl dir> <midi-js-soundfonts dir>

Each sound is made mono, trimmed, levelled and cut short. Held sounds (strings, horn, choir, organ,
flute) get a seamless loop: the end of the loop is crossfaded into what comes before its start, and a
short tail copied from the loop's start is left past its end, so the loop stays clean even when a
browser's MP3 decoder shifts the audio by a few milliseconds. Needs numpy and ffmpeg with libmp3lame.
"""
import os, subprocess, sys
import numpy as np

SR = 44100
VSCO, VCSL, FLUID = sys.argv[1], sys.argv[2], sys.argv[3]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'music')
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def midi(name, shift=0):
    """'A#1' to a MIDI note; `shift` octaves for libraries that number a C lower than usual."""
    n = PC[name[0]] + (1 if '#' in name else 0) - (1 if name[1:2] == 'b' else 0)
    return n + 12 * (int(name.lstrip('ABCDEFG#b')) + 1 + shift)

# id: (kind, layer, [(file, root)], options). kind: 'hold' loops, 'hit' rings out and stops.
V, C, F = VSCO, VCSL, FLUID
CEL, VLN, CB = V + '/Strings/Cello Section', V + '/Strings/Violin Section', V + '/Strings/Solo Contrabass'
ORG, FR = C + '/Aerophones/Edge-blown Aerophones/Pipe Organ', C + '/Membranophones/Struck Membranophones/Frame Drum'
RECIPE = {
    'strings-p': ('hold', [(f'{CB}/SusNV/BKCtbss_SusNV_{n}_v3_rr1.wav', midi(n, 1)) for n in ['E0', 'A#0']]
                  + [(f'{CEL}/susvib/susvib_{n}_v1_1.wav', midi(n, 1)) for n in ['C1', 'G1', 'D2', 'A2']]
                  + [(f'{VLN}/susVib/VlnEns_susVib_{n}_v1.wav', midi(n, 1)) for n in ['D3', 'A3', 'E4', 'B4']], {}),
    'strings-f': ('hold', [(f'{CEL}/susvib/susvib_{n}_v3_1.wav', midi(n, 1)) for n in ['C1', 'G1', 'D2', 'A2']]
                  + [(f'{VLN}/susVib/VlnEns_susVib_{n}_v2.wav', midi(n, 1)) for n in ['D3', 'A3', 'E4', 'B4']], {}),
    'pizz': ('hit', [(f'{CEL}/pizzT/pizzT_{n}_v2_RR1.wav', midi(n, 1)) for n in ['C1', 'G1', 'D2', 'A2']]
             + [(f'{VLN}/Pizz/VlnEns_Pizz_{n}_v2_rr1.wav', midi(n, 1)) for n in ['D3', 'A3', 'E4']], {'len': 1.6}),
    'spic': ('hit', [(f'{CEL}/spic/spic_{n}_v2_RR1.wav', midi(n, 1)) for n in ['C1', 'G1', 'D2', 'A2']], {'len': 0.7}),
    'horn': ('hold', [(f'{V}/Brass/F Horn/sus/MOHorn_sus_{n}_v3_1.wav', midi(n, 1)) for n in ['D#1', 'A#1', 'F2', 'C3']], {}),
    'tuba': ('hold', [(f'{V}/Brass/Tuba/sus/Tuba3_sus_{n}_rr1_Mid.wav', midi(n.split('_')[0], 1)) for n in ['F0_v1', 'A#0_v2', 'D#1_v2']], {}),
    'harp': ('hit', [(f'{V}/Strings/Harp/KSHarp_{n}_mf.wav', midi(n)) for n in ['D2', 'A2', 'E3', 'B3', 'F4', 'C5', 'G5', 'D6']], {'len': 3.2}),
    'flute': ('hold', [(f'{V}/Woodwinds/Flute/susvib/LDFlute_susvib_{n}_v1_1.wav', midi(n, 1)) for n in ['C3', 'E3', 'A3', 'C4', 'E4', 'A4']], {}),
    'organ': ('hold', [(f'{ORG}/Quiet Pedal/NT5_PedalQuiet_{n}_rr1.wav', midi(n, 1)) for n in ['C1', 'F#1']]
              + [(f'{ORG}/Quiet/NT5_Man3Quiet_{n}_rr1.wav', midi(n, 1)) for n in ['C2', 'F#2', 'C3', 'F#3', 'C4', 'F#4']], {}),
    'choir': ('hold', [(f'{F}/FluidR3_GM/choir_aahs-mp3/{n}.mp3', midi(n)) for n in ['A2', 'C3', 'F3', 'Bb3', 'Eb4', 'Ab4', 'Db5', 'F5']], {}),
    'oohs': ('hold', [(f'{F}/FluidR3_GM/voice_oohs-mp3/{n}.mp3', midi(n)) for n in ['C3', 'F3', 'Bb3', 'Eb4', 'Ab4']], {}),
    # Timpani: the pitch each drum was tuned to, measured from its partials.
    'timp': ('hit', [(f'{V}/Percussion/Timpani/Timpani{i}_Hit_v3_rr1_Sum.wav', r) for i, r in [(1, 41.4), (3, 49.5), (5, 54.6)]], {'len': 3.0}),
    'bassdrum': ('hit', [(f'{V}/Percussion/BDrumNewhit_v7_rr1_Sum.wav', 36)], {'len': 2.5}),
    'frame': ('hit', [(f'{FR}/HDrumL_Hit_v3_rr1_Sum.wav', 40), (f'{FR}/HDrumS_Hit_v3_rr1_Sum.wav', 50), (f'{FR}/HDrumS_HitMuted_v2_rr1_Sum.wav', 60)], {'len': 1.2, 'exact': True}),
    'chimes': ('hit', [(f'{C}/Idiophones/Struck Idiophones/Tubular Bells 1/chimes_{n}.wav', midi(n.split('_')[0], 1)) for n in ['D3_ff_rr1', 'A#3_ff_rr1', 'E4_ff_rr2']], {'len': 5.0}),
    'glock': ('hit', [(f'{V}/Percussion/Glock/glock_medium_{n}.wav', midi(n, 1)) for n in ['G4', 'C5', 'G5', 'C6']], {'len': 2.4}),
    'gong': ('hit', [(f'{V}/Percussion/gongHit_f.wav', 50)], {'len': 7.0, 'exact': True}),
}

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

def rms_curve(x, h=2205):
    return np.array([np.sqrt(np.mean(x[i:i + h] ** 2)) for i in range(0, max(1, len(x) - h), h)]), h

def trim_head(x, frac):
    """Start where the sound reaches `frac` of its loudness, less a breath."""
    r, h = rms_curve(x)
    i = int(np.argmax(r >= frac * r.max()))
    return x[max(0, i * h - int(0.04 * SR)):]

def make_hold(x):
    x = trim_head(x, 0.3)
    r, h = rms_curve(x)
    # Where the held part ends: the last moment still above half its median loudness.
    med = np.median(r[: max(4, len(r) * 2 // 3)])
    alive = np.where(r > 0.45 * med)[0]
    end = min(len(x), (alive[-1] * h if len(alive) else len(x)) - int(0.25 * SR))
    # The loop starts once the sound has settled (some organ pipes take two seconds to speak).
    settled = int(np.argmax(r >= 0.8 * med)) * h
    s = int(min(max(0.6 * SR, settled), end - 1.4 * SR, 2.2 * SR))
    e = min(end, s + int(3.0 * SR))
    xf = int(min(0.5 * SR, (e - s) * 0.3, s))
    x = flatten(x, s - xf, int(0.3 * SR))
    # End the loop where the wave best matches its start, so the crossfade doesn't hollow out.
    W = int(0.02 * SR)
    ref = x[s - W:s + W]
    corr = lambda k: float(np.dot(x[k - W:k + W], ref) / (np.linalg.norm(x[k - W:k + W]) * np.linalg.norm(ref) + 1e-12))
    e = max(range(e - int(0.06 * SR), e), key=corr)
    c = corr(e)
    tail = int(0.3 * SR)
    y = x[:e].copy()
    w = np.linspace(0, 1, xf)
    a, b = (1 - w, w) if c > 0.5 else (np.sqrt(1 - w), np.sqrt(w))
    y[e - xf:e] = x[e - xf:e] * a + x[s - xf:s] * b
    y = np.concatenate([y, x[s:s + tail]])
    level = np.sqrt(np.mean(y[s:e] ** 2))
    return y, level, (s / SR, e / SR)

def flatten(x, start, ramp):
    """Even out a held note's slow swells from `start` on (a bow leaning in, a breath), keeping its vibrato."""
    win = int(0.3 * SR)
    env = np.sqrt(np.maximum(np.convolve(x ** 2, np.ones(win) / win, mode='same'), 1e-12))
    g = np.clip(np.median(env[start:]) / env, 0.5, 2.0)
    blend = np.clip((np.arange(len(x)) - (start - ramp)) / ramp, 0, 1)
    return x * (1 + (g - 1) * blend)

def make_hit(x, length, exact):
    x = trim_head(x, 0.05)[: int(length * SR)]
    n = len(x)
    fade = int(n * 0.35)
    x = x.copy()
    x[n - fade:] *= np.linspace(1, 0, fade) ** 2
    level = np.max(np.abs(x)) if exact else np.sqrt(np.mean(x[: int(0.3 * SR)] ** 2))
    return x, level, None

def encode(y, path):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-q:a', '5', path],
                   input=y.astype(np.float32).tobytes(), check=True)

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.mp3'):
            os.remove(os.path.join(OUT, f))
    lines, total = [], 0
    for inst, (kind, files, opt) in RECIPE.items():
        made = []
        for path, root in files:
            x = load(path)
            y, level, loop = make_hold(x) if kind == 'hold' else make_hit(x, opt['len'], opt.get('exact', False))
            made.append((y, level, loop, root))
        # Level the notes of one instrument with each other (by their median), then fit under 0.95. The
        # gain brings every instrument to one loudness (0.1 RMS held, or 0.5 peak for a drum).
        ref = np.median([m[1] for m in made])
        target = 0.5 if opt.get('exact') else 0.1
        entries = []
        for y, level, loop, root in made:
            y = y * (ref / level)
            peak = np.max(np.abs(y))
            y, gain = (y * 0.95 / peak, peak / 0.95 * target / ref)
            name = f'{inst}-{str(root).replace(".", "_")}.mp3'
            encode(y, os.path.join(OUT, name))
            total += os.path.getsize(os.path.join(OUT, name))
            lp = f', loop: [{loop[0]:.6f}, {loop[1]:.6f}]' if loop else ''
            entries.append(f"    {{ file: '{name}', root: {root}, gain: {gain:.3f}{lp} }},")
        lines.append(f"  '{inst}': [\n" + '\n'.join(entries) + '\n  ],')
    ts = ('/**\n * The recorded notes in public/music, made by scripts/make-samples.py (do not edit by hand): for\n'
          ' * each instrument, its files, the note each was played at, a gain that levels them with each other,\n'
          ' * and for held sounds the loop (seconds). Sources and licences: public/music/CREDITS.txt.\n */\n'
          'export interface SampleNote { file: string; root: number; gain: number; loop?: [number, number] }\n\n'
          'export const SAMPLES = {\n' + '\n'.join(lines) + '\n} satisfies Record<string, SampleNote[]>;\n\n'
          'export type SampleId = keyof typeof SAMPLES;\n')
    with open(os.path.join(ROOT, 'src', 'client', 'samplemap.ts'), 'w') as fh:
        fh.write(ts)
    print(f'{total / 1e6:.2f} MB in {sum(len(r[1]) for r in RECIPE.values())} files')

main()
