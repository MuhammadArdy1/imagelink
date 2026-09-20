const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const $ = (id) => document.getElementById(id);
const fileInput = $("fileInput");
const chooseImageBtn = $("chooseImageBtn");
const dropZone = $("dropZone");
const previewSection = $("previewSection");
const successSection = $("successSection");
const htmlSection = $("htmlSection");
const markdownSection = $("markdownSection");
const errorBox = $("errorBox");
const statusBox = $("statusBox");
const uploadProgress = $("uploadProgress");
const progressBar = $("progressBar");
const progressText = $("progressText");
const progressPercent = $("progressPercent");
const state = { selectedFile: null, previewUrl: "", uploadedUrl: "", uploading: false };

function setTheme(theme) { document.body.classList.toggle("dark", theme === "dark"); localStorage.setItem("imagelink-theme", theme); $("themeToggle").textContent = theme === "dark" ? "🌙" : "☀️"; }
const savedTheme = localStorage.getItem("imagelink-theme");
setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeToggle").addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));

function showError(message) { errorBox.textContent = message; errorBox.className = "message error"; statusBox.className = "message status hidden"; }
function clearMessages() { errorBox.className = "message error hidden"; statusBox.className = "message status hidden"; }
function showStatus(message) { statusBox.textContent = message; statusBox.className = "message status"; errorBox.className = "message error hidden"; }
function formatBytes(bytes) { if (!bytes) return "0 Bytes"; const units = ["Bytes", "KB", "MB", "GB"]; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`; }
function validateFile(file) {
  if (!file) throw new Error("Please choose an image first.");
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) throw new Error("Unsupported format. Please choose a JPG, PNG, or WEBP image.");
  if (file.size > MAX_FILE_SIZE) throw new Error("This image is too large. Please choose a file under 10 MB.");
  if (file.size === 0) throw new Error("This file is empty. Please choose another image.");
}
function setProgress(percent, text = "Uploading image...") { uploadProgress.classList.remove("hidden"); progressBar.style.width = `${percent}%`; progressPercent.textContent = `${percent}%`; progressText.textContent = text; }
function resetProgress() { uploadProgress.classList.add("hidden"); progressBar.style.width = "0%"; }
function renderPreview(file) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = URL.createObjectURL(file);
  $("previewImage").src = state.previewUrl;
  $("resultPreview").src = state.previewUrl;
  $("fileName").textContent = file.name;
  $("fileMeta").textContent = `${formatBytes(file.size)} • ${(file.type.split("/").pop() || file.name.split(".").pop()).toUpperCase()}`;
  previewSection.classList.remove("hidden"); successSection.classList.add("hidden"); htmlSection.classList.add("hidden"); markdownSection.classList.add("hidden"); resetProgress(); clearMessages();
  previewSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function selectFile(file) { try { validateFile(file); state.selectedFile = file; renderPreview(file); } catch (error) { showError(error.message); } }
function openPicker(event) { event?.stopPropagation(); if (!state.uploading) fileInput.click(); }
chooseImageBtn.addEventListener("click", openPicker);
fileInput.addEventListener("change", (event) => { selectFile(event.target.files?.[0]); event.target.value = ""; });
dropZone.addEventListener("click", (event) => { if (event.target !== chooseImageBtn) openPicker(event); });
dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPicker(event); } });
dropZone.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (event) => { event.preventDefault(); dropZone.classList.remove("dragover"); selectFile(event.dataTransfer.files?.[0]); });

function setUploading(uploading) { state.uploading = uploading; $("uploadBtn").disabled = uploading; $("removeBtn").disabled = uploading; chooseImageBtn.disabled = uploading; $("uploadBtn").innerHTML = uploading ? "Uploading image..." : 'Upload Image <span aria-hidden="true">↗</span>'; }
function resetSelectedFile() { if (state.previewUrl) URL.revokeObjectURL(state.previewUrl); state.selectedFile = null; state.previewUrl = ""; state.uploadedUrl = ""; previewSection.classList.add("hidden"); successSection.classList.add("hidden"); htmlSection.classList.add("hidden"); markdownSection.classList.add("hidden"); $("previewImage").removeAttribute("src"); $("resultPreview").removeAttribute("src"); resetProgress(); clearMessages(); }
$("removeBtn").addEventListener("click", resetSelectedFile);
$("tryAgainBtn").addEventListener("click", () => { resetSelectedFile(); window.scrollTo({ top: 0, behavior: "smooth" }); });

$("uploadBtn").addEventListener("click", () => {
  if (!state.selectedFile || state.uploading) return;
  const formData = new FormData(); formData.append("image", state.selectedFile); setUploading(true); clearMessages(); setProgress(0);
  const xhr = new XMLHttpRequest(); xhr.open("POST", "/api/upload"); xhr.timeout = 60000;
  xhr.upload.addEventListener("progress", (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); });
  const finish = () => setUploading(false);
  xhr.onload = () => {
    finish();
    let response = {}; try { response = JSON.parse(xhr.responseText || "{}"); } catch { response = {}; }
    if (xhr.status < 200 || xhr.status >= 300) { showError(response.message || "Upload failed. Please try again."); resetProgress(); return; }
    const uploadedUrl = response?.data?.url || response?.url;
    if (!uploadedUrl) { showError("Upload finished, but the image link was not returned. Please try again."); resetProgress(); return; }
    state.uploadedUrl = uploadedUrl; $("imageUrlInput").value = uploadedUrl; $("resultPreview").src = uploadedUrl; $("htmlCode").value = `<img src="${uploadedUrl}" alt="Uploaded image" />`; $("markdownCode").value = `![Uploaded image](${uploadedUrl})`; successSection.classList.remove("hidden"); htmlSection.classList.remove("hidden"); markdownSection.classList.remove("hidden"); resetProgress(); showStatus("Image uploaded successfully!"); successSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  xhr.onerror = () => { finish(); resetProgress(); showError("Upload failed. Please check your internet connection and try again."); };
  xhr.ontimeout = () => { finish(); resetProgress(); showError("The upload took too long. Please check your connection and try again."); };
  xhr.onabort = () => { finish(); resetProgress(); showError("Upload was cancelled. Please try again."); };
  xhr.send(formData);
});

async function copyText(value, button, label) { if (!value) return; try { await navigator.clipboard.writeText(value); } catch { const area = document.createElement("textarea"); area.value = value; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); } const original = button.textContent; button.textContent = "Copied!"; setTimeout(() => { button.textContent = original || label; }, 1800); }
$("copyLinkBtn").addEventListener("click", () => copyText($("imageUrlInput").value, $("copyLinkBtn"), "Copy Link"));
$("copyHtmlBtn").addEventListener("click", () => copyText($("htmlCode").value, $("copyHtmlBtn"), "Copy HTML"));
$("copyMarkdownBtn").addEventListener("click", () => copyText($("markdownCode").value, $("copyMarkdownBtn"), "Copy Markdown"));
