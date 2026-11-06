import { BEHAVIOUR as B, COLORS as C } from "./config";
import { drawEyes } from "./eyes";
import { TAU, rgba } from "./math";
import { makePath, outline, tentacle, toScreen, trace } from "./outline";
import type { Pt } from "./math";
import type { View, World } from "./state";

export function buildPattern(view: View) {
  const canvas = document.createElement("canvas");
  canvas.width = view.W * view.DPR;
  canvas.height = view.H * view.DPR;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(view.DPR, view.DPR);
  const r = Math.min(view.W, view.H) * 0.16;
  ctx.strokeStyle = rgba(C.pattern, 1);
  ctx.lineWidth = 1;
  for (let y = -r; y < view.H + r; y += r * 0.9) {
    for (let x = -r + (Math.round(y / (r * 0.9)) % 2 ? r * 0.5 : 0); x < view.W + r; x += r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }
  }
  return canvas;
}

const radial = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
};

function strokeTentacle(ctx: CanvasRenderingContext2D, points: Pt[], width: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function draw(w: World) {
  const { ctx, ghost: G, t } = w;
  const { W, H, DPR, U, CX, CY } = w.view;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = radial(ctx, G.x, G.y, Math.max(W, H) * 0.75, [[0, rgba(C.backGlow, 0.48 + 0.12 * G.glow)], [0.45, rgba(C.backGlowMid, 0.38)], [1, rgba(C.backGlowEdge, 0)]]);
  ctx.fillRect(0, 0, W, H);
  if (w.pattern) {
    ctx.save();
    ctx.globalAlpha = 0.035 + 0.02 * G.glow;
    ctx.drawImage(w.pattern, (G.x - CX) * -0.03, (G.y - CY) * -0.03, W, H);
    ctx.restore();
  }
  ctx.globalCompositeOperation = "lighter";
  for (const d of w.dust) {
    const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * d.s * 2.6 + d.p));
    const y = (((d.y * H - t * 8 * d.s) % H) + H) % H;
    ctx.fillStyle = rgba(C.dust, alpha * 0.65);
    ctx.beginPath();
    ctx.arc(d.x * W + Math.sin(t * 0.4 + d.p) * 6, y, d.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.translate(G.x, G.y + U * 0.66 + G.lift * 0.2);
  ctx.scale(1, 0.14);
  ctx.fillStyle = radial(ctx, 0, 0, U * 0.5, [[0, rgba(C.shadow, 0.22 - (0.1 * G.lift) / U)], [1, "rgba(0,0,0,0)"]]);
  ctx.beginPath();
  ctx.arc(0, 0, U * 0.5, 0, TAU);
  ctx.fill();
  ctx.restore();

  for (const ripple of w.rips) {
    const progress = ripple.t / B.rippleLife;
    ctx.lineWidth = (ripple.big ? 2 : 1.4) * (1 - progress) + 0.4;
    ctx.strokeStyle = rgba(C.ripple, (1 - progress) ** 2 * (ripple.big ? 0.55 : 0.4));
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, (ripple.big ? 0.55 : 0.06) * U + progress * U * (ripple.big ? 0.9 : 0.5), 0, TAU);
    ctx.stroke();
  }

  const body = toScreen(G, U, outline(G, t));
  w.path = makePath(body.map(([x, y]) => [x * DPR, y * DPR] as Pt));
  const split = U * (0.018 + 0.05 * G.surp + 0.02 * G.press);
  const alpha = 1 - 0.45 * G.surp * (w.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 40));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.1}px)`;
  for (let i = 0; i < 4; i++) {
    const points = tentacle(G, t, i, U);
    const sway = split * (i % 2 ? 0.25 : -0.25);
    ctx.save();
    ctx.translate(sway, 0);
    strokeTentacle(ctx, points, U * (0.035 - i * 0.003), rgba(i === 1 || i === 2 ? C.auraCyan : C.auraMagenta, 0.42 + 0.12 * G.glow));
    ctx.restore();
  }
  ctx.filter = `blur(${U * 0.12}px)`;
  ctx.fillStyle = rgba(C.auraCyan, 0.42 + 0.15 * G.glow);
  trace(ctx, body);
  ctx.fill();
  ctx.translate(split * 1.8, 0);
  ctx.fillStyle = rgba(C.auraMagenta, 0.34 + 0.15 * G.glow);
  trace(ctx, body);
  ctx.fill();
  ctx.filter = `blur(${U * 0.2}px)`;
  ctx.fillStyle = rgba(C.auraViolet, 0.3 + 0.16 * G.glow);
  trace(ctx, body);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.012}px)`;
  ctx.translate(-split, 0);
  ctx.strokeStyle = rgba(C.edgeCyan, 0.55);
  ctx.lineWidth = U * 0.012;
  trace(ctx, body);
  ctx.stroke();
  ctx.translate(split * 2, 0);
  ctx.strokeStyle = rgba(C.edgeMagenta, 0.5);
  trace(ctx, body);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  trace(ctx, body);
  ctx.clip();
  const top = G.y - U * 0.45;
  const bottom = G.y + U * 0.4;
  const fill = ctx.createLinearGradient(G.x - U * 0.38, top, G.x + U * 0.38, bottom);
  fill.addColorStop(0, C.bodyTop);
  fill.addColorStop(0.5, C.bodyMid);
  fill.addColorStop(1, C.bodyBottom);
  ctx.fillStyle = fill;
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = radial(ctx, G.x + U * 0.22, G.y + U * 0.2, U * 0.48, [[0, rgba(C.innerMagenta, 0.3 + 0.18 * G.glow)], [1, "rgba(0,0,0,0)"]]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.fillStyle = radial(ctx, G.x - U * 0.2, G.y - U * 0.18, U * 0.48, [[0, rgba(C.innerBlue, 0.34 + 0.2 * G.glow)], [1, "rgba(0,0,0,0)"]]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.fillStyle = radial(ctx, G.x + U * 0.3, G.y - U * 0.04, U * 0.34, [[0, rgba(C.innerTeal, 0.34)], [1, "rgba(0,0,0,0)"]]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = radial(ctx, G.x - U * 0.05, G.y - U * 0.02, U * 0.48, [[0, rgba(C.core, 0.48)], [0.7, rgba(C.core, 0.12)], [1, rgba(C.core, 0)]]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.globalAlpha = alpha * 0.055;
  ctx.fillStyle = C.scanline;
  const step = Math.max(3, U * 0.012);
  const offset = (t * U * 0.04) % step;
  for (let y = top - step + offset; y < bottom + U * 0.2; y += step) ctx.fillRect(G.x - U, y, U * 2, Math.max(1, step * 0.35));
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.05}px)`;
  ctx.lineWidth = U * 0.1;
  const rim = ctx.createLinearGradient(G.x - U * 0.4, top, G.x + U * 0.4, bottom);
  rim.addColorStop(0, rgba(C.rimTop, 0.68));
  rim.addColorStop(0.55, rgba(C.rimMid, 0.3));
  rim.addColorStop(1, rgba(C.rimBottom, 0.62));
  ctx.strokeStyle = rim;
  trace(ctx, body);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 4; i++) {
    const points = tentacle(G, t, i, U);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(i === 1 || i === 2 ? C.rimTop : C.rimBottom, 0.68);
    ctx.shadowColor = rgba(C.auraCyan, 0.8);
    ctx.shadowBlur = U * 0.035;
    strokeTentacle(ctx, points, U * (0.012 - i * 0.001), ctx.strokeStyle as string);
    ctx.restore();
  }

  ctx.strokeStyle = rgba(C.hairline, 0.48);
  ctx.lineWidth = 1.2;
  trace(ctx, body);
  ctx.stroke();
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.rotate(G.lean);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = rgba(C.specular, 0.62);
  ctx.lineWidth = U * 0.022;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-U * 0.02, -U * 0.1, U * 0.29, Math.PI * 1.12, Math.PI * 1.36);
  ctx.stroke();
  ctx.restore();
  drawEyes(ctx, G, U, w.eyeW);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of w.parts) {
    const progress = particle.t / particle.life;
    ctx.fillStyle = rgba(particle.c, (1 - progress) ** 1.4);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.s * (1 - progress * 0.3), 0, TAU);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  for (const z of w.zz) {
    const progress = z.t / B.zLife;
    ctx.fillStyle = rgba(C.z, Math.sin(progress * Math.PI) * 0.8);
    ctx.font = `600 ${U * (0.07 + progress * 0.05)}px system-ui,sans-serif`;
    ctx.fillText("z", z.x + Math.sin(z.t * 2) * U * 0.04 + progress * U * 0.12, z.y - progress * U * 0.35);
  }
  ctx.restore();
}
