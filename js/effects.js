/* Semua efek visual & animasi. Dipanggil lewat FX.* dari app.js dan pages.js */
window.FX = (() => {
  const { esc, $, $$ } = UI;
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* --- progres scroll, tombol atas, nav --- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = root.scrollHeight - innerHeight, p = h > 0 ? Math.min(scrollY / h, 1) : 0;
      $("#progress").style.transform = `scaleX(${p})`;
      const t = $("#totop");
      t.classList.toggle("show", scrollY > 500);
      t.style.setProperty("--p", p.toFixed(3));
      $("#nav").classList.toggle("scrolled", scrollY > 12);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* --- jaringan partikel interaktif di latar --- */
  const cv = $("#fx"), ctx = cv.getContext("2d");
  let W, H, pts = [], col = "110,165,255", raf = 0;
  const mouse = { x: -999, y: -999 };
  const readColor = () => { col = getComputedStyle(root).getPropertyValue("--fx").trim() || col; };
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.round((W * H) / 17000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = dx * dx + dy * dy;
      if (d < 16000) { const f = 1 - d / 16000; p.x += dx * f * .05; p.y += dy * f * .05; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${col},.75)`; ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
      if (d < 17000) { ctx.strokeStyle = `rgba(${col},${(1 - d / 17000) * .3})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
  };
  const loop = () => { draw(); raf = requestAnimationFrame(loop); };
  const startFx = () => { cancelAnimationFrame(raf); readColor(); size(); reduced ? draw() : loop(); };
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(startFx, 200); });
  document.addEventListener("visibilitychange", () => { if (reduced) return; document.hidden ? cancelAnimationFrame(raf) : loop(); });
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  /* --- cahaya yang mengikuti kursor --- */
  const glow = $("#glow");
  if (fine && !reduced) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => glow.classList.remove("on"));
    (function f() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(f); })();
  }

  /* --- tilt 3D, tombol magnetik, ripple (delegasi: sekali pasang) --- */
  document.addEventListener("pointermove", (e) => {
    if (reduced || e.pointerType === "touch") return;
    const t = e.target.closest && e.target.closest("[data-tilt]");
    if (t) {
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty("--rx", ((.5 - y) * 9).toFixed(2) + "deg");
      t.style.setProperty("--ry", ((x - .5) * 11).toFixed(2) + "deg");
      t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }
    const m = e.target.closest && e.target.closest("[data-magnetic]");
    if (m) {
      const r = m.getBoundingClientRect();
      m.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px");
      m.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + "px");
    }
  });
  document.addEventListener("pointerout", (e) => {
    const t = e.target.closest && e.target.closest("[data-tilt],[data-magnetic]");
    if (t && !t.contains(e.relatedTarget)) ["--rx", "--ry", "--tx", "--ty"].forEach((k) => t.style.removeProperty(k));
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".btn");
    if (!b || reduced) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) / 4, el = document.createElement("span");
    el.className = "ripple"; el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(el); setTimeout(() => el.remove(), 700);
  });

  /* --- toast --- */
  let tt;
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200); };

  /* --- teks: pecah kata, ketik bergantian, hitung naik --- */
  const split = (el) => {
    const txt = el.textContent.trim();
    el.setAttribute("aria-label", txt);
    el.innerHTML = txt.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(" ");
  };
  const typer = (el, words) => {
    if (!words.length) return;
    if (reduced) { el.textContent = words[0]; return; }
    let w = 0, i = 0, del = false;
    const tick = () => {
      if (!el.isConnected) return;
      const full = words[w];
      i += del ? -1 : 1;
      el.textContent = full.slice(0, i);
      let t = del ? 32 : 70;
      if (!del && i === full.length) { del = true; t = 1700; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; t = 380; }
      setTimeout(tick, t);
    };
    tick();
  };
  const count = (el) => {
    const to = +el.dataset.count || 0;
    if (reduced || to === 0) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* --- reveal saat di-scroll --- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
    if (e.target.dataset.count !== undefined) count(e.target);
  }), { threshold: .14, rootMargin: "0px 0px -6% 0px" }) : null;

  /* Pasang semua animasi pada konten halaman yang baru dirender */
  const bind = (c) => {
    $$("[data-split]", c).forEach(split);
    $$("[data-typer]", c).forEach((el) => { try { typer(el, JSON.parse(el.dataset.typer)); } catch {} });
    $$("[data-stagger]", c).forEach((p) => [...p.children].forEach((ch, i) => { if (!ch.hasAttribute("data-reveal")) ch.setAttribute("data-reveal", ""); ch.style.setProperty("--d", i * 80 + "ms"); }));
    $$("[data-reveal],[data-count],[data-draw]", c).forEach((el) => {
      if (!io) { el.classList.add("in"); if (el.dataset.count !== undefined) count(el); } else io.observe(el);
    });
    $$(".avatar img", c).forEach((im) => im.addEventListener("error", () => im.remove()));
  };

  const refreshColors = () => { readColor(); if (reduced) draw(); };
  startFx(); onScroll();
  return { bind, toast, refreshColors, reduced };
})();
