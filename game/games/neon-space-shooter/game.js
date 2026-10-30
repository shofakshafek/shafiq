const c = document.getElementById("c"), x = c.getContext("2d"), W = 360, H = 480, $ = (i) => document.getElementById(i);
c.width = W; c.height = H;
let p, bl, en, sc, hp, over, paused, sp, fi, last = 0, best = 0, tgt = null; const keys = {};
const reset = () => { p = { x: W / 2, y: H - 50 }; bl = []; en = []; sc = 0; hp = 3; over = paused = false; sp = 0; fi = 0; tgt = null; };
const end = () => { over = true; B.score(sc); best = Math.max(best, sc, B.hs); };
const update = (dt) => {
  const v = 240 * dt; if (keys.l) p.x -= v; if (keys.r) p.x += v; if (keys.u) p.y -= v; if (keys.d) p.y += v;
  if (tgt) { p.x += (tgt.x - p.x) * Math.min(1, dt * 14); p.y += (tgt.y - p.y) * Math.min(1, dt * 14); }
  p.x = Math.min(W - 14, Math.max(14, p.x)); p.y = Math.min(H - 20, Math.max(H / 2, p.y));
  if ((fi -= dt) <= 0) { fi = 0.22; bl.push({ x: p.x, y: p.y - 16 }); }
  if ((sp -= dt) <= 0) { sp = Math.max(0.28, 1 - sc / 900); en.push({ x: 16 + Math.random() * (W - 32), y: -16, v: 70 + Math.min(sc / 8, 140) + Math.random() * 30 }); }
  bl.forEach((b) => (b.y -= 460 * dt)); en.forEach((e) => (e.y += e.v * dt));
  for (const e of en) for (const b of bl) if (!e.dead && !b.dead && Math.hypot(e.x - b.x, e.y - b.y) < 17) { e.dead = b.dead = true; sc += 10; }
  for (const e of en) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 22) { e.dead = true; hp--; }
  bl = bl.filter((b) => !b.dead && b.y > -10); en = en.filter((e) => !e.dead && e.y < H + 20);
  if (hp <= 0) end();
};
const txt = (t, y, s) => { x.fillStyle = "#e9f0ff"; x.textAlign = "center"; x.font = s; x.fillText(t, W / 2, y); };
const draw = () => {
  x.fillStyle = "#050b1e"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#38d1f5"; bl.forEach((b) => x.fillRect(b.x - 2, b.y - 8, 4, 12));
  x.fillStyle = "#ff6b8b"; en.forEach((e) => { x.beginPath(); x.moveTo(e.x, e.y + 14); x.lineTo(e.x - 14, e.y - 10); x.lineTo(e.x + 14, e.y - 10); x.fill(); });
  x.fillStyle = "#4f8cff"; x.beginPath(); x.moveTo(p.x, p.y - 18); x.lineTo(p.x - 14, p.y + 14); x.lineTo(p.x + 14, p.y + 14); x.fill();
  $("s").textContent = sc; $("b").textContent = Math.max(best, B.hs, sc); $("l").textContent = Math.max(hp, 0); $("st").textContent = paused ? "Jeda" : "";
  if (over) { x.fillStyle = "rgba(3,8,22,.72)"; x.fillRect(0, 0, W, H); txt("Game Over", H / 2 - 6, "bold 26px system-ui"); txt("Ketuk / tekan R untuk main lagi", H / 2 + 24, "14px system-ui"); }
};
const loop = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!paused && !over) update(dt); draw(); requestAnimationFrame(loop); };
B.onCmd = (m) => { if (m === "pause") paused = true; else if (m === "resume") paused = false; else if (m === "restart") reset(); };
const K = { arrowleft: "l", a: "l", arrowright: "r", d: "r", arrowup: "u", w: "u", arrowdown: "d", s: "d" };
addEventListener("keydown", (e) => { const k = e.key.toLowerCase(); if (K[k]) { e.preventDefault(); keys[K[k]] = true; } else if (k === "p" || k === " ") { e.preventDefault(); if (!over) paused = !paused; } else if (k === "r" || (k === "enter" && over)) reset(); });
addEventListener("keyup", (e) => { const k = K[e.key.toLowerCase()]; if (k) keys[k] = false; });
const pt = (e) => { const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H - 40 }; };
c.addEventListener("pointerdown", (e) => { if (over) return reset(); tgt = pt(e); c.setPointerCapture(e.pointerId); });
c.addEventListener("pointermove", (e) => { if (tgt) tgt = pt(e); });
["pointerup", "pointercancel"].forEach((t) => c.addEventListener(t, () => (tgt = null)));
reset(); B.ready(); requestAnimationFrame(loop);
