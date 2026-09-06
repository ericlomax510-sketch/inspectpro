# StreamPair

A simple two-stream viewer for public YouTube, Twitch, and Kick streams.

## Use

1. Serve the repository locally, for example: `python -m http.server 8000`.
2. Open `http://localhost:8000`.
3. Paste a public YouTube video/live URL, Twitch channel/video URL, or Kick channel URL into each stream field.

Loaded streams and recent entries are saved in your browser on the current device. Twitch embeds require the site hostname to be allowed through its `parent` parameter, which the app sets automatically.

## Build the Capacitor web bundle

```bash
npm run build:web
```

This generates the `www/` directory.
