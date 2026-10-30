const $ = (i) => document.getElementById(i), E = ["🍎", "🚀", "🎧", "🌙", "⚡", "🐱", "🍀", "🎲", "🔥", "💎", "🌵", "🎯"];
let cards, open, moves, secs, iv, left, paused, locked, best = 0;
const fmt = () => { $("t").textContent = secs; $("m").textContent = moves; $("b").textContent = Math.max(best, B.hs); };
const start = () => {
  clearInterval(iv); const [cols, rows] = $("lv").value.split(",").map(Number), pairs = (cols * rows) / 2;
  cards = E.slice(0, pairs).flatMap((e) => [e, e]).sort(() => Math.random() - 0.5); open = []; moves = secs = 0; left = pairs; paused = locked = false; iv = 0;
  const g = $("g"); g.style.gridTemplateColumns = `repeat(${cols},1fr)`; g.innerHTML = "";
  cards.forEach((e, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Kartu " + (i + 1)); b.textContent = "?"; b.onclick = () => flip(i, b); g.appendChild(b); });
  $("w").classList.remove("on"); fmt();
};
const flip = (i, b) => {
  if (locked || paused || b.classList.contains("up") || b.classList.contains("ok")) return;
  if (!iv) iv = setInterval(() => { if (!paused) { secs++; fmt(); } }, 1000);
  b.classList.add("up"); b.textContent = cards[i]; open.push([i, b]);
  if (open.length < 2) return;
  moves++; fmt(); const [[i1, b1], [i2, b2]] = open; open = [];
  if (cards[i1] === cards[i2]) { b1.className = b2.className = "ok"; if (!--left) win(); return; }
  locked = true; setTimeout(() => { [b1, b2].forEach((x) => { x.classList.remove("up"); x.textContent = "?"; }); locked = false; }, 700);
};
const win = () => {
  clearInterval(iv); const pairs = cards.length / 2, score = Math.max(pairs * 10, pairs * 100 - moves * 5 - secs * 2);
  best = Math.max(best, score); fmt(); $("wt").textContent = `Skor ${score} · ${moves} langkah · ${secs} detik`; $("w").classList.add("on"); B.score(score);
};
B.onCmd = (m) => { if (m === "pause") paused = true; else if (m === "resume") paused = false; else if (m === "restart") start(); };
$("lv").onchange = $("r").onclick = $("r2").onclick = start;
start(); B.ready();
