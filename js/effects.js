/* Efek halus: progres scroll, muncul lembut saat di-scroll, toast, dan jam. */
window.FX = (() => {
  const { $, $$ } = UI, root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = root.scrollHeight - innerHeight, p = h > 0 ? Math.min(scrollY / h, 1) : 0;
      $("#progress").style.transform = `scaleX(${p})`;
      const t = $("#totop"); t.classList.toggle("show", scrollY > 500); t.style.setProperty("--p", p.toFixed(3));
      $("#nav").classList.toggle("scrolled", scrollY > 12);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });

  let tt;
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200); };

  /* Jam: zona waktu diatur di SITE.clock (data.js). Hanya menit yang diperbarui. */
  const tz = (SITE.clock && SITE.clock.timezone) || "Asia/Jakarta";
  const tf = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
  const df = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: tz });
  const hf = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz });
  const tick = () => {
    const d = new Date(), t = tf.format(d), ph = (+hf.format(d) % 24) >= 6 && (+hf.format(d) % 24) < 18 ? "day" : "night";
    $$("[data-clock]").forEach((el) => {
      const a = $("time", el); if (a && a.textContent !== t) a.textContent = t;
      el.dataset.phase = ph;
      const dt = $("[data-clock-date]", el); if (dt) dt.textContent = df.format(d);
    });
  };
  setInterval(tick, 5000);

  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -5% 0px" }) : null;

  const bind = (c) => {
    $$("[data-typer]", c).forEach((el) => { try { el.textContent = JSON.parse(el.dataset.typer)[0] || ""; } catch {} });
    $$("[data-count]", c).forEach((el) => { el.textContent = el.dataset.count; });
    $$("[data-stagger]", c).forEach((p) => [...p.children].forEach((ch, i) => { if (!ch.hasAttribute("data-reveal")) ch.setAttribute("data-reveal", ""); ch.style.setProperty("--d", i * 60 + "ms"); }));
    $$("[data-reveal],[data-draw]", c).forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
    $$(".avatar img", c).forEach((im) => im.addEventListener("error", () => im.remove()));
    tick();
  };

  const refreshColors = () => {};
  onScroll();
  return { bind, toast, refreshColors, reduced, tick };
})();
