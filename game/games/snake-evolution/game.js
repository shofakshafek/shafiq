const c = document.getElementById("c"), x = c.getContext("2d"), N = 18, S = 20, $ = (i) => document.getElementById(i);
c.width = c.height = N * S;
let sn, d, nd, f, sc, over, paused, acc, last = 0, best = 0;
const food = () => { do f = { x: Math.random() * N | 0, y: Math.random() * N | 0 }; while (sn.some((s) => s.x === f.x && s.y === f.y)); };
const reset = () => { sn = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }]; d = nd = { x: 1, y: 0 }; sc = 0; over = paused = false; acc = 0; food(); };
const delay = () => Math.max(55, 150 - sc * 1.2); /* makin cepat seiring skor */
const end = () => { over = true; B.score(sc); best = Math.max(best, sc, B.hs); };
const step = () => {
  d = nd; const h = { x: sn[0].x + d.x, y: sn[0].y + d.y };
  if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || sn.some((s) => s.x === h.x && s.y === h.y)) return end();
  sn.unshift(h); if (h.x === f.x && h.y === f.y) { sc += 10; food(); } else sn.pop();
};
const dir = (dx, dy) => { if (dx === -d.x && dy === -d.y) return; nd = { x: dx, y: dy }; };
const txt = (t, y) => { x.fillStyle = "#e9f0ff"; x.textAlign = "center"; x.font = "bold 22px system-ui"; x.fillText(t, c.width / 2, y); };
const draw = () => {
  x.fillStyle = "#071231"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#ff6b8b"; x.beginPath(); x.arc(f.x * S + S / 2, f.y * S + S / 2, S / 2 - 3, 0, 7); x.fill();
  sn.forEach((s, i) => { x.fillStyle = i ? "#4f8cff" : "#9ac2ff"; x.fillRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2); });
  $("s").textContent = sc; $("b").textContent = Math.max(best, B.hs, sc); $("st").textContent = paused ? "Jeda" : "";
  if (over) { x.fillStyle = "rgba(3,8,22,.7)"; x.fillRect(0, 0, c.width, c.height); txt("Game Over", c.height / 2 - 6); x.font = "14px system-ui"; x.fillText("Ketuk / tekan R untuk main lagi", c.width / 2, c.height / 2 + 22); }
};
const loop = (t) => { const dt = t - last; last = t; if (!paused && !over) { acc += Math.min(dt, 100); while (acc >= delay() && !over) { acc -= delay(); step(); } } draw(); requestAnimationFrame(loop); };
const pause = () => { if (!over) paused = !paused; };
B.onCmd = (m) => { if (m === "pause") paused = true; else if (m === "resume") paused = false; else if (m === "restart") reset(); };
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase(), m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k];
  if (m) { e.preventDefault(); dir(...m); } else if (k === "p" || k === " ") { e.preventDefault(); pause(); } else if (k === "r" || (k === "enter" && over)) reset();
});
document.querySelectorAll("#pad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); dir(...b.dataset.d.split(",").map(Number)); }));
let p0; c.addEventListener("pointerdown", (e) => { if (over) return reset(); p0 = [e.clientX, e.clientY]; });
c.addEventListener("pointerup", (e) => { if (!p0) return; const dx = e.clientX - p0[0], dy = e.clientY - p0[1]; p0 = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; Math.abs(dx) > Math.abs(dy) ? dir(Math.sign(dx), 0) : dir(0, Math.sign(dy)); });
reset(); B.ready(); requestAnimationFrame(loop);
