const savedKey = 'streampair-saved-streams';
const slotKey = 'streampair-slot-streams';
const slots = 2;

function normalizeInput(value) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Enter a stream URL or channel name.');
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  return url;
}

function parseStream(value) {
  const url = normalizeInput(value);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    if (!parts[0]) throw new Error('That YouTube link is missing a video ID.');
    return { platform: 'YouTube', url: `https://www.youtube.com/embed/${encodeURIComponent(parts[0])}`, label: `YouTube · ${parts[0]}` };
  }
  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    const video = url.searchParams.get('v') || (parts[0] === 'embed' ? parts[1] : '');
    if (!video) throw new Error('Paste a YouTube video or live-stream URL.');
    return { platform: 'YouTube', url: `https://www.youtube.com/embed/${encodeURIComponent(video)}`, label: `YouTube · ${video}` };
  }
  if (host === 'twitch.tv' || host.endsWith('.twitch.tv')) {
    const name = parts[0] === 'videos' ? '' : parts[0];
    const video = parts[0] === 'videos' ? parts[1] : '';
    if (!name && !video) throw new Error('Paste a Twitch channel or video URL.');
    const parent = window.location.hostname || 'localhost';
    const query = video ? `video=${encodeURIComponent(video)}` : `channel=${encodeURIComponent(name)}`;
    return { platform: 'Twitch', url: `https://player.twitch.tv/?${query}&parent=${encodeURIComponent(parent)}&autoplay=false`, label: `Twitch · ${video || name}` };
  }
  if (host === 'kick.com' || host.endsWith('.kick.com')) {
    const channel = parts[0];
    if (!channel) throw new Error('Paste a Kick channel URL.');
    return { platform: 'Kick', url: `https://player.kick.com/${encodeURIComponent(channel)}`, label: `Kick · ${channel}` };
  }
  throw new Error('Use a public YouTube, Twitch, or Kick stream URL.');
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem(savedKey)) || []; } catch { return []; }
}

function saveStream(stream) {
  const streams = getSaved().filter(item => item.url !== stream.url);
  streams.unshift(stream);
  localStorage.setItem(savedKey, JSON.stringify(streams.slice(0, 12)));
  renderSaved();
}

function renderSlot(slot, stream, originalValue = '') {
  const player = document.getElementById(`player-${slot}`);
  const platform = document.getElementById(`platform-${slot}`);
  const input = document.getElementById(`stream-input-${slot}`);
  input.value = originalValue;
  if (!stream) {
    platform.textContent = 'Not loaded';
    player.innerHTML = `<div class="empty-player"><span>0${slot + 1}</span><p>Add a YouTube, Twitch, or Kick stream below.</p></div>`;
    return;
  }
  platform.textContent = stream.platform;
  const iframe = document.createElement('iframe');
  iframe.src = stream.url;
  iframe.title = `${stream.platform} stream`;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  player.replaceChildren(iframe);
}

function loadStream(slot, value, persist = true) {
  const message = document.getElementById(`message-${slot}`);
  try {
    const stream = parseStream(value);
    renderSlot(slot, stream, value);
    message.classList.remove('error');
    message.textContent = `Loaded ${stream.label}.`;
    if (persist) {
      saveStream(stream);
      const active = JSON.parse(localStorage.getItem(slotKey) || '[]');
      active[slot] = value;
      localStorage.setItem(slotKey, JSON.stringify(active));
    }
  } catch (error) {
    message.classList.add('error');
    message.textContent = error.message;
  }
}

function renderSaved() {
  const list = document.getElementById('saved-list');
  const streams = getSaved();
  list.replaceChildren();
  if (!streams.length) {
    list.innerHTML = '<p class="empty-saved">Streams you load are saved here on this device.</p>';
    return;
  }
  streams.forEach(stream => {
    const item = document.createElement('div');
    item.className = 'saved-item';
    const load = document.createElement('button');
    load.type = 'button';
    load.textContent = stream.label;
    load.title = `Load ${stream.label}`;
    load.addEventListener('click', () => loadStream(0, stream.url));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-saved';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${stream.label}`);
    remove.addEventListener('click', () => {
      localStorage.setItem(savedKey, JSON.stringify(getSaved().filter(item => item.url !== stream.url)));
      renderSaved();
    });
    item.append(load, remove);
    list.append(item);
  });
}

document.querySelectorAll('.stream-form').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const slot = Number(form.dataset.slot);
    loadStream(slot, document.getElementById(`stream-input-${slot}`).value);
  });
});

document.getElementById('clear-saved').addEventListener('click', () => {
  localStorage.removeItem(savedKey);
  renderSaved();
});

renderSaved();
try {
  (JSON.parse(localStorage.getItem(slotKey) || '[]')).forEach((value, slot) => {
    if (value && slot < slots) loadStream(slot, value, false);
  });
} catch { /* Invalid stored data can be safely ignored. */ }
