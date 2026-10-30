/* Memuat dan memvalidasi manifest game. Manifest rusak dilewati, game lain tetap tampil. */
window.GameLoader = (() => {
  const CATS = ["Arcade", "Puzzle", "Action", "Casual", "Strategy", "Simulation", "Experimental"];
  const bad = (p, why) => console.error(`[GameLoader] ${p}: ${why}`);
  const check = (m, p) => {
    if (!m || typeof m !== "object") return bad(p, "bukan objek");
    for (const k of ["id", "name", "description", "version", "developer", "category", "entry"]) if (typeof m[k] !== "string" || !m[k]) return bad(p, `field "${k}" wajib`);
    if (!/^[a-z0-9-]+$/.test(m.id)) return bad(p, "id hanya huruf kecil, angka, tanda minus");
    const base = p.replace(/[^/]*$/, ""), entry = base + m.entry;
    if (m.entry.includes("..") || /^[a-z]+:/i.test(m.entry)) return bad(p, "entry tidak valid");
    return { ...m, category: CATS.includes(m.category) ? m.category : "Experimental", entryUrl: entry, controls: Array.isArray(m.controls) ? m.controls.map(String) : [], icon: String(m.icon || "🎮") };
  };
  let cache = null;
  const load = () => cache || (cache = Promise.all((window.GAME_REGISTRY || []).map((p) =>
    fetch(p, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then((m) => check(m, p), (e) => bad(p, e.message))
  )).then((l) => { const seen = new Set(); return l.filter((g) => g && !seen.has(g.id) && seen.add(g.id)); }));
  return { load, CATS };
})();
