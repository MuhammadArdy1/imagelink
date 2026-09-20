const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE = Number(process.env.UPLOAD_LIMIT_MB || 10) * 1024 * 1024;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const rootDir = path.join(__dirname, "..");
const uploadsDir = path.join(rootDir, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const base = (path.basename(file.originalname, extension) || "image").toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "image";
    callback(null, `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    const extensionAllowed = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    if (!allowedMimeTypes.has(file.mimetype) || !extensionAllowed) return callback(new Error("Unsupported image format. Please choose a JPG, PNG, or WEBP image."));
    callback(null, true);
  },
});

app.use(cors());
app.use(express.static(rootDir));
app.use("/uploads", express.static(uploadsDir));
app.get("/health", (_req, res) => res.json({ status: "ok", message: "ImageLink API is running." }));
app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "This image is too large. Please choose a file under 10 MB." : error.message || "Upload failed. Please try again.";
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: "No image was received. Please choose an image and try again." });
    const relativePath = `/uploads/${req.file.filename}`;
    const url = `${PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`}${relativePath}`;
    return res.status(200).json({ message: "Image uploaded successfully!", data: { filename: req.file.filename, path: relativePath, url } });
  });
});
app.use((error, _req, res, _next) => res.status(500).json({ message: error?.message || "Something went wrong on the server. Please try again." }));
app.listen(PORT, () => console.log(`ImageLink running at http://localhost:${PORT}`));
