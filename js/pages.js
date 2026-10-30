window.Pages = (() => {
  const { esc, safeUrl, ic } = UI;
  const S = SITE, D = S.donation, SUP = S.support, C = S.collab;
  const initials = S.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const chips = (a) => (a && a.length ? `<div class="chips">${a.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : "");
  const head = (t, lead) => `<div class="wrap page-head"><h1 data-split>${esc(t)}</h1>${lead ? `<p class="lead" data-reveal style="--d:300ms">${esc(lead)}</p>` : ""}</div>`;
  const empty = (t, p, extra = "") => `<div class="empty" data-reveal><h2>${t}</h2><p>${p}</p>${extra}</div>`;

  const row = (icon, title, sub, href, external) => {
    const u = safeUrl(href);
    const body = `${ic(icon)}<span class="grow"><b>${esc(title)}</b><small>${esc(sub)}</small></span><span class="tag">${u ? "Buka" : "Belum diatur"}</span>`;
    return `<li>${u ? `<a class="row" href="${esc(u)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${body}</a>` : `<div class="row off">${body}</div>`}</li>`;
  };

  const CK = S.clock || { place: "", label: "WIB" };
  const clock = (withDate) => `<span class="clk" data-clock><span class="clk-ic">${ic("sun", "day")}${ic("moon", "night")}</span>${CK.place ? `<b>${esc(CK.place)}</b>` : ""}${withDate ? '<span class="clk-d" data-clock-date></span>' : ""}<span class="clk-t"><time>--.--</time> ${esc(CK.label || "WIB")}</span></span>`;

  const META = {
    personal: ["user", "Cerita, prinsip, dan keahlian di balik karya."],
    social: ["globe", "Akun media sosial tempat saya aktif."],
    project: ["folder", "Karya dan eksperimen yang ingin saya tunjukkan."],
    collab: ["users", "Orang-orang yang berkarya bersama, dan cara bergabung."],
    donation: ["heart", "Dukung lewat QRIS dengan beberapa ketukan."],
    support: ["support", "Kontak, bantuan, dan pertanyaan umum."],
  };

  const ctaBand = () => `<section class="wrap sec"><div class="cta" data-reveal="zoom">
      <h2>${esc(C.cta.title)}</h2><p>${esc(C.cta.text)}</p>
      <div class="actions"><a class="btn light" href="#/support" data-magnetic>Hubungi saya ${ic("arrow")}</a><a class="btn" href="#/collab" data-magnetic>Lihat kolaborasi</a></div>
    </div></section>`;

  const home = () => {
    const all = S.skills.flatMap((g) => g.items), roles = S.roles && S.roles.length ? S.roles : [S.role];
    const half = (arr, rev) => `<div class="track${rev ? " rev" : ""}">${[0, 1].map(() => `<div class="grp">${arr.map((x) => `<span class="pill">${esc(x)}</span>`).join("")}</div>`).join("")}</div>`;
    const stats = [[all.length, "Keahlian"], [S.projects.length, "Proyek"], [C.people.length, "Kolaborator"], [S.social.length, "Platform sosial"]];

    return `
    <section class="wrap hero">
      <div class="hero-copy">
        <div class="meta" data-reveal>${S.status ? `<p class="status"><i></i>${esc(S.status)}</p>` : ""}${clock()}</div>
        <p class="who" data-reveal><b class="grad-text">${esc(S.name)}</b><span class="role" aria-label="${esc(S.role)}"><span data-typer="${esc(JSON.stringify(roles))}" aria-hidden="true"></span><u class="caret" aria-hidden="true"></u></span></p>
        <h1 data-split>${esc(S.headline)}</h1>
        <p class="lead" data-reveal style="--d:500ms">${esc(S.intro)}</p>
        <div class="actions" data-reveal style="--d:650ms">
          <a class="btn primary" href="#/project" data-magnetic>Lihat proyek ${ic("arrow")}</a>
          <a class="btn" href="#/collab" data-magnetic>Ajak kolaborasi</a>
        </div>
      </div>
      <div class="hero-art" data-reveal="zoom" style="--d:300ms"><div class="orbit" aria-hidden="true">
        <span class="ring r1"><i></i><i></i></span><span class="ring r2"><i></i></span><span class="ring r3"><i></i><i></i><i></i></span>
        <div class="core">${esc(initials)}</div>
        ${all.slice(0, 3).map((s, i) => `<em class="float f${i + 1}">${esc(s)}</em>`).join("")}
      </div></div>
    </section>
    ${all.length ? `<section class="marquee" aria-hidden="true" data-reveal>${half(all, false)}${S.interests.length ? half(S.interests, true) : ""}</section>` : ""}
    <section class="wrap sec"><div class="stats" data-stagger>${stats.map(([n, l]) => `<div class="stat" data-tilt><b data-count="${n}">0</b><span>${l}</span></div>`).join("")}</div></section>
    <section class="wrap sec"><h2 data-reveal>Jelajahi</h2><div class="tiles" data-stagger>${Object.entries(META).map(([id, [icon, d]]) => `<a class="tile" data-tilt href="#/${id}"><span class="ico">${ic(icon)}</span><h3>${PAGES.find((p) => p[0] === id)[1]}</h3><p>${d}</p><span class="go">${ic("arrow")}</span></a>`).join("")}</div></section>
    ${ctaBand()}`;
  };

  const personal = () => {
    const facts = [["Nama", S.name], ["Peran", S.role], ["Lokasi", S.location]].filter((f) => f[1]);

    return `${head("Personal", S.role)}
    <div class="wrap split">
      <dl class="facts glass" data-reveal="left">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="stack">
        <section data-reveal><h2>Tentang saya</h2>${S.bio.map((p) => `<p>${esc(p)}</p>`).join("")}</section>
        <section><h2 data-reveal>Prinsip</h2><ul class="principles" data-stagger>${S.principles.map((p) => `<li><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join("")}</ul></section>
        <section><h2 data-reveal>Keahlian</h2>${S.skills.map((g) => `<div data-reveal><h3>${esc(g.group)}</h3>${chips(g.items)}</div>`).join("")}</section>
        <section data-reveal><h2>Minat</h2>${chips(S.interests)}</section>
      </div>
    </div>`;
  };

  const social = () => `${head("Social", S.socialIntro)}<div class="wrap">${
    S.social.length
      ? `<ul class="rows" data-stagger>${S.social.map((s) => row(s.icon, s.name, s.username, s.url, true)).join("")}</ul>`
      : empty("Belum ada akun", "Tambahkan akun pada bagian <code>social</code> di <code>data.js</code>.")
  }</div>`;

  const project = () => `${head("Project", META.project[1])}<div class="wrap">${
    S.projects.length
      ? `<div class="grid" data-stagger>${S.projects.map((p) => `<article class="proj" data-tilt><small>${esc(p.year)}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${chips(p.tags || [])}${(p.links || []).map((l) => (safeUrl(l.url) ? `<a class="link" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ${ic("arrow")}</a> ` : "")).join("")}</article>`).join("")}</div>`
      : empty("Belum ada proyek", "Proyek akan tampil di sini setelah ditambahkan pada bagian <code>projects</code> di <code>data.js</code>.")
  }</div>`;

  const netSvg = () => {
    const nodes = [[70, 70], [330, 60], [60, 235], [345, 250], [200, 28], [205, 295]];

    return `<svg class="net" viewBox="0 0 400 320" aria-hidden="true"><defs><linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent-2)"/><stop offset="1" style="stop-color:var(--accent)"/></linearGradient></defs>
      ${nodes.map(([x, y]) => `<line x1="200" y1="160" x2="${x}" y2="${y}"/>`).join("")}
      ${nodes.map(([x, y], i) => `<circle class="node" cx="${x}" cy="${y}" r="11" style="--d:${(i * .45).toFixed(2)}s"/>`).join("")}
      <circle class="hub" cx="200" cy="160" r="26"/></svg>`;
  };

  const collab = () => {
    const mail = S.contact.email && safeUrl(`mailto:${S.contact.email}`);
    const wa = S.contact.whatsapp && `https://wa.me/${S.contact.whatsapp}`;

    return `<div class="wrap page-head"><div class="collab-hero"><div>
        ${S.status ? `<p class="status" data-reveal><i></i>${esc(S.status)}</p>` : ""}
        <h1 data-split>Collaborator</h1><p class="lead" data-reveal style="--d:300ms">${esc(C.intro)}</p>
        <div class="actions" data-reveal style="--d:450ms"><a class="btn primary" href="#/support" data-magnetic>Ajak kolaborasi ${ic("arrow")}</a></div>
      </div><div data-reveal="zoom" style="--d:250ms">${netSvg()}</div></div></div>

    <section class="wrap sec"><h2 data-reveal>Kolaborator</h2>${
      C.people.length
        ? `<div class="grid" data-stagger>${C.people.map((p) => {
            const u = safeUrl(p.url), av = safeUrl(p.avatar);
            const ini = p.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

            return `<article class="person" data-tilt><div class="avatar"><span class="fill"></span><b>${esc(ini)}</b>${av ? `<img src="${esc(av)}" alt="Foto ${esc(p.name)}" loading="lazy" decoding="async">` : ""}</div>
              <h3>${esc(p.name)}</h3><small>${esc(p.role)}</small><p>${esc(p.note)}</p>${chips(p.tags)}
              ${u ? `<a class="link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">Kunjungi profil ${ic("arrow")}</a>` : `<span class="note">Tautan belum diatur</span>`}</article>`;
          }).join("")}</div>`
        : empty("Belum ada kolaborator", "Tambahkan orang pada <code>collab.people</code> di <code>data.js</code>.")
    }</section>

    <section class="wrap sec"><h2 data-reveal>Bentuk kolaborasi</h2><div class="tiles" data-stagger>${C.types.map((t) => `<div class="type" data-tilt><span class="ico">${ic(t.icon)}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>`).join("")}</div></section>

    <section class="wrap sec"><h2 data-reveal>Alur kerja sama</h2><ol class="timeline" data-draw>${C.steps.map((s, i) => `<li data-reveal style="--d:${i * 120}ms"><span class="step-n">${i + 1}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`).join("")}</ol></section>

    <section class="wrap sec"><div class="cta" data-reveal="zoom"><h2>${esc(C.cta.title)}</h2><p>${esc(C.cta.text)}</p>
      <div class="actions">${mail ? `<a class="btn light" href="${esc(mail)}" data-magnetic>${ic("mail")} Kirim email</a>` : ""}${wa ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener noreferrer" data-magnetic>${ic("whatsapp")} WhatsApp</a>` : ""}<a class="btn" href="#/support" data-magnetic>Semua kontak</a></div></div></section>`;
  };

  const donation = () => `${head("Donation", D.description)}
    <div class="wrap donate">
      <figure class="qr" data-qr data-reveal="zoom" style="--d:250ms">
        <div class="qr-box"><img src="${esc(safeUrl(D.qris))}" alt="Kode QRIS ${esc(D.name)}" decoding="async"></div>
        <p class="qr-err" hidden>Gambar QRIS gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.</p>
      </figure>
      <div data-reveal="right" style="--d:350ms">
        <h2>Penerima: ${esc(D.name)}</h2>
        <ol>${D.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <div class="actions" style="margin-top:0">
          <a class="btn primary" href="${esc(safeUrl(D.qris))}" target="_blank" rel="noopener noreferrer" data-magnetic>Buka QRIS ukuran penuh</a>
          <button class="btn" type="button" data-copy="${esc(safeUrl(D.qris))}" data-magnetic>${ic("copy")} Salin tautan</button>
        </div>
        <p class="note">${esc(D.note)}</p>
      </div>
    </div>`;

  const fmtPhone = (n) => {
    const d = String(n || "").replace(/\D/g, "");
    if (d.startsWith("62") && d.length >= 10) { const r = d.slice(2); return `+62 ${r.slice(0, 3)}-${r.slice(3, 7)}-${r.slice(7)}`; }
    return d ? `+${d}` : "";
  };

  const support = () => {
    const c = S.contact;
    const mail = c.email && safeUrl(`mailto:${c.email}`);
    const wa = c.whatsapp && `https://wa.me/${c.whatsapp}`;
    const H = SUP.help || { title: "Belum menemukan jawabannya?", text: "Kirim pertanyaanmu langsung lewat WhatsApp atau email." };

    const main = (icon, title, value, copyValue, copyMsg, href, label, external) => `<li><article class="sup-card main" data-tilt>
        <span class="sup-ico">${ic(icon)}</span>
        <div class="sup-txt"><h3>${esc(title)}</h3><p class="sup-val">${esc(value)}</p></div>
        <div class="sup-act">
          <button class="icon-btn sup-copy" type="button" data-copy="${esc(copyValue)}" data-copy-msg="${esc(copyMsg)}" aria-label="Salin ${esc(title.toLowerCase())}">${ic("copy", "i-copy")}${ic("check", "i-done")}</button>
          <a class="btn primary" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)} ${ic("arrow")}</a>
        </div>
      </article></li>`;

    const link = (icon, title, text, href) => `<li><a class="sup-card sup-link" data-tilt href="${href}">
        <span class="sup-ico">${ic(icon)}</span>
        <div class="sup-txt"><h3>${esc(title)}</h3><p class="sup-val">${esc(text)}</p></div>
        <span class="sup-go"><b>Buka</b>${ic("arrow")}</span>
      </a></li>`;

    const methods = [
      mail && main("mail", "Email", c.email, c.email, "Email disalin", mail, "Kirim email"),
      wa && main("whatsapp", "WhatsApp", fmtPhone(c.whatsapp), `+${String(c.whatsapp).replace(/\D/g, "")}`, "Nomor WhatsApp disalin", wa, "Chat sekarang", true),
      link("globe", "Media sosial", "Lihat semua akun", "#/social"),
      link("users", "Kolaborasi", "Bentuk kerja sama dan alurnya", "#/collab"),
    ].filter(Boolean);

    const faq = SUP.faq.map((f, i) => `<div class="faq-item">
        <h3 class="faq-h"><button class="faq-q" id="faq${i}-q" type="button" aria-expanded="false" aria-controls="faq${i}"><span>${esc(f.q)}</span><span class="faq-ico">${ic("plus")}</span></button></h3>
        <div class="faq-body" id="faq${i}" role="region" aria-labelledby="faq${i}-q"><div><p>${esc(f.a)}</p></div></div>
      </div>`).join("");

    const help = mail || wa ? `<div class="sup-help" data-reveal>
        <div><h3>${esc(H.title)}</h3><p>${esc(H.text)}</p></div>
        <div class="actions">${wa ? `<a class="btn primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${ic("whatsapp")} WhatsApp</a>` : ""}${mail ? `<a class="btn" href="${esc(mail)}">${ic("mail")} Email</a>` : ""}</div>
      </div>` : "";

    return `${head("Support", SUP.intro)}
    <div class="wrap sup">
      <section class="sup-sec" aria-labelledby="sup-contact">
        <h2 id="sup-contact" data-reveal>Hubungi saya</h2>
        <ul class="sup-list" data-stagger>${methods.join("")}</ul>
        <div class="sup-meta" data-reveal>${SUP.responseNote ? `<p class="sup-note">${ic("clock")}${esc(SUP.responseNote)}</p>` : ""}${clock(true)}</div>
      </section>
      <section class="sup-sec" aria-labelledby="sup-faq">
        <h2 id="sup-faq" data-reveal>Pertanyaan umum</h2>
        <div class="faq" data-stagger>${faq}</div>
        ${help}
      </section>
    </div>`;
  };

  const PAGES = [
    ["home", "Home", "Beranda", home],
    ["personal", "Personal", "Personal", personal],
    ["social", "Social", "Social", social],
    ["project", "Project", "Project", project],
    ["collab", "Collaborator", "Collaborator", collab],
    ["donation", "Donation", "Donation", donation],
    ["support", "Support", "Support", support]
  ];

  const notFound = () => `<div class="wrap page-head"><h1 data-split>Halaman tidak ditemukan</h1><p class="lead">Alamat yang kamu buka tidak ada.</p><div class="actions"><a class="btn primary" href="#/home">Kembali ke Home</a></div></div>`;

  return { PAGES, notFound, initials, clock };
})();
