(() => {
  const { esc, ic, $, $$ } = UI, GK = "shfq.games.v1";
  let games = [], q = "", cat = "Semua", frame = null, timer = 0, paused = false;

  const get = () => {
    let o = {}; try { o = JSON.parse(localStorage.getItem(GK)) || {}; } catch (e) { console.warn("[Arcade] data rusak, direset:", e); }
    const ids = new Set(games.map((g) => g.id)), arr = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string") : []);
    const hs = {}; if (o.hs && typeof o.hs === "object") for (const [k, v] of Object.entries(o.hs)) if (Number.isFinite(v) && v >= 0 && v < 1e8 && (!ids.size || ids.has(k))) hs[k] = v;
    return { fav: arr(o.fav), recent: arr(o.recent).slice(0, 6), hs };
  };
  const put = (s) => { try { localStorage.setItem(GK, JSON.stringify(s)); } catch (e) { FX.toast("Progres tidak dapat disimpan"); console.warn(e); } };

  const arcadeHTML = () => `<div class="wrap page-head"><h1>SHFQ Game Arcade</h1><p class="lead">Mini platform game di dalam portofolio. Setiap game berjalan terisolasi di iframe sandbox.</p></div>
    <div class="wrap" id="arc"><p class="note" id="arc-load" role="status">Memuat game…</p></div>
    <div class="wrap"><div data-ad-slot="arcade"></div></div>`;

  const card = (g, s) => `<article class="gcard"><div class="gthumb" aria-hidden="true">${esc(g.icon)}</div><div class="gbody">
      <small>${esc(g.category)} · v${esc(g.version)} · ${esc(g.developer)}</small><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p>
      <small>Skor terbaik: <b>${s.hs[g.id] || 0}</b></small>
      <div class="actions"><button class="btn primary" type="button" data-play="${esc(g.id)}">${ic("play")} Main</button>
      <button class="btn" type="button" data-fav="${esc(g.id)}" aria-pressed="${s.fav.includes(g.id)}" aria-label="Favorit ${esc(g.name)}">${ic("heart")} ${s.fav.includes(g.id) ? "Favorit" : "Simpan"}</button></div></div></article>`;

  const catalog = () => {
    const root = $("#arc"); if (!root) return;
    const s = get(), cats = ["Semua", "Favorit", ...new Set(games.map((g) => g.category))];
    const list = games.filter((g) => (cat === "Semua" || (cat === "Favorit" ? s.fav.includes(g.id) : g.category === cat)) && (g.name + " " + g.description).toLowerCase().includes(q.toLowerCase()));
    const rec = s.recent.map((id) => games.find((g) => g.id === id)).filter(Boolean);
    root.innerHTML = `<div class="gtools"><label class="sr" for="gq">Cari game</label><input id="gq" type="search" placeholder="Cari game…" value="${esc(q)}" autocomplete="off">
      <div class="chips" role="group" aria-label="Kategori">${cats.map((c) => `<button type="button" class="chip${c === cat ? " on" : ""}" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join("")}</div></div>
      ${rec.length ? `<h2>Terakhir dimainkan</h2><p class="note">${rec.map((g) => `<button class="chip" type="button" data-play="${esc(g.id)}">${esc(g.icon)} ${esc(g.name)}</button>`).join(" ")}</p>` : ""}
      <h2>Katalog</h2>${list.length ? `<div class="ggrid">${list.map((g) => card(g, s)).join("")}</div>` : `<div class="empty"><h2>Tidak ada game</h2><p>Coba kata kunci atau kategori lain.</p></div>`}`;
    const i = $("#gq"); if (document.activeElement === document.body && q) { i.focus(); i.setSelectionRange(q.length, q.length); }
  };

  const stop = () => { clearTimeout(timer); if (frame) { frame.src = "about:blank"; frame.remove(); } frame = null; paused = false; document.body.dataset.playing = "0"; };
  const send = (cmd) => frame && frame.contentWindow && frame.contentWindow.postMessage({ type: "shfq:cmd", cmd }, "*");
  const play = (id) => {
    const g = games.find((x) => x.id === id), root = $("#arc"); if (!g || !root) return;
    stop(); document.body.dataset.playing = "1";
    const s = get(); s.recent = [id, ...s.recent.filter((x) => x !== id)].slice(0, 6); put(s);
    root.innerHTML = `<section class="gplayer" aria-label="${esc(g.name)}"><div class="gbar"><b>${esc(g.name)}</b><span>
      <button class="btn" type="button" data-cmd="pause" id="gp">${ic("pause")} Jeda</button><button class="btn" type="button" data-cmd="restart">Ulang</button>
      <button class="btn" type="button" data-cmd="full">Layar penuh</button><button class="btn" type="button" data-cmd="exit">Keluar</button></span></div>
      <div class="gstage" id="gstage"><p class="gstat" id="gstat" role="status">Memuat ${esc(g.name)}…</p></div>
      <p class="note">Kontrol: ${g.controls.map(esc).join(" · ") || "-"}</p></section>`;
    frame = document.createElement("iframe"); frame.title = g.name; frame.setAttribute("sandbox", "allow-scripts"); frame.setAttribute("allow", "fullscreen"); frame.referrerPolicy = "no-referrer";
    frame.src = `${g.entryUrl}?v=${encodeURIComponent(g.version)}`; frame.dataset.id = id;
    $("#gstage").appendChild(frame);
    const fail = () => { const t = $("#gstat"); if (t) { t.classList.remove("hide"); t.innerHTML = `Game gagal dimuat. <button class="btn" type="button" data-play="${esc(id)}">Coba lagi</button>`; } };
    frame.addEventListener("error", fail); timer = setTimeout(fail, 8000);
  };

  addEventListener("message", (e) => {
    if (!frame || e.source !== frame.contentWindow) return;
    const m = e.data; if (!m || typeof m !== "object" || typeof m.type !== "string") return;
    if (m.type === "shfq:ready") { clearTimeout(timer); const t = $("#gstat"); if (t) t.classList.add("hide"); frame.contentWindow.postMessage({ type: "shfq:init", hs: get().hs[frame.dataset.id] || 0 }, "*"); }
    else if (m.type === "shfq:score" && Number.isFinite(m.score) && m.score >= 0 && m.score < 1e8) {
      const s = get(), id = frame.dataset.id; if (m.score > (s.hs[id] || 0)) { s.hs[id] = Math.floor(m.score); put(s); FX.toast("Rekor baru: " + s.hs[id]); }
    }
  });
  window.addEventListener("pagerendered", (e) => { if (e.detail !== "games") stop(); });

  const settingsHTML = () => `<div class="wrap page-head"><h1>Settings</h1><p class="lead">Preferensi tersimpan hanya di perangkat ini.</p></div>
    <div class="wrap sup" id="set">
      <section class="sup-sec"><h2>Tampilan & iklan</h2><div class="setrow"><label><input type="checkbox" id="s-float"> Tampilkan iklan melayang</label><label><input type="checkbox" id="s-banner"> Tampilkan banner iklan</label></div>
        <p class="note">Iklan interstitial selalu bisa ditutup setelah hitung mundur. Pengumuman penting tidak bisa dimatikan, tetapi hanya tampil sesuai frekuensi dan bisa dibuka ulang di bawah.</p></section>
      <section class="sup-sec"><h2>Announcement Center</h2><div id="s-ann"><p class="note">Memuat…</p></div></section>
      <section class="sup-sec"><h2>Statistik iklan (lokal)</h2><div id="s-stat"></div></section>
      <section class="sup-sec"><h2>Privasi</h2><div class="actions"><button class="btn" type="button" data-reset="games">Reset progres game</button><button class="btn" type="button" data-reset="fav">Reset favorit</button>
        <button class="btn" type="button" data-reset="ann">Reset status pengumuman</button><button class="btn" type="button" data-reset="stats">Reset statistik iklan</button><button class="btn primary" type="button" data-reset="all">Reset semua data lokal</button></div></section>
    </div>`;

  const fillSettings = () => {
    const s = Promo.settings(); $("#s-float").checked = s.float; $("#s-banner").checked = s.banner;
    Promo.ready.then(() => {
      const a = $("#s-ann"), t = $("#s-stat"); if (!a) return;
      const l = Promo.list(); a.innerHTML = l.length ? `<ul class="rows">${l.map((x) => `<li><div class="row"><span class="grow"><b>${esc(x.title)}</b><small>${esc(x.description)}</small></span><button class="btn" type="button" data-ann="${esc(x.id)}">${x.read ? "Buka lagi" : "Baru · Buka"}</button></div></li>`).join("")}</ul>` : `<p class="note">Belum ada pengumuman aktif.</p>`;
      const st = Promo.stats(); t.innerHTML = `<p class="note">Impresi <b>${st.imp}</b> · Klik <b>${st.click}</b> · Skip/tutup <b>${st.skip}</b></p>` + (st.rows.length ? `<ul class="rows">${st.rows.map((r) => `<li><div class="row${r.active ? "" : " off"}"><span class="grow"><b>${esc(r.title)}</b><small>${r.active ? "aktif" : "nonaktif"} · ${r.imp} tayang · ${r.click} klik · ${r.skip} skip</small></span></div></li>`).join("")}</ul>` : "");
    });
  };
  const RESET = {
    games: ["Reset progres game (skor tertinggi dan terakhir dimainkan)?", () => { const s = get(); put({ fav: s.fav, recent: [], hs: {} }); }],
    fav: ["Reset daftar favorit game?", () => { const s = get(); put({ ...s, fav: [] }); }],
    ann: ["Reset status baca pengumuman?", () => Promo.resetAnnouncements()],
    stats: ["Reset statistik iklan?", () => Promo.resetStats()],
    all: ["Hapus semua data lokal situs ini (tema, game, iklan, pengaturan)?", () => Promo.resetAll()],
  };

  document.addEventListener("click", (e) => {
    const t = e.target, pl = t.closest("[data-play]"), fv = t.closest("[data-fav]"), ct = t.closest("[data-cat]"), cm = t.closest("[data-cmd]"), rs = t.closest("[data-reset]"), an = t.closest("[data-ann]");
    if (pl) return play(pl.dataset.play);
    if (fv) { const s = get(), id = fv.dataset.fav; s.fav = s.fav.includes(id) ? s.fav.filter((x) => x !== id) : [...s.fav, id]; put(s); return catalog(); }
    if (ct) { cat = ct.dataset.cat; return catalog(); }
    if (an) return Promo.reopen(an.dataset.ann).then(fillSettings);
    if (rs) { const [msg, fn] = RESET[rs.dataset.reset] || []; if (fn && confirm(msg)) { fn(); FX.toast("Data direset"); fillSettings(); } return; }
    if (!cm) return;
    const c = cm.dataset.cmd;
    if (c === "exit") { stop(); catalog(); }
    else if (c === "full") { const st = $("#gstage"); (st.requestFullscreen || st.webkitRequestFullscreen || (() => FX.toast("Layar penuh tidak didukung"))).call(st); }
    else if (c === "pause") { paused = !paused; send(paused ? "pause" : "resume"); cm.innerHTML = paused ? `${ic("play")} Lanjut` : `${ic("pause")} Jeda`; }
    else if (c === "restart") { paused = false; send("restart"); const b = $("#gp"); if (b) b.innerHTML = `${ic("pause")} Jeda`; }
  });
  let qt; document.addEventListener("input", (e) => {
    if (e.target.id === "gq") { clearTimeout(qt); qt = setTimeout(() => { q = e.target.value; catalog(); }, 150); }
    if (e.target.id === "s-float") Promo.setSettings({ float: e.target.checked });
    if (e.target.id === "s-banner") Promo.setSettings({ banner: e.target.checked });
  });

  window.addEventListener("pagerendered", (e) => {
    if (e.detail === "games") GameLoader.load().then((l) => { games = l; if (!l.length) { $("#arc").innerHTML = `<div class="empty"><h2>Belum ada game</h2><p>Daftarkan game di <code>game/registry.js</code>.</p></div>`; return; } catalog(); }).catch((err) => { console.error(err); const a = $("#arc"); if (a) a.innerHTML = `<div class="empty"><h2>Game gagal dimuat</h2><p>Muat ulang halaman.</p></div>`; });
    if (e.detail === "settings") fillSettings();
  });

  Pages.PAGES.push(["games", "Games", "Game Arcade", arcadeHTML], ["settings", "Settings", "Settings", settingsHTML]);
})();
