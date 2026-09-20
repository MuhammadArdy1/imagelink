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

const configuredOrigins = (process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: configuredOrigins.length ? configuredOrigins : true }));
app.use(express.static(rootDir));
app.use("/uploads", express.static(uploadsDir));
app.get("/health", (_req, res) => res.json({ status: "ok", message: "ImageLink API is running." }));

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
    if (!allowedMimeTypes.has(file.mimetype) || !extensionAllowed) {
      const error = new Error("This image format is not supported.");
      error.code = "UNSUPPORTED_FORMAT";
      return callback(error);
    }
    callback(null, true);
  },
});

app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ code: error.code, message: "This image is too large. Please choose an image under 10 MB." });
      if (error.code === "UNSUPPORTED_FORMAT") return res.status(415).json({ code: error.code, message: "This image format is not supported." });
      console.error("Upload parsing error:", error);
      return res.status(400).json({ code: "UPLOAD_ERROR", message: "Something went wrong while uploading. Please try again." });
    }
    if (!req.file) return res.status(400).json({ code: "NO_FILE", message: "Please choose an image first." });
    const baseUrl = PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const relativePath = `/uploads/${req.file.filename}`;
    return res.status(200).json({ message: "Image uploaded successfully!", data: { filename: req.file.filename, path: relativePath, url: `${baseUrl}${relativePath}` } });
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({ code: "SERVER_ERROR", message: "The upload server is temporarily unavailable. Please try again." });
});
app.listen(PORT, () => console.log(`ImageLink running on port ${PORT}`));
