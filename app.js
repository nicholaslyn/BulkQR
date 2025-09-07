const $ = (s) => document.querySelector(s);
const yearEl = $("#year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

// Tabs (ignore if you removed tabs)
document.querySelectorAll(".tab")?.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("show"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("show");
  });
});

// ---------- Single ----------
const singleText = $("#singleText");
const size = $("#size");
const margin = $("#margin");
const ecl = $("#ecl");
const genSingle = $("#genSingle");
const dlPng = $("#downloadPng");
const dlSvg = $("#downloadSvg");
const preview = $("#preview");

let lastPngDataUrl = null;
let lastSvgString = null;

async function generateWithLib(text, opts) {
  // Uses qrcode lib if present
  const png = await QRCode.toDataURL(text, { ...opts });
  const svg = await QRCode.toString(text, { ...opts, type: "svg" });
  return { png, svg };
}

async function generateWithFallback(text, opts) {
  // Falls back to a public PNG endpoint (works if CDN is blocked)
  const sz = parseInt(opts.width || 320, 10);
  const m = parseInt(opts.margin || 2, 10);
  const ecc = (opts.errorCorrectionLevel || "M");
  // API docs: goqr.me / qrserver.com (simple, no auth)
  const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${sz}x${sz}&margin=${m}&ecc=${ecc}`;
  return { png: url, svg: null };
}

async function generateSingle() {
  const text = (singleText?.value || "").trim();
  if (!text) return alert("Enter text or a URL.");
  const opts = {
    errorCorrectionLevel: ecl?.value || "M",
    margin: parseInt(margin?.value || "2", 10),
    width: parseInt(size?.value || "320", 10)
  };
  try {
    let out;
    if (window.QRCode) out = await generateWithLib(text, opts);
    else out = await generateWithFallback(text, opts);

    lastPngDataUrl = out.png;
    lastSvgString = out.svg;

    preview.src = out.png;
    dlPng.disabled = false;
    dlSvg.disabled = !out.svg; // disable SVG if we used fallback
  } catch (e) {
    console.error(e);
    alert("Could not generate QR. See console for details.");
  }
}

genSingle?.addEventListener("click", generateSingle);

dlPng?.addEventListener("click", ()=>{
  if (!lastPngDataUrl) return;
  // If it's a data URL, download; if it's a remote URL, open in a new tab
  if (lastPngDataUrl.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = lastPngDataUrl; a.download = "qr.png"; a.click();
  } else {
    window.open(lastPngDataUrl, "_blank");
  }
});

dlSvg?.addEventListener("click", ()=>{
  if (!lastSvgString) return;
  const blob = new Blob([lastSvgString], { type: "image/svg+xml" });
  saveAs(blob, "qr.svg");
});

// ---------- Bulk (optional) ----------
const bulkInput = $("#bulkInput");
const bSize = $("#bSize");
const bMargin = $("#bMargin");
const bEcl = $("#bEcl");
const bMax = $("#bMax");
const genBulk = $("#genBulk");
const bulkLog = $("#bulkLog");

function parseLines(raw) {
  return raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line, i)=>{
    const comma = line.indexOf(",");
    if (comma > -1) {
      const name = line.slice(0, comma).trim();
      const text = line.slice(comma + 1).trim();
      return { name: sanitize(name) || `qr-${i+1}`, text };
    }
    return { name: `qr-${i+1}`, text: line };
  });
}
function sanitize(str){ return str.replace(/[^\w\-]+/g, "_").slice(0, 64); }

async function bulkWithLib(items, opts) {
  const zip = new JSZip();
  const mapping = [["filename","text"]];
  for (let i=0;i<items.length;i++){
    const { name, text } = items[i];
    try {
      const dataUrl = await QRCode.toDataURL(text, opts);
      const base64 = dataUrl.split(",")[1];
      zip.file(`${name}.png`, base64, { base64: true });
      mapping.push([`${name}.png`, text]);
      bulkLog.textContent += `✅ ${name}.png\n`;
    } catch(e){
      bulkLog.textContent += `❌ ${name}: ${e.message}\n`;
    }
  }
  const csv = mapping.map(r=>r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  zip.file("mapping.csv", csv);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "qr-batch.zip");
}

async function bulkWithFallback(items, opts) {
  // If the lib isn't available, we fetch PNGs from the public endpoint and zip them.
  const zip = new JSZip();
  const mapping = [["filename","text"]];
  for (let i=0;i<items.length;i++){
    const { name, text } = items[i];
    try {
      const sz = parseInt(opts.width || 320, 10);
      const m = parseInt(opts.margin || 2, 10);
      const ecc = (opts.errorCorrectionLevel || "M");
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${sz}x${sz}&margin=${m}&ecc=${ecc}`;
      const resp = await fetch(url);
      const blob = await resp.blob();
      zip.file(`${name}.png`, blob);
      mapping.push([`${name}.png`, text]);
      bulkLog.textContent += `✅ ${name}.png\n`;
    } catch(e){
      bulkLog.textContent += `❌ ${name}: ${e.message}\n`;
    }
  }
  const csv = mapping.map(r=>r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  zip.file("mapping.csv", csv);
  const out = await zip.generateAsync({ type: "blob" });
  saveAs(out, "qr-batch.zip");
}

genBulk?.addEventListener("click", async ()=>{
  const lines = parseLines(bulkInput?.value || "");
  if (!lines.length) return alert("Paste at least one line.");
  const limit = Math.min(parseInt(bMax?.value||"100",10), lines.length);
  const items = lines.slice(0, limit);

  const opts = {
    errorCorrectionLevel: bEcl?.value || "M",
    margin: parseInt(bMargin?.value||"2",10),
    width: parseInt(bSize?.value||"320",10)
  };
  bulkLog.textContent = `Generating ${items.length} QR codes...\n`;

  try {
    if (window.QRCode) await bulkWithLib(items, opts);
    else await bulkWithFallback(items, opts);
    bulkLog.textC

