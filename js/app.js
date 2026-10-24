/* Router, navigasi, tema, dan penghubung semua modul. */
(() => {
  const { esc, ic, $, $$ } = UI, { PAGES, notFound, initials } = Pages, S = SITE, root = document.documentElement;

  /* --- tema --- */
  let saved = null; try { saved = localStorage.getItem("theme"); } catch {}
  if (!saved && S.settings.theme !== "auto") root.dataset.theme = S.settings.theme;
  const isDark = () => root.dataset.theme === "dark";
  const applyTheme = (t) => { root.dataset.theme = t; $('meta[name="theme-color"]').content = t === "dark" ? "#040a1c" : "#fff4f5"; FX.refreshColors(); };
  applyTheme(root.dataset.theme);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let s = null; try { s = localStorage.getItem("theme"); } catch {}
    if (!s && S.settings.theme === "auto") applyTheme(e.matches ? "dark" : "light");
  });

  /* --- kerangka: nav, footer, tombol atas --- */
  $("#ld-mark").textContent = initials;
  $("#nav").innerHTML = `<div class="wrap bar">
    <a class="brand" href="#/home"><span class="mark">${esc(initials)}</span>${esc(S.name)}</a>
    <nav class="links" id="links" aria-label="Navigasi utama"><span class="ind"></span>${PAGES.map(([id, label], i) => `<a href="#/${id}" data-id="${id}" style="--i:${i}">${label}</a>`).join("")}</nav>
    <button class="icon-btn" id="theme" type="button" aria-label="Ganti tema">${ic("sun", "sun")}${ic("moon", "moon")}</button>
    <button class="icon-btn menu" id="menu" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="links">${ic("menu")}</button></div>`;
  $("#foot").innerHTML = `<div class="wrap foot-in"><span>&copy; ${new Date().getFullYear()} ${esc(S.name)}</span>
    <nav aria-label="Navigasi footer">${PAGES.map(([id, label]) => `<a href="#/${id}">${label}</a>`).join("")}</nav></div>`;
  $("#totop").innerHTML = `<svg class="rp" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21.5" pathLength="100"/></svg>${ic("up")}`;
  $("#totop").onclick = () => scrollTo({ top: 0, behavior: FX.reduced ? "auto" : "smooth" });

  const nav = $("#nav"), menu = $("#menu");
  const setMenu = (open) => {
    nav.toggleAttribute("data-open", open);
    menu.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    menu.innerHTML = ic(open ? "close" : "menu");
  };
  menu.onclick = () => setMenu(!nav.hasAttribute("data-open"));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  $(".skip").onclick = (e) => { e.preventDefault(); $("#main").focus(); };

  /* tombol tema: lingkaran meluas dari posisi tombol (View Transitions), dengan fallback */
  $("#theme").onclick = (e) => {
    const t = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", t); } catch {}
    if (!document.startViewTransition || FX.reduced) return applyTheme(t);
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(t)).ready.then(() =>
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 700, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" })
    ).catch(() => {});
  };

  /* indikator pil yang meluncur di menu desktop */
  const place = () => {
    const a = $("#links a[aria-current]"), ind = $(".ind");
    if (!a || innerWidth <= 860) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = a.offsetWidth + "px"; ind.style.height = a.offsetHeight + "px";
    ind.style.top = a.offsetTop + "px"; ind.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  addEventListener("resize", place);
  if (document.fonts) document.fonts.ready.then(place);

  /* --- delegasi: FAQ akordeon, salin tautan --- */
  document.addEventListener("click", (e) => {
    const q = e.target.closest(".faq-q");
    if (q) { const open = q.parentElement.classList.toggle("open"); q.setAttribute("aria-expanded", open); }
    const c = e.target.closest("[data-copy]");
    if (c) {
      const v = c.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => FX.toast("Tautan disalin"), () => FX.toast("Gagal menyalin, salin manual dari tombol Buka"));
    }
  });

  /* --- QRIS: status muat gambar --- */
  const bindQr = () => {
    const fig = $("[data-qr]"); if (!fig) return;
    const img = $("img", fig);
    const ok = () => fig.classList.add("ok");
    const bad = () => { fig.classList.add("bad"); $(".qr-err", fig).hidden = false; };
    img.addEventListener("load", ok); img.addEventListener("error", bad);
    if (img.complete) img.naturalWidth ? ok() : bad();
  };

  /* --- router dengan transisi halaman --- */
  let first = true, cur = null, token = 0;
  async function route() {
    const my = ++token, id = location.hash.replace(/^#\/?/, "") || "home";
    if (!first && id === cur) return;
    const main = $("#main"), old = $(".page", main);
    if (!first && old && !FX.reduced) { old.classList.add("leave"); await new Promise((r) => setTimeout(r, 230)); }
    if (my !== token) return;
    const page = PAGES.find((p) => p[0] === id);
    main.innerHTML = `<div class="page">${page ? page[3]() : notFound()}</div>`;
    cur = id;
    document.title = `${page ? page[2] : "Tidak ditemukan"} | ${S.name}`;
    $$("#links a").forEach((a) => (a.dataset.id === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    setMenu(false); place();
    if (!first) { scrollTo({ top: 0, behavior: "instant" }); main.focus({ preventScroll: true }); }
    first = false;
    FX.bind(main); bindQr();
  }
  addEventListener("hashchange", route);
  route();

  /* --- loader awal selesai -> mulai animasi kata --- */
  const ready = () => { document.body.classList.add("ready"); $("#loader").classList.add("done"); setTimeout(() => $("#loader").remove(), 900); };
  let done = false; const go = () => { if (!done) { done = true; setTimeout(ready, 450); } };
  document.readyState === "complete" ? go() : addEventListener("load", go);
  setTimeout(go, 2500);
})();
