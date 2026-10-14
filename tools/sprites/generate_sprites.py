import math
import os
import sys
from dataclasses import dataclass, field

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SVG_DIR = os.path.join(ROOT, "sprites", "svg")
DRAWABLE_DIR = os.path.join(ROOT, "app", "src", "main", "res", "drawable")
KOTLIN_FILE = os.path.join(
    ROOT, "app", "src", "main", "java", "com", "netloop", "game", "ui", "sprites", "SpriteSheet.kt"
)
PREVIEW_FILE = os.path.join(ROOT, "sprites", "preview.html")

GROUND = "#121212"
INK = "#121212"
SURFACE = "#1a1a19"
CHALK = "#f2f2ec"
PINK = "#e0567f"
THREAT = "#e8553d"
LEGIT = "#8ad15b"
POINTS = "#ede06a"
SERVER = "#3b6fd4"
SERVER_BODY = "#6f8fe0"
SERVER_LINE = "#2f4f9f"
DATA = "#5fd3e0"
EPIC = "#9b7ad6"
EPIC_LIGHT = "#b39af0"
DIM = "#4a4a46"
CABLE = "#2c2c2a"
HUB = "#55555e"
GOLD = "#e8b33d"
GOLD_LIGHT = "#f2c95a"
MITM = "#8b7fb0"
SALMON = "#f2a08f"


@dataclass
class P:
    d: str
    fill: str = None
    stroke: str = None
    sw: float = 0
    opacity: float = 1.0


@dataclass
class G:
    children: list
    tx: float = 0
    ty: float = 0
    rot: float = 0
    px: float = 50
    py: float = 50
    s: float = 1.0


def C(cx, cy, r, fill=None, stroke=None, sw=0, opacity=1.0):
    d = f"M{fmt(cx - r)} {fmt(cy)} a{fmt(r)} {fmt(r)} 0 1 0 {fmt(2 * r)} 0 a{fmt(r)} {fmt(r)} 0 1 0 {fmt(-2 * r)} 0 Z"
    return P(d, fill, stroke, sw, opacity)


def R(x, y, w, h, rx=0, fill=None, stroke=None, sw=0):
    if rx <= 0:
        return P(f"M{fmt(x)} {fmt(y)} H{fmt(x + w)} V{fmt(y + h)} H{fmt(x)} Z", fill, stroke, sw)
    r = min(rx, w / 2, h / 2)
    d = (
        f"M{fmt(x + r)} {fmt(y)} H{fmt(x + w - r)} Q{fmt(x + w)} {fmt(y)} {fmt(x + w)} {fmt(y + r)} "
        f"V{fmt(y + h - r)} Q{fmt(x + w)} {fmt(y + h)} {fmt(x + w - r)} {fmt(y + h)} "
        f"H{fmt(x + r)} Q{fmt(x)} {fmt(y + h)} {fmt(x)} {fmt(y + h - r)} "
        f"V{fmt(y + r)} Q{fmt(x)} {fmt(y)} {fmt(x + r)} {fmt(y)} Z"
    )
    return P(d, fill, stroke, sw)


def fmt(v):
    v = round(v, 2)
    return str(int(v)) if v == int(v) else str(v)


@dataclass
class Anim:
    name: str
    frames: list
    frame_ms: int = 160
    w: int = 100
    h: int = 100
    loop: bool = True
    group: str = "misc"
    note: str = ""


def svg_node(n):
    if isinstance(n, G):
        t = f"translate({fmt(n.tx + n.px)} {fmt(n.ty + n.py)}) rotate({fmt(n.rot)}) scale({fmt(n.s)}) translate({fmt(-n.px)} {fmt(-n.py)})"
        inner = "".join(svg_node(c) for c in n.children)
        return f'<g transform="{t}">{inner}</g>'
    attrs = [f'd="{n.d}"', f'fill="{n.fill or "none"}"']
    if n.stroke:
        attrs += [f'stroke="{n.stroke}"', f'stroke-width="{fmt(n.sw)}"', 'stroke-linecap="round"', 'stroke-linejoin="round"']
    if n.opacity != 1.0:
        attrs.append(f'opacity="{fmt(n.opacity)}"')
    return "<path " + " ".join(attrs) + "/>"


def svg_doc(frame, w, h):
    body = "".join(svg_node(n) for n in frame)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>\n'


def vd_node(n, indent):
    pad = "    " * indent
    if isinstance(n, G):
        inner = "".join(vd_node(c, indent + 1) for c in n.children)
        return (
            f'{pad}<group\n{pad}    android:pivotX="{fmt(n.px)}"\n{pad}    android:pivotY="{fmt(n.py)}"\n'
            f'{pad}    android:rotation="{fmt(n.rot)}"\n{pad}    android:scaleX="{fmt(n.s)}"\n{pad}    android:scaleY="{fmt(n.s)}"\n'
            f'{pad}    android:translateX="{fmt(n.tx)}"\n{pad}    android:translateY="{fmt(n.ty)}">\n{inner}{pad}</group>\n'
        )
    lines = [f'{pad}<path', f'{pad}    android:pathData="{n.d}"']
    if n.fill:
        lines.append(f'{pad}    android:fillColor="{n.fill}"')
        if n.opacity != 1.0:
            lines.append(f'{pad}    android:fillAlpha="{fmt(n.opacity)}"')
    if n.stroke:
        lines += [
            f'{pad}    android:strokeColor="{n.stroke}"',
            f'{pad}    android:strokeWidth="{fmt(n.sw)}"',
            f'{pad}    android:strokeLineCap="round"',
            f'{pad}    android:strokeLineJoin="round"',
        ]
        if n.opacity != 1.0:
            lines.append(f'{pad}    android:strokeAlpha="{fmt(n.opacity)}"')
    return "\n".join(lines) + " />\n"


def vd_doc(frame, w, h):
    body = "".join(vd_node(n, 1) for n in frame)
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
        f'    android:width="{w}dp"\n    android:height="{h}dp"\n'
        f'    android:viewportWidth="{w}"\n    android:viewportHeight="{h}">\n'
        f"{body}</vector>\n"
    )


def bit(eyes="open", lights=(DATA, DATA, DATA), bob=0, antenna=(PINK, DATA), legs=0):
    leg_d = [
        "M34 78 L32 90 M48 78 L48 90 M60 78 L62 90 M70 76 L74 88",
        "M34 78 L36 90 M48 78 L46 90 M60 78 L58 90 M70 76 L70 88",
    ][legs]
    if eyes == "open":
        eye_nodes = [C(42, 46, 3.6, INK), C(60, 46, 3.6, INK)]
    elif eyes == "closed":
        eye_nodes = [P("M38.5 46 L45.5 46 M56.5 46 L63.5 46", stroke=INK, sw=3)]
    else:
        eye_nodes = [P("M38 48 Q42 43 46 48 M56 48 Q60 43 64 48", stroke=INK, sw=3)]
    upper = [
        P("M38 22 L32 8 M62 21 L70 7", stroke=CHALK, sw=4),
        C(32, 8, 4.5, antenna[0]),
        C(70, 7, 4.5, antenna[1]),
        P("M22 40 Q20 24 36 22 L66 21 Q80 22 80 38 L81 62 Q80 76 64 77 L36 78 Q21 77 21 62 Z", fill=CHALK),
        *eye_nodes,
        P("M46 57 Q51 61 56 57", stroke=INK, sw=3),
        C(40, 68, 2.6, lights[0]),
        C(50, 68, 2.6, lights[1]),
        C(60, 68, 2.6, lights[2]),
    ]
    return [P(leg_d, stroke=CHALK, sw=4), G(upper, ty=bob)]


def server(lights=(LEGIT, LEGIT, LEGIT), face="calm", shake=0):
    if face == "calm":
        f = [P("M38 25 Q42 21 46 25 M56 25 Q60 21 64 25", stroke=INK, sw=3)]
    elif face == "awake":
        f = [C(40, 24, 3.2, INK), C(60, 24, 3.2, INK), P("M45 28 Q50 25 55 28", stroke=INK, sw=2.6)]
    else:
        f = [C(40, 24, 3.2, INK), C(60, 24, 3.2, INK), P("M44 30 Q50 26 56 30", stroke=INK, sw=2.6), P("M74 14 L76 20", stroke=DATA, sw=2.5)]
    return [
        G(
            [
                P("M24 18 Q24 12 32 12 L70 12 Q78 12 78 20 L78 84 Q78 90 70 90 L32 90 Q24 90 24 84 Z", fill=SERVER_BODY),
                P("M32 34 L70 34 M32 52 L70 52 M32 70 L70 70", stroke=SERVER_LINE, sw=4),
                *f,
                C(64, 43, 3.2, lights[0]),
                C(64, 61, 3.2, lights[1]),
                C(64, 79, 3.2, lights[2]),
            ],
            tx=shake,
        )
    ]


def legit(legs=0, bob=0, mood="happy"):
    leg_d = ["M32 80 L30 90 M66 79 L68 89", "M32 80 L35 90 M66 79 L63 89"][legs]
    face = "M38 50 Q42 45 46 50 M56 49 Q60 44 64 49" if mood == "happy" else "M38 49 L46 49 M56 49 L64 49"
    return [
        P(leg_d, stroke=LEGIT, sw=5),
        G([P("M20 56 Q18 30 46 26 Q76 22 80 50 Q83 74 56 78 Q24 82 20 56 Z", fill=LEGIT), P(face, stroke=INK, sw=3.5)], ty=bob),
    ]


MALWARE_BODY = "M18 60 Q14 34 38 28 Q48 18 60 26 Q84 26 82 54 Q86 78 58 80 Q30 86 18 60 Z"
MALWARE_FACE = "M32 41 L46 46 M70 41 L56 46 M40 66 L45 62 L50 66 L55 62 L60 66"


def malware(legs=0, bob=0, scale=1.0):
    leg_d = ["M32 80 L30 90 M66 80 L68 90", "M32 80 L35 90 M66 80 L63 90"][legs]
    return [
        G(
            [
                P(leg_d, stroke=THREAT, sw=5),
                G(
                    [
                        P(MALWARE_BODY, fill=THREAT),
                        C(40, 52, 3.6, INK),
                        C(62, 52, 3.6, INK),
                        P(MALWARE_FACE, stroke=INK, sw=3.5),
                    ],
                    ty=bob,
                ),
            ],
            s=scale,
            py=56,
        )
    ]


def burst(radius, dot, colors, count=8, phase=0):
    nodes = []
    for i in range(count):
        a = math.radians(phase + i * 360 / count)
        nodes.append(C(50 + math.cos(a) * radius, 52 + math.sin(a) * radius, dot, colors[i % len(colors)]))
    return nodes


PING_DOTS = [(30, 40, 10), (56, 30, 8), (72, 52, 11), (44, 62, 12), (26, 72, 8), (64, 78, 9)]
PING_SHIFTS = [
    [(0, 0), (0, 0), (0, 0), (0, 0), (0, 0), (0, 0)],
    [(2, -2), (-2, 1), (1, 2), (-1, -2), (2, 1), (-2, -1)],
    [(-2, 1), (2, 2), (-2, -1), (1, 2), (-1, -2), (2, -2)],
]


def ping_flood(shift):
    s = PING_SHIFTS[shift]
    dots = [C(x + s[i][0], y + s[i][1], r, POINTS) for i, (x, y, r) in enumerate(PING_DOTS)]
    eyes = [
        C(40 + s[3][0], 60 + s[3][1], 2, INK), C(48 + s[3][0], 60 + s[3][1], 2, INK),
        C(68 + s[2][0], 50 + s[2][1], 2, INK), C(76 + s[2][0], 50 + s[2][1], 2, INK),
        C(27 + s[0][0], 38 + s[0][1], 1.8, INK), C(33 + s[0][0], 38 + s[0][1], 1.8, INK),
    ]
    return dots + eyes


def worm(phase, mini=False):
    segs = [(20, 76, 10), (38, 66, 12), (57, 54, 14)]
    nodes = []
    if mini:
        segs = segs[1:]
    for i, (x, y, r) in enumerate(segs):
        dy = math.sin(phase + i * 1.4) * 3
        nodes.append(C(x, y + dy, r, EPIC))
    hy = math.sin(phase + 3 * 1.4) * 2
    nodes += [
        P(f"M70 {fmt(28 + hy)} L66 {fmt(16 + hy)} M82 {fmt(28 + hy)} L86 {fmt(16 + hy)}", stroke=EPIC_LIGHT, sw=3),
        C(76, 40 + hy, 16, EPIC_LIGHT),
        C(71, 38 + hy, 3, INK),
        C(82, 38 + hy, 3, INK),
    ]
    return nodes


def ransomware(bob=0, cracked=False, shake=0):
    shackle = "M38 40 V28 Q38 14 50 14 Q62 14 62 28 V40" if not cracked else "M38 40 V28 Q38 14 50 14 Q58 14 61 20"
    nodes = [
        P(shackle, stroke=POINTS, sw=6),
        P("M22 46 Q22 38 30 38 L70 38 Q78 38 78 46 L78 78 Q78 86 70 86 L30 86 Q22 86 22 78 Z", fill=THREAT),
        P("M32 52 L40 52 M60 52 L68 52", stroke=INK, sw=3.5),
        C(50, 64, 6, POINTS),
        P("M50 66 L50 76", stroke=POINTS, sw=5),
    ]
    if cracked:
        nodes.append(P("M26 60 L34 64 L30 70 L38 74", stroke=INK, sw=2.5))
    return [G(nodes, ty=bob, tx=shake)]


def spoofer(swap=False, legs=0):
    a, b = (LEGIT, THREAT) if not swap else (THREAT, LEGIT)
    leg_l = ["M32 80 L30 90", "M32 80 L35 90"][legs]
    leg_r = ["M66 79 L68 89", "M66 79 L63 89"][legs]
    return [
        P("M20 56 Q18 30 46 26 Q76 22 80 50 Q83 74 56 78 Q24 82 20 56 Z", fill=a),
        P("M54 26 Q77 24 80 50 Q83 74 56 78 Q52 52 54 26 Z", fill=b),
        P("M34 51 Q38 46 42 51", stroke=INK, sw=3.5),
        C(64, 52, 3.6, INK),
        P("M57 43 L70 47", stroke=INK, sw=3.5),
        P("M36 64 Q46 68 58 62", stroke=INK, sw=3),
        P(leg_l, stroke=a, sw=5),
        P(leg_r, stroke=b, sw=5),
    ]


def trojan(peek=0, lid_lift=0, lid_rot=0, reveal=False):
    nodes = [
        P("M24 48 L76 48 L74 88 L26 88 Z", fill=GOLD),
        P("M46 48 L54 48 L54 88 L46 88 Z", fill=PINK),
    ]
    if reveal:
        nodes.append(G([P(MALWARE_BODY, fill=THREAT), C(40, 52, 3.6, INK), C(62, 52, 3.6, INK), P(MALWARE_FACE, stroke=INK, sw=3.5)], tx=0, ty=-22, s=0.55, px=50, py=50))
    nodes += [C(36 + peek, 66, 3.6, INK), C(64 + peek, 66, 3.6, INK), P(f"M{30 + peek} 59 L{40 + peek} 62 M{70 + peek} 59 L{60 + peek} 62", stroke=INK, sw=3)]
    lid = [
        P("M18 36 L82 36 L82 50 L18 50 Z", fill=GOLD_LIGHT),
        P("M46 36 L54 36 L54 50 L46 50 Z", fill=PINK),
        P("M50 36 Q34 18 30 30 Q30 38 50 36 Z M50 36 Q66 18 70 30 Q70 38 50 36 Z", fill=PINK),
    ]
    nodes.append(G(lid, ty=-lid_lift, rot=lid_rot, px=18, py=50))
    return nodes


def botnet(rot):
    drones = burst(36, 6, [THREAT], count=6, phase=rot)
    return [
        C(50, 52, 36, None, DIM, 3),
        G([C(50, 52, 18, HUB), C(50, 52, 7, THREAT), C(50, 52, 3, INK)]),
        *drones,
    ]


ZERO_STAR = "M50 8 L58 30 L82 18 L72 42 L96 50 L72 58 L82 82 L58 70 L50 94 L42 70 L18 82 L28 58 L4 50 L28 42 L18 18 L42 30 Z"


def zero_day(rot, scale=1.0):
    return [
        G([P(ZERO_STAR, fill=PINK)], rot=rot, s=scale),
        C(42, 50, 5, CHALK),
        C(58, 50, 5, CHALK),
        C(43, 51, 2.4, INK),
        C(57, 51, 2.4, INK),
        P("M34 40 L46 44 M66 40 L54 44", stroke=INK, sw=3.5),
    ]


def mitm(look=0, legs=0):
    leg_d = ["M32 81 L30 91 M66 80 L68 90", "M32 81 L35 91 M66 80 L63 90"][legs]
    return [
        P(leg_d, stroke=MITM, sw=5),
        P("M20 58 Q16 30 46 26 Q78 22 80 52 Q84 78 54 80 Q24 84 20 58 Z", fill=MITM),
        P("M16 44 Q50 36 84 44 L84 58 Q50 50 16 58 Z", fill=INK),
        C(38 + look, 50, 3.6, CHALK),
        C(62 + look, 50, 3.6, CHALK),
        P("M42 68 Q50 71 58 68", stroke=INK, sw=3),
    ]


def snap_ring(r, a=1.0):
    return [C(50, 50, r, None, POINTS, 5, a), C(50, 50, 6, POINTS)]


def line_break(spread):
    return [
        P(f"M50 50 L{fmt(50 - spread)} {fmt(50 - spread * 0.6)} M50 50 L{fmt(50 + spread)} {fmt(50 - spread * 0.8)} M50 50 L{fmt(50 + spread * 0.7)} {fmt(50 + spread)} M50 50 L{fmt(50 - spread * 0.9)} {fmt(50 + spread * 0.5)}", stroke=PINK, sw=4),
        C(50, 50, 5 + spread * 0.1, CHALK),
    ]


def data_gem():
    return [P("M50 10 L85 50 L50 90 L15 50 Z", fill=DATA), P("M50 10 L62 50 L50 90", fill=None, stroke=GROUND, sw=2, opacity=0.35)]


def icon(paths, color, sw=5):
    return [P(d, stroke=color, sw=sw) for d in paths]


ANIMS = []


def add(name, frames, frame_ms=160, group="misc", note="", w=100, h=100, loop=True):
    ANIMS.append(Anim(name, frames, frame_ms, w, h, loop, group, note))


def build():
    add("bit_idle", [bit(), bit(bob=-2), bit(), bit(eyes="closed")], 220, "player", "breathing bob, blink on the last frame")
    add("bit_draw", [bit(eyes="focus", lights=(DATA, DIM, DIM)), bit(eyes="focus", lights=(DIM, DATA, DIM)), bit(eyes="focus", lights=(DIM, DIM, DATA))], 120, "player", "lights chase while the finger is drawing")
    add("bit_hurt", [bit(eyes="closed", lights=(THREAT, THREAT, THREAT), antenna=(THREAT, THREAT)), bit(lights=(THREAT, DIM, THREAT), bob=1)], 120, "player", "flash red when a threat reaches the server", loop=False)

    add("server_idle", [server(), server(lights=(LEGIT, DIM, LEGIT)), server(lights=(DIM, LEGIT, LEGIT))], 400, "world", "sleepy face, lights blink")
    add("server_alert", [server(face="awake"), server(face="awake", lights=(LEGIT, LEGIT, THREAT))], 300, "world", "eyes open when threats are close")
    add("server_hurt", [server(face="hurt", lights=(THREAT, THREAT, THREAT), shake=-3), server(face="hurt", lights=(THREAT, DIM, THREAT), shake=3), server(face="hurt", lights=(THREAT, THREAT, THREAT))], 80, "world", "shake when a threat gets through", loop=False)

    add("legit_walk", [legit(0, 0), legit(1, -2)], 180, "packets", "happy walk along the cable")
    add("legit_scared", [legit(0, 0, "scared"), legit(1, 0, "scared")], 120, "packets", "inside an open loop, it worries")

    add("malware_walk", [malware(0, 0), malware(1, -2)], 180, "threats", "basic threat walk")
    add("malware_pop", [malware(scale=1.15), burst(22, 7, [THREAT, POINTS]), burst(38, 4, [THREAT, POINTS], phase=20)], 70, "threats", "dropped by a closed loop", loop=False)

    add("ping_flood_swarm", [ping_flood(0), ping_flood(1), ping_flood(2)], 90, "threats", "jittery swarm")
    add("worm_crawl", [worm(0), worm(2.1), worm(4.2)], 150, "threats", "segments wave")
    add("worm_mini_crawl", [worm(0, True), worm(2.1, True), worm(4.2, True)], 130, "threats", "half worm after it splits")
    add("ransomware_walk", [ransomware(0), ransomware(-2)], 200, "threats", "needs two loops")
    add("ransomware_cracked", [ransomware(0, True, -1), ransomware(-2, True, 1)], 120, "threats", "after the first loop: shackle broken")
    add("spoofer_walk", [spoofer(False, 0), spoofer(False, 1), spoofer(True, 0), spoofer(False, 1)], 170, "threats", "flickers its true colour on frame 3")
    add("trojan_idle", [trojan(0), trojan(-2), trojan(2)], 260, "threats", "gift box, eyes peek")
    add("trojan_open", [trojan(lid_lift=4, lid_rot=-8), trojan(lid_lift=10, lid_rot=-22), trojan(lid_lift=14, lid_rot=-35, reveal=True)], 110, "threats", "opens near the server, releases malware", loop=False)
    add("botnet_orbit", [botnet(0), botnet(15), botnet(30), botnet(45)], 110, "threats", "drones orbit the hub (loop the hub)")
    add("zero_day_spin", [zero_day(0), zero_day(11.25), zero_day(22.5), zero_day(33.75)], 70, "threats", "spins fast, breaks open lines")
    add("zero_day_dash", [zero_day(0, 1.12), zero_day(22.5, 0.95)], 60, "threats", "lunge toward the line")
    add("mitm_walk", [mitm(0, 0), mitm(-3, 1), mitm(0, 0), mitm(3, 1)], 190, "threats", "shifty eyes, hides next to legit packets")

    add("fx_snap_ring", [snap_ring(11), snap_ring(14, 0.8), snap_ring(17, 0.5)], 120, "fx", "pulses at the loop start point")
    add("fx_pop", [burst(10, 6, [POINTS, CHALK]), burst(24, 5, [POINTS, CHALK], phase=22), burst(38, 3, [POINTS, CHALK], phase=44)], 60, "fx", "generic pop when a loop closes", loop=False)
    add("fx_line_break", [line_break(10), line_break(22)], 70, "fx", "zero-day hits the open line", loop=False)

    add("ui_data", [data_gem()], 1000, "ui", "data currency")
    add("ui_uptime_full", [[R(30, 10, 40, 80, 14, LEGIT)]], 1000, "ui", "one life")
    add("ui_uptime_empty", [[R(30, 10, 40, 80, 14, "#2a2a28", DIM, 3)]], 1000, "ui", "lost life")
    add("ui_settings", [[C(50, 50, 18, None, CHALK, 8), *icon(["M50 8 V22 M50 78 V92 M8 50 H22 M78 50 H92 M20 20 L30 30 M70 70 L80 80 M80 20 L70 30 M20 80 L30 70"], CHALK, 8)]], 1000, "ui")
    add("ui_play", [[P("M22 12 Q18 6 28 9 L86 42 Q96 50 86 57 L28 91 Q18 94 22 86 Z", fill=INK)]], 1000, "ui")
    add("ui_zones", [icon(["M35 25 L45 70 M65 25 L55 70 M30 80 L70 80"], DATA, 7) + [C(50, 20, 12, None, DATA, 7), C(22, 78, 12, None, DATA, 7), C(78, 78, 12, None, DATA, 7)]], 1000, "ui")
    add("ui_codex", [icon(["M50 22 Q32 10 10 16 L10 82 Q32 76 50 88 Q68 76 90 82 L90 16 Q68 10 50 22 Z M50 22 L50 88"], POINTS, 7)], 1000, "ui")
    add("ui_shop", [icon(["M16 34 L84 34 L78 90 L22 90 Z M34 34 Q34 10 50 10 Q66 10 66 34"], PINK, 7)], 1000, "ui")
    add("ui_arrow", [icon(["M18 50 L82 50 M54 22 L82 50 L54 78"], INK, 12)], 1000, "ui")
    add("ui_pause", [[R(28, 18, 14, 64, 5, CHALK), R(58, 18, 14, 64, 5, CHALK)]], 1000, "ui")
    add("ui_check", [icon(["M16 52 L38 74 L84 22"], INK, 14)], 1000, "ui")
    add("ui_reroll", [icon(["M82 36 Q73 14 45 14 Q18 18 14 45 M18 64 Q27 86 55 86 Q82 82 86 55 M82 14 L82 36 L60 36 M18 86 L18 64 L40 64"], "#bdbdb5", 7)], 1000, "ui")

    add("patch_broadcast", [[P("M55 6 L22 54 L44 54 L32 94 L78 40 L56 40 L68 6 Z", fill=POINTS)]], 1000, "patches", "yellow bolt")
    add("patch_rate_limiter", [icon(["M10 78 Q32 84 78 78 Q90 75 88 66", "M22 76 Q12 48 38 34 Q66 24 72 50 Q75 68 56 72 Q40 72 40 56 Q44 46 53 50"], DATA, 6) + icon(["M82 66 L88 48 M88 66 L96 50"], DATA, 4) + [C(88, 46, 4, DATA), C(96, 48, 4, DATA)]], 1000, "patches", "cyan snail")
    add("patch_vpn_tunnel", [icon(["M12 88 L12 50 Q12 12 50 12 Q88 12 88 50 L88 88", "M6 88 L94 88"], SERVER_BODY, 7) + icon(["M28 88 L28 54 Q28 28 50 28 Q72 28 72 54 L72 88"], SERVER_BODY, 4) + [P("M38 72 Q36 56 50 55 Q64 55 63 69 Q63 82 50 82 Q38 82 38 72 Z", fill=LEGIT)]], 1000, "patches", "blue tunnel, green packet safe inside")
    add("patch_kill_switch", [[P("M12 86 Q12 70 28 70 L72 70 Q88 70 88 86 Z", fill=DIM), P("M24 70 Q24 32 50 32 Q76 32 76 70 Z", fill=THREAT), P("M36 48 Q42 40 52 41", stroke=SALMON, sw=5), *icon(["M50 20 L50 10 M30 24 L24 16 M70 24 L76 16"], POINTS, 5)]], 1000, "patches", "big red button")
    add("patch_kill_switch_used", [[P("M12 86 Q12 70 28 70 L72 70 Q88 70 88 86 Z", fill=DIM), P("M24 70 Q24 32 50 32 Q76 32 76 70 Z", fill="#7a7a74")]], 1000, "patches", "greyed after its one use")
    add("patch_honeypot", [icon(["M20 38 Q14 88 50 88 Q86 88 80 38 Z M14 38 L86 38 M34 38 Q32 20 50 20 Q68 20 66 38", "M42 56 L42 59 M58 56 L58 59"], EPIC_LIGHT, 7)], 1000, "patches", "purple pot, lures threats")
    add("patch_auto_patch", [[R(14, 38, 72, 24, 12, CHALK), C(50, 50, 6, INK), C(30, 50, 3, INK), C(70, 50, 3, INK)]], 1000, "patches", "bandage, placeholder look")

    add("env_cloud", [[P("M0 50 Q-4 18 36 12 Q60 -4 86 8 Q100 10 100 30 L100 50 Z", fill=SERVER)]], 1000, "world", "the server sits on it", w=100, h=50)
    add("env_grass", [icon(["M20 80 L28 40 M46 80 L46 34 M72 80 L66 44"], "#333330", 7)], 1000, "world", "background tuft")
    add("env_pebble", [[R(30, 40, 40, 24, 6, "#262624")]], 1000, "world", "background pebble")


def kotlin_name(name):
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def clean_old():
    if os.path.isdir(DRAWABLE_DIR):
        for f in os.listdir(DRAWABLE_DIR):
            if f.startswith("spr_") and f.endswith(".xml"):
                os.remove(os.path.join(DRAWABLE_DIR, f))
    if os.path.isdir(SVG_DIR):
        for f in os.listdir(SVG_DIR):
            if f.endswith(".svg"):
                os.remove(os.path.join(SVG_DIR, f))


def emit():
    clean_old()
    for a in ANIMS:
        for i, fr in enumerate(a.frames):
            write(os.path.join(SVG_DIR, f"{a.name}_{i}.svg"), svg_doc(fr, a.w, a.h))
            write(os.path.join(DRAWABLE_DIR, f"spr_{a.name}_{i}.xml"), vd_doc(fr, a.w, a.h))

    lines = ["package com.netloop.game.ui.sprites", "", "import com.netloop.game.R", "", "object SpriteSheet {"]
    for a in ANIMS:
        ids = ", ".join(f"R.drawable.spr_{a.name}_{i}" for i in range(len(a.frames)))
        lines.append(f'    val {kotlin_name(a.name)} = SpriteAnim("{a.name}", listOf({ids}), {a.frame_ms}, {str(a.loop).lower()}, {a.w}, {a.h})')
    lines.append("")
    lines.append("    val all = listOf(" + ", ".join(kotlin_name(a.name) for a in ANIMS) + ")")
    lines.append("}")
    write(KOTLIN_FILE, "\n".join(lines) + "\n")

    cards = []
    for a in ANIMS:
        frames = "".join(
            f'<div class="f" data-i="{i}">{svg_doc(fr, a.w, a.h)}</div>' for i, fr in enumerate(a.frames)
        )
        cards.append(
            f'<section class="card" data-ms="{a.frame_ms}" data-loop="{str(a.loop).lower()}" data-n="{len(a.frames)}">'
            f'<div class="stage">{frames}</div><b>{a.name}</b><span>{len(a.frames)}f · {a.frame_ms}ms · {a.group}</span><i>{a.note}</i></section>'
        )
    html = PREVIEW_TEMPLATE.replace("%CARDS%", "".join(cards)).replace("%COUNT%", str(sum(len(a.frames) for a in ANIMS)))
    write(PREVIEW_FILE, html)
    print(f"{len(ANIMS)} animations, {sum(len(a.frames) for a in ANIMS)} frames written")


PREVIEW_TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Netloop Sprites</title>
<style>
:root{--ground:#121212;--surface:#1a1a19;--line:#333330;--chalk:#f2f2ec;--muted:#9a9a92;--pink:#e0567f}
body{margin:0;background:var(--ground);color:var(--chalk);font-family:"Patrick Hand","Comic Sans MS",cursive;padding:24px 16px}
h1{margin:0 0 4px;font-size:40px;letter-spacing:3px}h1 em{color:var(--pink);font-style:normal}
p{margin:0 0 20px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
.card{background:var(--surface);border:2px solid var(--line);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:2px}
.stage{height:110px;display:flex;align-items:center;justify-content:center;position:relative}
.f{position:absolute;display:none}.f.on{display:block}.f svg{max-width:110px;max-height:110px}
b{font-size:18px}span{color:var(--muted);font-size:14px}i{color:var(--muted);font-size:14px}
label{display:inline-flex;gap:8px;align-items:center;margin-bottom:16px;color:var(--muted)}
</style></head><body>
<h1><em>NET</em>LOOP sprites</h1>
<p>%COUNT% frames, generated by tools/sprites/generate_sprites.py. Every card plays its frames at the real speed.</p>
<label><input type="checkbox" id="slow"> slow motion (x4)</label>
<div class="grid">%CARDS%</div>
<script>
const cards=[...document.querySelectorAll('.card')];const slow=document.getElementById('slow');
const start=performance.now();
function tick(t){const k=slow.checked?4:1;for(const c of cards){const n=+c.dataset.n,ms=+c.dataset.ms*k,loop=c.dataset.loop==='true';
let i=Math.floor((t-start)/ms);i=loop?i%n:(i%(n+4));if(i>=n)i=n-1;
c.querySelectorAll('.f').forEach((f,j)=>f.classList.toggle('on',j===i));}requestAnimationFrame(tick);}
requestAnimationFrame(tick);
</script></body></html>
"""


if __name__ == "__main__":
    build()
    emit()
