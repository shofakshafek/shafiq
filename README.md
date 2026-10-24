# Website Portofolio Personal (versi Pro Max)

Website statis tanpa dependensi dan tanpa proses build: HTML, CSS, dan JavaScript murni dengan routing berbasis hash (`#/home`, `#/collab`, dst.).

## Fitur
- 7 halaman: Home, Personal, Social, Project, **Collaborator**, Donation, Support
- Tema **gelap = biru gelap (navy)**, tema **terang = putih terang dengan gradasi merah**
- Animasi: loader, jaringan partikel interaktif, cahaya mengikuti kursor, teks diketik bergantian, kata muncul bergantian, marquee keahlian, hitung naik, reveal saat scroll, tilt 3D, tombol magnetik + ripple, transisi halaman, indikator menu meluncur, pergantian tema berbentuk lingkaran, QR dengan garis scan, FAQ akordeon halus, progres scroll, tombol kembali ke atas
- Menghormati `prefers-reduced-motion` (semua animasi dimatikan otomatis)
- Responsif sampai layar ponsel, fokus keyboard terlihat

## Struktur
- `index.html`        : kerangka halaman
- `data.js`           : **satu-satunya tempat semua konten** (nama, bio, sosial, proyek, kolaborator, donasi, FAQ)
- `css/theme.css`     : warna kedua tema (ubah warna cukup di sini)
- `css/base.css`      : reset, latar, loader
- `css/components.css`: seluruh komponen dan tata letak
- `css/animations.css`: semua keyframes
- `js/ui.js`          : helper (escape HTML, validasi URL, ikon)
- `js/effects.js`     : mesin efek dan animasi
- `js/pages.js`       : tampilan tiap halaman
- `js/app.js`         : router, navigasi, tema

## Menjalankan
Buka `index.html` langsung di browser, atau jalankan server lokal:

    python3 -m http.server 8080   # lalu buka http://localhost:8080

## Mengubah data
Edit `data.js`:
- `roles`: kalimat yang diketik bergantian di Home (kosongkan `[]` untuk memakai `role`).
- `collab.people`: daftar kolaborator (isi `avatar` dengan tautan gambar bila ada, `url` untuk profil). Entri bawaan hanya placeholder.
- `collab.types`, `collab.steps`, `collab.cta`: bentuk kolaborasi, alur kerja sama, dan ajakan.
- Tautan dengan `url` kosong tampil sebagai "Belum diatur".
- `settings.theme`: `"auto"`, `"light"`, atau `"dark"`.

## Deploy
Unggah seluruh folder ke hosting statis apa pun (Vercel, Netlify, GitHub Pages). Tidak ada perintah build.
