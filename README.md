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

**Important:** if `IMAGELINK_API_URL` is not configured, the browser posts to the current page origin. A static GitHub Pages deployment therefore returns a 404/405 for `/api/upload`; it cannot run this Node backend. Configure the backend URL above and set `CORS_ORIGIN` to the exact frontend origin.

The frontend sends `multipart/form-data` using the `image` field. Do not manually set the `Content-Type` header, because the browser must add the multipart boundary. The backend stores the file locally and returns a public URL; no image-hosting API key is required. Never put storage credentials or secrets in the browser.
