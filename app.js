const $ = (s) => document.querySelector(s);
const yearEl = $("#year"); yearEl.textContent = new Date().getFullYear();

// Tabs
document.querySelectorAll(".tab").forEach(btn=>{
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

async function generateSingle() {
  const text = (singleText.value || "").trim();
  if (!text) { alert("Enter text or a URL."); return; }
  const opts = {
    errorCorrectionLevel: ecl.value,
    margin: parseInt(margin.value || "2", 10),
    width: parseInt(size.value || "320", 10)
  };
  lastPngDataUrl = await QRCode.toDataURL(text, opts);
  lastSvgString = await QRCode.toString(text, { ...opts, type: "svg" });
  preview.src = lastPngDataUrl;
  dlPng.disabled = false; dlSvg.disabled = false;
}

genSingle.addEventListener("click", generateSingle);

dlPng.addEventListener("click", ()=>{
  if (!lastPngDataUrl) return;
  const a = document.createElement("a");
  a.href = lastPngDataUrl;
  a.download = "qr.png";
  a.click();
});

dlSvg.addEventListener("click", ()=>{
  if (!lastSvgString) return;
  const blob = new Blob([lastSvgString], { type: "image/svg+xml" });
  saveAs(blob, "qr.svg");
});

// ---------- Bulk ----------
const bulkInput = $("#bulkInput");
const bSize = $("#bSize");
const bMargin = $("#bMargin");
const bEcl = $("#bEcl");
const bMax = $("#bMax");
const genBulk = $("#genBulk");
const bulkLog = $("#bulkLog");

function parseLines(raw) {
  return raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line, i)=>{
    const parts = line.split(",");
    if (parts.length > 1) {
      const name = parts.shift().trim();
      const text = parts.join(",").trim();
      return { name: sanitize(name) || `qr-${i+1}`, text };
    }
    return { name: `qr-${i+1}`, text: line };
  });
}

function sanitize(str){
  return str.replace(/[^\w\-]+/g, "_").slice(0, 64);
}

genBulk.addEventListener("click", async ()=>{
  const lines = parseLines(bulkInput.value);
  if (!lines.length) { alert("Paste at least one line."); return; }

  const limit = Math.min(parseInt(bMax.value||"100",10), lines.length);
  const opts = {
    errorCorrectionLevel: bEcl.value,
    margin: parseInt(bMargin.value||"2",10),
    width: parseInt(bSize.value||"320",10)
  };

  bulkLog.textContent = `Generating ${limit} QR codes...\n`;
  const zip = new JSZip();

  // Optional: include a mapping CSV inside the zip
  const mapping = [["filename","text"]];

  for (let i=0; i<limit; i++){
    const { name, text } = lines[i];
    try {
      const dataUrl = await QRCode.toDataURL(text, opts);
      const base64 = dataUrl.split(",")[1];
      zip.file(`${name || 'qr-'+(i+1)}.png`, base64, { base64: true });
      mapping.push([`${name}.png`, text]);
      bulkLog.textContent += `✅ ${name}.png\n`;
    } catch (e) {
      bulkLog.textContent += `❌ ${name}: ${e.message}\n`;
    }
  }

  // Add mapping.csv
  const csv = mapping.map(r=>r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  zip.file("mapping.csv", csv);

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "qr-batch.zip");
  bulkLog.textContent += `\nDone. Downloaded qr-batch.zip`;
});
