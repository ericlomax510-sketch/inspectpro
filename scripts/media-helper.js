// scripts/media-helper.js
// Lightweight media helper used by the web app to prevent storing very large media blobs in localStorage.
// For full native support (Capacitor Filesystem), integrate @capacitor/filesystem and replace these stubs.

const MEDIA_MAX_BYTES = 200 * 1024; // 200 KB limit for in-browser storage

function dataUrlByteSize(dataUrl) {
  if (!dataUrl) return 0;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return 0;
  const base64 = parts[1];
  return Math.ceil(base64.length * 3 / 4);
}

async function ensureMediaAllowed(dataUrl, hint) {
  const size = dataUrlByteSize(dataUrl);
  if (size > MEDIA_MAX_BYTES) {
    throw new Error(`${hint || 'File'} is too large for local storage (${Math.round(size/1024)} KB). Use the native app or compress the file.`);
  }
  return true;
}

// Export for use in app.js (window scope)
window.MediaHelper = {
  MEDIA_MAX_BYTES,
  dataUrlByteSize,
  ensureMediaAllowed
};
