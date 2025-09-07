// Quick QR — vanilla JS, no libraries
const $ = (s) => document.querySelector(s);
const textEl   = $("#text");
const sizeEl   = $("#size");
const marginEl = $("#margin");
const eclEl    = $("#ecl");
const form     = $("#qrForm");
const genBtn   = $("#generate");
const dlA      = $("#download");
const openA    = $("#openNew");
const img      = $("#preview");
const statusEl = $("#status");
const yearEl   = $("#year");

if (yearEl) yearEl.textContent = new Date().getFullYear();

function buildQrUrl({ text, size, margin, ecl }) {
  const base = "https://api.qrserver.com/v1/create-qr-code/";
  const qs = new URLSearchParams({
    data: text,
    size: `${size}x${size}`,
    margin: String(margin),
    ecc: ecl
  });
  // add timestamp to prevent caching issues when regenerating same text
  qs.append("t", String(Date.now()));
  return `${base}?${qs.toString()}`;
}

function setActionsEnabled(enabled) {
  if (enabled) {
    dlA.removeAttribute("aria-disabled");
    openA.removeAttribute("aria-disabled");
  } else {
    dlA.setAttribute("aria-disabled", "true");
    openA.setAttribute("aria-disabled", "true");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = (textEl.value || "").trim();
  if (!text) {
    statusEl.textContent = "Enter text or a URL.";
    setActionsEnabled(false);
    img.removeAttribute("src");
    return;
  }
  const size = Math.max(128, Math.min(1024, parseInt(sizeEl.value || "320", 10)));
  const margin = Math.max(0, Math.min(16, parseInt(marginEl.value || "2", 10)));
  const ecl = eclEl.value || "M";

  const url = buildQrUrl({ text, size, margin, ecl });
  statusEl.textContent = "Generating…";
  img.onerror = () => {
    statusEl.textContent = "Could not load the QR image. Check your connection or try again.";
    setActionsEnabled(false);
  };
  img.onload = () => {
    statusEl.textContent = "QR ready.";
    setActionsEnabled(true);
  };
  img.src = url;
  dlA.href = url;
  openA.href = url;
});

// Allow pressing Enter in the main input to generate
textEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    genBtn.click();
  }
});


