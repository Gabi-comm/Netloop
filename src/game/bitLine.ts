import { NetColors } from "./colors";
import type { Vec } from "./geometry";
import type { LineStyle } from "./skins";

function walk(points: readonly Vec[], step: number, visit: (at: Vec, angle: number, index: number) => void) {
  let since = 0;
  let index = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const angle = Math.atan2(dy, dx);
    let d = step - since;
    while (d <= len) {
      visit({ x: a.x + (dx * d) / len, y: a.y + (dy * d) / len }, angle, index++);
      d += step;
    }
    since = len - (d - step);
  }
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const k = r * 0.28;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + r, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - r, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
}

export function drawBitLine(ctx: CanvasRenderingContext2D, line: readonly Vec[], style: LineStyle, s: number, now: number) {
  const trace = () => {
    ctx.beginPath();
    line.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (style.kind) {
    case "solid":
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 6 * s;
      trace();
      ctx.stroke();
      break;
    case "ribbon":
      ctx.strokeStyle = style.edge;
      ctx.lineWidth = 10 * s;
      trace();
      ctx.stroke();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 6 * s;
      trace();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1.6 * s;
      ctx.translate(0, -1.4 * s);
      trace();
      ctx.stroke();
      break;
    case "neon":
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 18 * s;
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 5.5 * s;
      trace();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = NetColors.chalk;
      ctx.lineWidth = 2 * s;
      trace();
      ctx.stroke();
      break;
    case "beads":
      ctx.strokeStyle = style.edge;
      ctx.lineWidth = 2 * s;
      trace();
      ctx.stroke();
      walk(line, 13 * s, (at, _angle, i) => {
        ctx.fillStyle = i % 2 === 0 ? style.color : (style.alt ?? style.color);
        ctx.beginPath();
        ctx.arc(at.x, at.y, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(at.x - 1.6 * s, at.y - 1.8 * s, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case "vine":
      ctx.strokeStyle = style.edge;
      ctx.lineWidth = 4 * s;
      trace();
      ctx.stroke();
      walk(line, 22 * s, (at, angle, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        ctx.save();
        ctx.translate(at.x, at.y);
        ctx.rotate(angle + side * 0.95);
        ctx.fillStyle = i % 3 === 0 ? (style.alt ?? style.color) : style.color;
        ctx.strokeStyle = style.edge;
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.ellipse(7 * s, 0, 7.5 * s, 3.6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      break;
    case "stars":
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 10 * s;
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 3 * s;
      trace();
      ctx.stroke();
      ctx.shadowBlur = 0;
      walk(line, 24 * s, (at, _angle, i) => {
        const twinkle = 0.65 + 0.35 * Math.sin(now / 180 + i * 1.7);
        ctx.fillStyle = i % 2 === 0 ? (style.alt ?? style.color) : NetColors.chalk;
        sparkle(ctx, at.x, at.y, (i % 2 === 0 ? 8 : 6) * s * twinkle);
      });
      break;
  }
  ctx.restore();
}
