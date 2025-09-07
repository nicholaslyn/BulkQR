# Quick QR — Single & Bulk

Create QR codes right in your browser. Nothing uploads anywhere.

### Features
- **Single**: generate PNG/SVG with size, margin, and error-correction.
- **Bulk**: paste one per line, or `filename, text` per line → download a ZIP of PNGs (+ mapping.csv).
- Works offline after first load (from CDN); no backend.

### Use locally
Open `index.html` in your browser. For GitHub Pages, push this folder to a repo and enable Pages.

### Notes
- Bulk defaults to a max of 100 items per run to keep it snappy — adjust in the UI.
- Everything runs client-side using:
  - [`qrcode`](https://github.com/soldair/node-qrcode) for generation
  - `jszip` + `file-saver` for zipping & download

### License
MIT
