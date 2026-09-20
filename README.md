# ImageLink

ImageLink adalah web tool untuk mengunggah gambar, melihat preview, mendapatkan URL berbagi, lalu menyalin HTML/Markdown.

## Menjalankan lokal

```bash
npm install
cp .env.example .env
npm start
```

Buka `http://localhost:3000`. Endpoint upload yang dipakai frontend adalah `POST /api/upload` dengan field multipart `image`; cek `GET /health` untuk memastikan API aktif.

## Konfigurasi deployment

Server Node.js harus dijalankan sebagai backend (GitHub Pages hanya menyajikan file statis dan tidak dapat menjalankan `api/upload.js`). Set environment variable berikut pada hosting backend:

- `PORT`: port dari hosting.
- `UPLOAD_LIMIT_MB`: batas ukuran file (default 10 MB).
- `PUBLIC_BASE_URL`: URL publik backend, tanpa slash terakhir, agar link hasil upload tidak mengarah ke localhost.
- `CORS_ORIGIN`: origin frontend bila frontend dan backend berbeda domain; bisa berupa beberapa origin yang dipisahkan koma.

Jika frontend dan backend berbeda origin, definisikan `window.IMAGELINK_API_URL` sebelum `script.js` dimuat, misalnya:

```html
<script>window.IMAGELINK_API_URL = "https://api.example.com";</script>
<script src="script.js"></script>
```

Frontend tidak memerlukan API key. Jangan menaruh credential storage atau secret di browser; simpan hanya di environment backend.
