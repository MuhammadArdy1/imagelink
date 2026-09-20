# ImageLink

ImageLink adalah web tool yang memungkinkan pengguna mengunggah gambar, melihat preview, mendapatkan URL berbagi, lalu menyalin HTML/Markdown dengan satu klik.

## Fitur utama
- Upload gambar dari perangkat
- Preview gambar sebelum upload
- Validasi format: JPG, JPEG, PNG, WEBP
- Validasi ukuran: maksimal 10 MB
- Hasil URL publik untuk gambar yang diupload
- Copy Link
- Copy HTML
- Copy Markdown
- Open Image
- UI mobile-first dan responsive
- Dark mode dengan localStorage
- Error handling aman di UI
- Loading progress saat upload

## Struktur project

```text
imagelink/
├── .gitignore
├── .env.example
├── package.json
├── index.html
├── style.css
├── script.js
├── README.md
├── uploads/
│   └── .gitkeep
└── api/
    └── upload.js
```

## Persyaratan
- Node.js 18+
- npm

## Cara menjalankan lokal
1. Buka terminal di folder project
2. Jalankan:

```bash
npm install
```

3. Copy file environment:

```bash
cp .env.example .env
```

4. Jalankan server:

```bash
npm start
```

5. Buka browser:

```text
http://localhost:3000
```

## Environment variable
File `.env` berisi:

```env
PORT=3000
UPLOAD_LIMIT_MB=10
PUBLIC_BASE_URL=http://localhost:3000
```

Penjelasan:
- `PORT` = port server lokal
- `UPLOAD_LIMIT_MB` = batas file upload
- `PUBLIC_BASE_URL` = URL publik yang digunakan untuk membangun URL file

## Cara menghubungkan storage / hosting
Versi awal ini menyimpan file ke folder lokal `uploads/` agar bisa langsung dipakai tanpa API key.

Untuk production, disarankan pakai salah satu layanan berikut:
- Cloudinary
- Supabase Storage
- AWS S3
- DigitalOcean Spaces
- Firebase Storage

Saat migrasi ke cloud storage, cukup ganti logika di `api/upload.js` agar file dikirim ke provider storage dan URL yang dihasilkan digunakan oleh frontend.

Jangan menaruh secret key di frontend. Semua kredensial harus berada di backend dalam environment variable.

## Cara deploy
Untuk deploy, pilih hosting yang support Node.js dan write permission pada folder `uploads/`.

Contoh flow:
```bash
npm install
npm start
```

Pastikan:
- `PUBLIC_BASE_URL` di-set ke domain publik aplikasi
- folder `uploads/` bisa ditulis oleh server
- port runtime sesuai hosting yang dipakai

## Cara mengganti nama/logo
- Ubah teks `ImageLink` di `index.html`
- Ubah warna atau ikon brand pada `.brand-mark`
- Sesuaikan `title` dan meta description

## Cara menambahkan fitur berikutnya
Beberapa fiturnya bisa ditambahkan nanti:
- multiple upload
- delete image
- kompres gambar
- QR code
- gallery
- user account
- thumbnail generation
- expiration link
- CDN integration

## Keamanan yang diterapkan
- validasi file di frontend
- validasi file di backend
- batas ukuran file
- tidak ada `eval()`
- tidak ada API key di frontend
- input dari user tidak diproses sebagai HTML secara langsung

## Catatan
Ini adalah versi yang benar-benar bisa dijalankan secara lokal. Untuk production, gunakan storage cloud agar lebih aman dan scalable.
