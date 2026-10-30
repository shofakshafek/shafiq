/* SHFQ Advertisement Engine + Announcement Center.
   Konfigurasi: config/advertisements.json dan config/announcements.json. Data statistik hanya di localStorage perangkat ini. */
window.Promo = (() => {
  const { esc, $ } = UI, K = "shfq.promo.v1", SK = "shfq.settings.v1", DAY = 864e5;
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" && !Array.isArray(v) ? v : d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("[Promo] penyimpanan gagal:", e); } };
  const n = (v, d, lo = 0, hi = 1e9) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);

  const norm = (o) => ({ ads: o.ads && typeof o.ads === "object" ? o.ads : {}, ann: o.ann && typeof o.ann === "object" ? o.ann : {} });
  let st = norm(read(K, {}));
  const save = () => write(K, st);
  const settings = () => ({ float: true, banner: true, ...read(SK, {}) });
  const sess = new Set(); try { JSON.parse(sessionStorage.getItem("shfq.sess") || "[]").forEach((x) => sess.add(String(x))); } catch (e) { console.warn("[Promo] sesi:", e); }
  const markSess = (id) => { sess.add(id); try { sessionStorage.setItem("shfq.sess", JSON.stringify([...sess])); } catch (e) { console.warn("[Promo] sesi:", e); } };

  const url = (u) => {
    u = String(u || ""); if (u === "{{whatsapp}}") u = SITE.contact && SITE.contact.whatsapp ? `https://wa.me/${SITE.contact.whatsapp}` : "";
    return /^(https?:|mailto:|tel:|#\/)/i.test(u) ? u : "";
  };

  /* --- kelayakan campaign --- */
  const hist = (map, id, ver) => { const h = map[id] || (map[id] = { imp: 0, click: 0, skip: 0, f: 0, last: 0, ver }); if (h.ver !== ver) { h.ver = ver; h.f = 0; h.last = 0; } return h; };
  const eligible = (c, map, kind, now = Date.now()) => {
    if (!c || typeof c.id !== "string" || c.active !== true) return false;
    const s = c.startDate ? Date.parse(c.startDate) : 0, e = c.endDate ? Date.parse(c.endDate) + DAY - 1 : Infinity;
    if (Number.isNaN(s) || Number.isNaN(e) || now < s || now > e) return false;
    if (kind && Array.isArray(c.placement) && !c.placement.includes(kind)) return false;
    const h = hist(map, c.id, String(c.campaignVersion ?? c.version ?? 1)), f = c.displayFrequency || "session";
    if (c.maxImpressions > 0 && h.f >= c.maxImpressions) return false;
    if (c.cooldownMinutes > 0 && now - h.last < c.cooldownMinutes * 6e4) return false;
    if (f === "once") return h.f === 0;
    if (f === "session") return !sess.has(kind + ":" + c.id);
    if (f === "daily") return now - h.last > DAY;
    return f === "always";
  };
  const pick = (list) => { const w = list.map((c) => Math.max(1, n(c.priority, 1))), t = w.reduce((a, b) => a + b, 0); let r = Math.random() * t; return list.find((_, i) => (r -= w[i]) < 0) || list[0]; };

  /* --- konfigurasi --- */
  const load = (path, key) => fetch(path, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(path + " HTTP " + r.status); return r.json(); }).then((j) => (Array.isArray(j[key]) ? j[key] : (() => { throw new Error(path + ": format salah"); })()));
  let ADS = [], ANN = [];
  const ready = Promise.all([load("config/advertisements.json", "campaigns").then((a) => (ADS = a), (e) => console.error("[Ads]", e)), load("config/announcements.json", "items").then((a) => (ANN = a), (e) => console.error("[Announcement]", e))]);

  /* --- modal --- */
  const busy = () => document.body.dataset.playing === "1" || $(".pm") || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "") || document.querySelector("form");
  const modal = (c, o) => new Promise((done) => {
    const prev = document.activeElement, el = document.createElement("div"), u = url(c.targetUrl), ext = /^https?:/i.test(u);
    el.className = "pm"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "pm-t");
    el.innerHTML = `<div class="pm-card"><button class="pm-x" type="button" aria-label="Tutup"${o.delay ? " disabled" : ""}>&times;</button>
      <span class="pm-label">${esc(c.label || o.label)}</span>${url(c.image) ? `<img src="${esc(url(c.image))}" alt="" loading="lazy">` : ""}
      <h2 id="pm-t">${esc(c.title)}</h2><p>${esc(c.description)}</p>
      <div class="pm-act">${u ? `<a class="btn primary pm-go" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(c.buttonText || "Buka")}</a>` : ""}<button class="btn pm-skip" type="button"${o.delay ? " disabled" : ""}>${o.delay ? `Skip Ad (${o.delay})` : "Tutup"}</button></div>
      <small>${esc(o.footer)}</small></div>`;
    document.body.appendChild(el);
    const skip = $(".pm-skip", el), x = $(".pm-x", el); let left = o.delay, iv = 0;
    const close = (how) => { clearInterval(iv); document.removeEventListener("keydown", key); el.remove(); if (prev && prev.focus) prev.focus(); done(how); };
    const key = (e) => { if (e.key === "Escape" && !x.disabled) close("close"); if (e.key === "Tab") { const f = [...el.querySelectorAll("a,button:not([disabled])")]; if (!f.length) return; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); } };
    document.addEventListener("keydown", key);
    if (o.delay) iv = setInterval(() => { left -= 1; if (left > 0) skip.textContent = `Skip Ad (${left})`; else { clearInterval(iv); skip.textContent = "Skip Ad"; skip.disabled = x.disabled = false; } }, 1000);
    skip.onclick = () => close("skip"); x.onclick = () => close(o.delay ? "skip" : "close");
    $(".pm-go", el)?.addEventListener("click", () => setTimeout(() => close("click"), 0));
    (skip.disabled ? $(".pm-go", el) || el : skip).focus?.();
  });

  const showAd = async (c) => {
    const h = hist(st.ads, c.id, String(c.campaignVersion ?? 1)); h.imp++; h.f++; h.last = Date.now(); markSess("interstitial:" + c.id); save();
    const how = await modal(c, { label: "ADVERTISEMENT", footer: "Official Information — SHFQ DEV.", delay: n(c.skipDelay, 5, 0, 15) });
    if (how === "click") h.click++; else if (how === "skip") h.skip++;
    save();
  };
  const showAnn = async (c) => {
    const h = hist(st.ann, c.id, String(c.version ?? 1)); h.f++; h.last = Date.now(); h.read = true; save();
    await modal(c, { label: "ANNOUNCEMENT", footer: "SHFQ ANNOUNCEMENT CENTER", delay: 0 });
  };

  /* --- iklan melayang & banner --- */
  const floating = () => {
    const s = settings(); if (!s.float || busy() || $(".fa")) return;
    const list = ADS.filter((c) => eligible(c, st.ads, "floating")); if (!list.length) return;
    const c = pick(list), u = url(c.targetUrl), ext = /^https?:/i.test(u), h = hist(st.ads, c.id, String(c.campaignVersion ?? 1));
    h.imp++; h.f++; h.last = Date.now(); markSess("floating:" + c.id); save();
    const el = document.createElement("aside"); el.className = "fa"; el.setAttribute("aria-label", "Iklan");
    el.innerHTML = `<button class="fa-x" type="button" aria-label="Tutup iklan">&times;</button><small>${esc(c.label || "ADVERTISEMENT")}</small><b>${esc(c.title)}</b><p>${esc(c.description)}</p>${u ? `<a class="btn primary" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(c.buttonText || "Buka")}</a>` : ""}`;
    document.body.appendChild(el);
    $(".fa-x", el).onclick = () => { h.skip++; save(); el.remove(); };
    $("a", el)?.addEventListener("click", () => { h.click++; save(); el.remove(); });
  };
  const banners = () => {
    const s = settings();
    document.querySelectorAll("[data-ad-slot]").forEach((slot) => {
      if (slot.dataset.done) return; slot.dataset.done = "1";
      const list = ADS.filter((c) => c.active === true && Array.isArray(c.placement) && c.placement.includes("banner") && eligible({ ...c, displayFrequency: "always" }, st.ads, "banner"));
      if (!s.banner || !list.length) { slot.remove(); return; }
      const c = pick(list), u = url(c.targetUrl), ext = /^https?:/i.test(u), h = hist(st.ads, c.id, String(c.campaignVersion ?? 1));
      if (!sess.has("banner:" + c.id)) { h.imp++; h.last = Date.now(); markSess("banner:" + c.id); save(); }
      slot.innerHTML = `<div class="ban"><small>${esc(c.label || "ADVERTISEMENT")}</small><div><b>${esc(c.title)}</b><p>${esc(c.description)}</p></div>${u ? `<a class="btn" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(c.buttonText || "Buka")}</a>` : ""}</div>`;
      $("a", slot)?.addEventListener("click", () => { h.click++; save(); });
    });
  };

  /* --- antrean: pengumuman dulu, lalu iklan interstitial, lalu iklan melayang --- */
  let started = false, tries = 0;
  const run = async () => {
    if (busy()) { if (tries++ < 8) setTimeout(run, 4000); return; }
    const a = ANN.filter((c) => eligible(c, st.ann, null)).sort((x, y) => n(y.priority, 0) - n(x.priority, 0))[0];
    if (a) await showAnn(a);
    const ads = ADS.filter((c) => eligible(c, st.ads, "interstitial") && (c.type || "interstitial") === "interstitial");
    if (ads.length && !busy()) await showAd(pick(ads));
    setTimeout(floating, 2500);
  };
  const start = () => { if (started) return; started = true; ready.then(() => { banners(); setTimeout(run, 1200); }); };

  addEventListener("pagerendered", (e) => {
    const pg = $("#main .page");
    if (pg && ["home", "project"].includes(e.detail) && !$("[data-ad-slot]", pg)) pg.insertAdjacentHTML("beforeend", '<div class="wrap"><div data-ad-slot="page"></div></div>');
    ready.then(banners);
  });
  document.readyState === "complete" ? start() : addEventListener("load", start);

  return {
    ready,
    stats() {
      const rows = ADS.map((c) => { const h = st.ads[c.id] || {}; return { id: c.id, title: c.title, active: c.active === true, imp: h.imp || 0, click: h.click || 0, skip: h.skip || 0 }; });
      return { rows, imp: rows.reduce((a, r) => a + r.imp, 0), click: rows.reduce((a, r) => a + r.click, 0), skip: rows.reduce((a, r) => a + r.skip, 0) };
    },
    list: () => ANN.filter((c) => c && c.id && eligible({ ...c, displayFrequency: "always" }, st.ann, null)).map((c) => ({ ...c, read: !!(st.ann[c.id] && st.ann[c.id].read) })),
    reopen: (id) => { const c = ANN.find((x) => x.id === id); return c ? showAnn(c) : Promise.resolve(); },
    resetAnnouncements() { st.ann = {}; save(); },
    resetStats() { st.ads = {}; sess.clear(); try { sessionStorage.removeItem("shfq.sess"); } catch (e) { console.warn(e); } save(); },
    settings, setSettings(o) { write(SK, { ...settings(), ...o }); },
    resetAll() { st = norm({}); try { [K, SK, "shfq.games.v1"].forEach((k) => localStorage.removeItem(k)); } catch (e) { console.warn(e); } },
  };
})();
