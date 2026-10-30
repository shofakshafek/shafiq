/* Jembatan game -> arcade (postMessage). Game berjalan di iframe sandbox tanpa akses ke halaman utama. */
window.B = {
  hs: 0, onCmd() {},
  send(t, d) { parent.postMessage({ type: "shfq:" + t, ...d }, "*"); },
  ready() { this.send("ready"); },
  score(s) { this.send("score", { score: Math.max(0, Math.floor(+s) || 0) }); },
};
addEventListener("message", (e) => {
  if (e.source !== parent) return;
  const m = e.data || {};
  if (m.type === "shfq:init") B.hs = Math.max(0, +m.hs || 0);
  if (m.type === "shfq:cmd") B.onCmd(String(m.cmd));
});
