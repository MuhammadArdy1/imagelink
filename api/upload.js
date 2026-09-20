require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE = Number(process.env.UPLOAD_LIMIT_MB || 10) * 1024 * 1024;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const rootDir = path.join(__dirname, "..");
const uploadsDir = path.join(rootDir, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = (path.basename(file.originalname, ext) || "image")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-");

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = allowedMimeTypes.has(file.mimetype);
    const isExtensionAllowed = allowedExtensions.has(ext);

    if (!isMimeAllowed && !isExtensionAllowed) {
      return cb(new Error("Unsupported image format."));
    }

    cb(null, true);
  },
});

app.use(cors());
app.use(express.static(rootDir));
app.use("/uploads", express.static(uploadsDir));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "ImageLink API is running." });
});

app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      let message = "Upload failed.";
      if (error.code === "LIMIT_FILE_SIZE") {
        message = "File is too large. Please choose an image under 10 MB.";
      } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        message = "Unexpected file field.";
      } else if (error.message) {
        message = error.message;
      }

      return res.status(400).json({ message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = PUBLIC_BASE_URL
      ? `${PUBLIC_BASE_URL}${relativePath}`
      : `${req.protocol}://${req.get("host")}${relativePath}`;

    return res.status(200).json({
      message: "Upload successful!",
      data: {
        filename: req.file.filename,
        path: relativePath,
        url: fullUrl,
      },
    });
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    let message = "Upload failed.";
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Please choose an image under 10 MB.";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field.";
    }
    return res.status(400).json({ message });
  }

  return res.status(500).json({
    message: error?.message || "Something went wrong on the server.",
  });
});

app.listen(PORT, () => {
  console.log(`ImageLink running at http://localhost:${PORT}`);
});
