/* Pemutar musik mengambang. Tampil hanya bila SITE.music.tracks berisi lagu (lihat data.js). */
(() => {
  const T = ((SITE.music && SITE.music.tracks) || []).filter((t) => t && typeof t.src === "string" && t.src && !/^javascript:/i.test(t.src));
  if (!T.length) return;
  const { ic, $ } = UI, au = new Audio(); au.preload = "none"; au.loop = T.length === 1;
  const el = document.createElement("div"); el.className = "mp"; el.setAttribute("role", "group"); el.setAttribute("aria-label", "Pemutar musik");
  el.innerHTML = `<button class="mp-play" type="button" aria-label="Putar atau jeda">${ic("play", "p")}${ic("pause", "s")}</button><div class="mp-info"><b></b><small></small></div>${T.length > 1 ? `<button class="mp-next" type="button" aria-label="Lagu berikutnya">${ic("next")}</button>` : ""}<div class="mp-bar" aria-hidden="true"><i></i></div>`;
  document.body.appendChild(el); document.body.classList.add("has-mp");
  let i = 0;
  const fail = () => FX.toast("Lagu gagal diputar");
  const set = (n, play) => {
    i = (n + T.length) % T.length; const t = T[i]; au.src = t.src;
    $(".mp-info b", el).textContent = t.title || "Tanpa judul"; $(".mp-info small", el).textContent = t.artist || "";
    if ("mediaSession" in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title || "", artist: t.artist || "" });
    if (play) au.play().catch(fail);
  };
  set(0, false);
  $(".mp-play", el).onclick = () => (au.paused ? au.play().catch(fail) : au.pause());
  const nx = $(".mp-next", el); if (nx) nx.onclick = () => set(i + 1, true);
  const bar = $(".mp-bar", el);
  bar.onclick = (e) => { if (!au.duration) return; const r = bar.getBoundingClientRect(); au.currentTime = ((e.clientX - r.left) / r.width) * au.duration; };
  au.addEventListener("play", () => el.classList.add("on")); au.addEventListener("pause", () => el.classList.remove("on"));
  au.addEventListener("ended", () => T.length > 1 && set(i + 1, true));
  au.addEventListener("timeupdate", () => bar.style.setProperty("--v", (au.duration ? (au.currentTime / au.duration) * 100 : 0) + "%"));
  au.addEventListener("error", () => FX.toast("Lagu gagal dimuat"));
})();
