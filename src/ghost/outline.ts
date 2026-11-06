import { sstep, type Pt } from "./math";
import type { Ghost } from "./state";

export function outline(G: Ghost, t: number): Pt[] {
  const width = 0.43;
  const top = -0.42;
  const edge = 0.24;
  const pts: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = Math.PI + (i / 64) * Math.PI;
    const x = Math.cos(a) * width;
    const y = edge + Math.sin(a) * (edge - top);
    const ripple = Math.sin((x / width) * Math.PI * 5 + G.phase) * 0.012;
    pts.push([x, y + ripple]);
  }
  const squashX = 1 + G.sq * 0.9;
  const squashY = 1 - G.sq * 0.75;
  return pts.map(([x, y]) => {
    const f = sstep(-0.15, 0.5, y);
    x += G.trailX * f * f + Math.sin(t * 2.1 + y * 5) * 0.012 * f;
    y += G.trailY * f * 0.5;
    return [x * squashX, (y - 0.24) * squashY + 0.24];
  });
}

export function tentacle(G: Ghost, t: number, index: number, U: number): Pt[] {
  const x = (index - 1.5) * 0.19;
  const length = 0.25 + (index % 2) * 0.12;
  const sway = Math.sin(t * 2 + index * 1.7 + G.phase) * 0.045;
  const lag = G.trailX * 0.35;
  return Array.from({ length: 13 }, (_, i) => {
    const v = i / 12;
    const wave = Math.sin(t * 2.2 - v * 4 + index) * 0.035 * v;
    return [G.x + (x + sway * v + wave + lag * v) * U, G.y + (0.23 + length * v + G.trailY * v * 0.3) * U];
  });
}

export function toScreen(G: Ghost, U: number, pts: Pt[]): Pt[] {
  const c = Math.cos(G.lean);
  const s = Math.sin(G.lean);
  const scale = U * (1 + 0.04 * G.happy);
  return pts.map(([x, y]) => [G.x + (x * c - y * s) * scale, G.y + (x * s + y * c) * scale]);
}

export function trace(ctx: CanvasRenderingContext2D, p: Pt[]) {
  ctx.beginPath();
  ctx.moveTo((p[0][0] + p[p.length - 1][0]) / 2, (p[0][1] + p[p.length - 1][1]) / 2);
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  ctx.closePath();
}

export function makePath(p: Pt[]) {
  const path = new Path2D();
  path.moveTo(p[0][0], p[0][1]);
  for (const point of p) path.lineTo(point[0], point[1]);
  path.closePath();
  return path;
}
