// scripts/media-capacitor.js
// Capacitor-aware media helper: writes base64 media to the device filesystem on native builds,
// and provides a graceful fallback for the browser (returns null when not available).

(async function(){
  const hasCapacitor = typeof Capacitor !== 'undefined' && Capacitor.Plugins;
  async function saveBase64File(base64DataUrl, filename) {
    // Strip prefix if present
    const clean = base64DataUrl.indexOf(',')>-1 ? base64DataUrl.split(',')[1] : base64DataUrl;
    if(!hasCapacitor) throw new Error('Capacitor Filesystem not available');
    const { Filesystem, Directory } = Capacitor.Plugins;
    const path = `media/${filename}`;
    // Write the file
    await Filesystem.writeFile({ path, data: clean, directory: Directory.Data });
    // On native, convert to a URL for use in <video>/<img>
    // convertFileSrc is available on Capacitor global
    let fileUri = path;
    try { fileUri = Capacitor.convertFileSrc(path); } catch(e) { /* ignore */ }
    return fileUri;
  }

  // Expose a small API
  window.MediaCapacitor = {
    canWrite: hasCapacitor,
    saveBase64File: async (base64, filename) => {
      return await saveBase64File(base64, filename);
    }
  };
})();
