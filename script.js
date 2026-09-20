const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileInput = document.getElementById("fileInput");
const chooseImageBtn = document.getElementById("chooseImageBtn");
const dropZone = document.getElementById("dropZone");
const previewSection = document.getElementById("previewSection");
const successSection = document.getElementById("successSection");
const htmlSection = document.getElementById("htmlSection");
const markdownSection = document.getElementById("markdownSection");
const errorBox = document.getElementById("errorBox");
const removeBtn = document.getElementById("removeBtn");
const uploadBtn = document.getElementById("uploadBtn");
const previewImage = document.getElementById("previewImage");
const resultPreview = document.getElementById("resultPreview");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const imageUrlInput = document.getElementById("imageUrlInput");
const openImageLink = document.getElementById("openImageLink");
const htmlCode = document.getElementById("htmlCode");
const markdownCode = document.getElementById("markdownCode");
const themeToggle = document.getElementById("themeToggle");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyHtmlBtn = document.getElementById("copyHtmlBtn");
const copyMarkdownBtn = document.getElementById("copyMarkdownBtn");

const state = { selectedFile: null, selectedUrl: "", uploadedUrl: "", uploadInProgress: false };

function setTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("imagelink-theme", theme);
  themeToggle.textContent = dark ? "🌙" : "☀️";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
function initTheme() {
  const savedTheme = localStorage.getItem("imagelink-theme");
  if (savedTheme) return setTheme(savedTheme);
  setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
themeToggle.addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));

function showError(message) { errorBox.textContent = message; errorBox.className = "message error"; }
function clearError() { errorBox.textContent = ""; errorBox.className = "message error hidden"; }
function formatBytes(bytes) { if (!bytes) return "0 Bytes"; const sizes = ["Bytes", "KB", "MB", "GB"]; const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1); const value = bytes / 1024 ** i; return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`; }
function validateFile(file) {
  if (!file) throw new Error("No file selected.");
  const extension = (file.name || "").split(".").pop()?.toLowerCase();
  if ((!file.type || !ALLOWED_TYPES.includes(file.type)) && !["jpg", "jpeg", "png", "webp"].includes(extension)) throw new Error("Unsupported image format.");
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large. Please choose an image under 10 MB.");
}
function renderPreview(file) {
  const reader = new FileReader();
  reader.onload = (event) => { previewImage.src = event.target.result; resultPreview.src = event.target.result; state.selectedUrl = event.target.result; };
  reader.readAsDataURL(file);
  fileName.textContent = file.name;
  fileMeta.textContent = `${formatBytes(file.size)} • ${(file.type || "image/jpeg").split("/").pop().toUpperCase()}`;
  previewSection.classList.remove("hidden"); clearError();
}
function resetSelectedFile() {
  state.selectedFile = null; state.selectedUrl = ""; fileInput.value = "";
  previewSection.classList.add("hidden"); successSection.classList.add("hidden"); htmlSection.classList.add("hidden"); markdownSection.classList.add("hidden");
  imageUrlInput.value = ""; resultPreview.src = ""; previewImage.src = ""; openImageLink.href = "#"; clearError();
}
function selectFile(file) { try { validateFile(file); state.selectedFile = file; renderPreview(file); } catch (error) { showError(error.message); } }
chooseImageBtn.addEventListener("click", (event) => { event.stopPropagation(); fileInput.click(); });
fileInput.addEventListener("change", (event) => selectFile(event.target.files?.[0]));
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (event) => { event.preventDefault(); dropZone.classList.remove("dragover"); selectFile(event.dataTransfer.files?.[0]); });
dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); } });
removeBtn.addEventListener("click", resetSelectedFile);

function removeProgress() { document.querySelector(".upload-progress")?.remove(); document.querySelector(".progress-text")?.remove(); }
function showUploadProgress(percent, text) {
  removeProgress(); const wrap = document.createElement("div"); wrap.className = "upload-progress"; const bar = document.createElement("div"); bar.className = "upload-progress-bar"; bar.style.width = `${percent}%`; wrap.appendChild(bar); const label = document.createElement("p"); label.className = "progress-text"; label.textContent = text; previewSection.append(wrap, label);
}
uploadBtn.addEventListener("click", () => {
  if (!state.selectedFile || state.uploadInProgress) return;
  const formData = new FormData(); formData.append("image", state.selectedFile); state.uploadInProgress = true; uploadBtn.disabled = true; uploadBtn.innerHTML = "Uploading..."; clearError(); showUploadProgress(0, "Uploading...");
  const xhr = new XMLHttpRequest(); xhr.open("POST", "/api/upload", true);
  xhr.upload.addEventListener("progress", (event) => { if (event.lengthComputable) { const percent = Math.round((event.loaded / event.total) * 100); showUploadProgress(percent, `Uploading... ${percent}%`); } });
  xhr.onload = () => {
    state.uploadInProgress = false; uploadBtn.disabled = false; uploadBtn.innerHTML = 'Upload Image <span class="button-arrow" aria-hidden="true">↗</span>';
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText); const uploadedUrl = response?.data?.url || response?.url; if (!uploadedUrl) throw new Error();
        state.uploadedUrl = uploadedUrl; imageUrlInput.value = uploadedUrl; openImageLink.href = uploadedUrl; resultPreview.src = uploadedUrl; htmlCode.value = `<img src="${uploadedUrl}" alt="Uploaded image">`; markdownCode.value = `![Uploaded image](${uploadedUrl})`;
        successSection.classList.remove("hidden"); htmlSection.classList.remove("hidden"); markdownSection.classList.remove("hidden"); document.querySelector(".message.success")?.remove(); const success = document.createElement("div"); success.className = "message success"; success.textContent = "Upload successful! Your link is ready to share."; previewSection.prepend(success); showUploadProgress(100, "Upload successful!");
      } catch { showError("Upload succeeded but the image URL is unavailable."); }
    } else { try { showError(JSON.parse(xhr.responseText)?.message || "Upload failed. Please try again."); } catch { showError("Upload failed. Please try again."); } }
  };
  xhr.onerror = () => { state.uploadInProgress = false; uploadBtn.disabled = false; uploadBtn.innerHTML = 'Upload Image <span class="button-arrow" aria-hidden="true">↗</span>'; showError("Network error. Please check your connection and try again."); };
  xhr.onabort = () => { state.uploadInProgress = false; uploadBtn.disabled = false; uploadBtn.innerHTML = 'Upload Image <span class="button-arrow" aria-hidden="true">↗</span>'; showError("Upload was interrupted."); };
  xhr.send(formData);
});

async function copyText(value, button, defaultText) {
  if (!value) return;
  try { await navigator.clipboard.writeText(value); } catch { const textarea = document.createElement("textarea"); textarea.value = value; textarea.setAttribute("readonly", ""); textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove(); }
  const original = button.innerHTML; button.textContent = "Copied!"; setTimeout(() => { button.innerHTML = original || defaultText; }, 1800);
}
copyLinkBtn.addEventListener("click", () => copyText(imageUrlInput.value, copyLinkBtn, "Copy Link"));
copyHtmlBtn.addEventListener("click", () => copyText(htmlCode.value, copyHtmlBtn, "Copy HTML"));
copyMarkdownBtn.addEventListener("click", () => copyText(markdownCode.value, copyMarkdownBtn, "Copy Markdown"));
initTheme();
