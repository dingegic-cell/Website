// PDF-Erzeugung mit echtem Text (jsPDF). Liest die fertig aufgebaute Dokument-Ansicht
// (gleiche Texte wie auf dem Bildschirm) und setzt sie Zeile für Zeile auf A4.
// Dadurch sieht das PDF auf jedem Gerät gleich aus, und die Fußzeile steht immer unten.

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;
const MR = 18;
const CW = PAGE_W - ML - MR;
const TOP = 16;
const PX = 210 / 794; // Bildschirm-Pixel des Papiers → mm
const PT = 0.3528; // pt → mm

const INK = [28, 29, 33];
const MUTED = [108, 111, 120];
const LINE = [222, 220, 214];

const FONTS = [
  ['Figtree-Regular.ttf', 'Figtree', 'normal'],
  ['Figtree-SemiBold.ttf', 'Figtree', 'bold'],
  ['Outfit-SemiBold.ttf', 'Outfit', 'bold'],
];

let libPromise = null;
function loadLib() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('../vendor/jspdf.umd.min.js', import.meta.url).href;
      s.onload = () => resolve(window.jspdf.jsPDF);
      s.onerror = () => { libPromise = null; reject(new Error('PDF-Modul konnte nicht geladen werden')); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

const fontCache = {};
async function fontBase64(file) {
  if (!fontCache[file]) {
    fontCache[file] = fetch(new URL(`../vendor/fonts/${file}`, import.meta.url)).then(async (r) => {
      if (!r.ok) throw new Error(`Schrift ${file} fehlt`);
      const bytes = new Uint8Array(await r.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    });
  }
  return fontCache[file];
}

function imageData(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ---------- Schreib-Helfer ----------
class Writer {
  constructor(pdf, bottom) {
    this.pdf = pdf;
    this.y = TOP;
    this.bottom = bottom;
    this.onNewPage = null;
  }

  font(family, style, size, color = INK) {
    this.pdf.setFont(family, style);
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(...color);
    this.size = size;
  }

  lh(factor = 1.5) { return this.size * PT * factor; }

  newPage() {
    this.pdf.addPage();
    this.y = TOP;
    if (this.onNewPage) this.onNewPage();
  }

  ensure(h) {
    if (this.y + h > this.bottom) { this.newPage(); return true; }
    return false;
  }

  // Text umbrechen; jede Zeile merkt sich, ob sie die letzte ihres Absatzes ist
  wrap(text, width) {
    const out = [];
    String(text ?? '').split('\n').forEach((seg) => {
      if (!seg.trim()) { out.push({ t: '', last: true }); return; }
      const lines = this.pdf.splitTextToSize(seg, width);
      lines.forEach((t, i) => out.push({ t, last: i === lines.length - 1 }));
    });
    return out;
  }

  drawLine(t, x, y, width, align, justify) {
    const pdf = this.pdf;
    if (justify) {
      const words = t.trim().split(/\s+/);
      const total = words.reduce((s, w) => s + pdf.getTextWidth(w), 0);
      const gap = words.length > 1 ? (width - total) / (words.length - 1) : 0;
      if (words.length > 1 && gap < pdf.getTextWidth(' ') * 4) {
        let cx = x;
        words.forEach((w) => { pdf.text(w, cx, y, { baseline: 'top' }); cx += pdf.getTextWidth(w) + gap; });
        return;
      }
    }
    if (align === 'right') pdf.text(t, x + width, y, { baseline: 'top', align: 'right' });
    else if (align === 'center') pdf.text(t, x + width / 2, y, { baseline: 'top', align: 'center' });
    else pdf.text(t, x, y, { baseline: 'top' });
  }

  // Absatz mit automatischem Seitenumbruch
  para(text, { x = ML, width = CW, align = 'left', justify = false, lh = 1.5, after = 0 } = {}) {
    const lines = this.wrap(text, width);
    const h = this.lh(lh);
    lines.forEach((l) => {
      this.ensure(h);
      if (l.t) this.drawLine(l.t, x, this.y, width, align, justify && !l.last);
      this.y += h;
    });
    this.y += after;
  }

  // Höhe eines Absatzes, ohne zu zeichnen
  measure(text, width, lh = 1.5) {
    return this.wrap(text, width).length * this.lh(lh);
  }

  rule(y, color = LINE, w = 0.25, x1 = ML, x2 = PAGE_W - MR) {
    this.pdf.setDrawColor(...color);
    this.pdf.setLineWidth(w);
    this.pdf.line(x1, y, x2, y);
  }
}

const txt = (root, sel) => {
  const el = root.querySelector(sel);
  return el ? el.textContent.replace(/ /g, ' ').replace(/\s+$/, '') : '';
};
const ce = (root, path) => txt(root, `[data-ce="${path}"]`);

// Briefkopf (nur Seite 1)
async function letterhead(w, root) {
  const pdf = w.pdf;
  const top = w.y;
  let x = ML;
  let leftH = 0;
  const imgEl = root.querySelector('.p-brand img');
  if (imgEl) {
    const img = await imageData(imgEl.getAttribute('src'));
    if (img) {
      const pxH = parseFloat(imgEl.style.height) || 60;
      let h = Math.min(pxH * PX, 26);
      let iw = (img.w / img.h) * h;
      if (iw > 58) { iw = 58; h = (img.h / img.w) * iw; }
      pdf.addImage(img.data, 'PNG', ML, top, iw, h);
      x = ML + iw + 5;
      leftH = h;
    }
  }
  const addr = ce(root, 'over.coAddr');
  const addrW = 62;
  w.font('Figtree', 'normal', 7.5, MUTED);
  const addrLines = w.wrap(addr, addrW);
  const addrH = addrLines.length * w.lh(1.55);
  addrLines.forEach((l, i) => w.drawLine(l.t, PAGE_W - MR - addrW, top + i * w.lh(1.55), addrW, 'right'));

  const nameW = PAGE_W - MR - addrW - 4 - x;
  w.font('Outfit', 'bold', 13.5, INK);
  const nameLines = w.wrap(ce(root, 'over.coName'), nameW);
  const nameH = nameLines.length * w.lh(1.2);
  const owner = ce(root, 'over.coOwner');
  w.font('Figtree', 'normal', 9, MUTED);
  const ownerH = owner ? w.lh(1.4) : 0;
  const blockH = nameH + ownerH;
  let ny = top + Math.max(0, (leftH - blockH) / 2);
  w.font('Outfit', 'bold', 13.5, INK);
  nameLines.forEach((l) => { pdf.text(l.t, x, ny, { baseline: 'top' }); ny += w.lh(1.2); });
  if (owner) { w.font('Figtree', 'normal', 9, MUTED); pdf.text(owner, x, ny + 0.6, { baseline: 'top' }); }

  const h = Math.max(leftH, blockH, addrH);
  w.rule(top + h + 5);
  w.y = top + h + 5;
}

// ---------- Vertrag ----------
async function contract(w, root) {
  const pdf = w.pdf;
  await letterhead(w, root);
  w.y += 10;
  w.font('Outfit', 'bold', 16, INK);
  w.para(ce(root, 'title'), { align: 'center', lh: 1.25, after: 7 });

  // Parteien
  const colW = (CW - 10) / 2;
  const parties = [...root.querySelectorAll('.p-parties > div')];
  const top = w.y;
  let maxH = 0;
  parties.forEach((p, i) => {
    const x = ML + i * (colW + 10);
    let y = top;
    w.font('Figtree', 'bold', 7, MUTED);
    pdf.setCharSpace(0.35);
    pdf.text(txt(p, '.p-label').toUpperCase(), x, y, { baseline: 'top' });
    pdf.setCharSpace(0);
    y += 4.2;
    const party = p.querySelector('.p-party');
    const plain = party && party.classList.contains('plain');
    w.font('Figtree', 'normal', 9, INK);
    w.wrap(txt(p, '.p-party'), colW).forEach((l, j) => {
      pdf.setFont('Figtree', !plain && j === 0 ? 'bold' : 'normal');
      if (l.t) pdf.text(l.t, x, y, { baseline: 'top' });
      y += w.lh(1.5);
    });
    maxH = Math.max(maxH, y - top);
  });
  w.y = top + maxH + 5;

  const intro = ce(root, 'intro');
  if (intro) { w.font('Figtree', 'normal', 9, MUTED); w.para(intro, { after: 3 }); }

  root.querySelectorAll('.p-sec').forEach((sec) => {
    const head = `${txt(sec, '.num')}  ${txt(sec, '.p-sec-h .ce')}`;
    const paras = [...sec.querySelectorAll('.p-para')].map((p) => p.textContent.replace(/\s+$/, ''));
    w.font('Figtree', 'normal', 9, INK);
    const firstH = paras.length ? Math.min(w.measure(paras[0], CW), w.lh() * 2) : 0;
    w.y += 4;
    w.ensure(6 + firstH);
    w.font('Outfit', 'bold', 10.5, INK);
    w.para(head, { lh: 1.35, after: 1.2 });
    w.font('Figtree', 'normal', 9, INK);
    paras.forEach((p) => w.para(p, { justify: true, after: 1.8 }));
  });

  // Ort, Datum und Unterschriften zusammenhalten
  w.font('Figtree', 'normal', 9, INK);
  const signs = [...root.querySelectorAll('.p-sign')].map((s) => s.textContent.replace(/\s+$/, ''));
  w.y += 8;
  w.ensure(34);
  w.para(ce(root, 'placeDate'), { after: 0 });
  const sy = w.y + 16;
  const sw = (CW - 14) / 2;
  signs.forEach((s, i) => {
    const x = ML + i * (sw + 14);
    w.rule(sy, [85, 85, 85], 0.3, x, x + sw);
    w.font('Figtree', 'normal', 8, MUTED);
    w.wrap(s, sw).forEach((l, j) => pdf.text(l.t, x, sy + 1.8 + j * w.lh(1.4), { baseline: 'top' }));
  });
  w.y = sy + 10;
}

// ---------- Kostenvoranschlag / Rechnung ----------
async function invoice(w, root) {
  const pdf = w.pdf;
  await letterhead(w, root);
  w.y += 9;
  const top = w.y;

  // links: Absenderzeile + Empfänger
  const leftW = 92;
  let ly = top;
  const sender = ce(root, 'over.sender');
  if (sender) {
    w.font('Figtree', 'normal', 6.8, MUTED);
    const sl = w.wrap(sender, leftW);
    sl.forEach((l) => { pdf.text(l.t, ML, ly, { baseline: 'top' }); ly += w.lh(1.35); });
    w.rule(ly + 0.4, MUTED, 0.15, ML, ML + Math.min(leftW, Math.max(...sl.map((l) => pdf.getTextWidth(l.t)))));
    ly += 2.2;
  }
  w.font('Figtree', 'normal', 9.5, INK);
  w.wrap(ce(root, 'recipient'), leftW).forEach((l, j) => {
    pdf.setFont('Figtree', j === 0 ? 'bold' : 'normal');
    if (l.t) pdf.text(l.t, ML, ly, { baseline: 'top' });
    ly += w.lh(1.5);
  });

  // rechts: Nummer, Datum …
  const mx = 118;
  const mw = PAGE_W - MR - mx;
  let my = top;
  const dts = [...root.querySelectorAll('.p-meta dt')];
  const dds = [...root.querySelectorAll('.p-meta dd')];
  w.font('Figtree', 'normal', 9, INK);
  dts.forEach((dt, i) => {
    pdf.setTextColor(...MUTED);
    pdf.text(dt.textContent.trim(), mx, my, { baseline: 'top' });
    pdf.setTextColor(...INK);
    pdf.text((dds[i]?.textContent || '').trim(), mx + mw, my, { baseline: 'top', align: 'right' });
    my += w.lh(1.6);
  });
  w.y = Math.max(ly, my) + 9;

  w.font('Outfit', 'bold', 16, INK);
  w.para(ce(root, 'over.heading'), { lh: 1.25, after: 1.5 });
  const title = ce(root, 'title');
  if (title) { w.font('Figtree', 'normal', 9.5, MUTED); w.para(title, { after: 2 }); }
  const intro = ce(root, 'intro');
  if (intro) { w.font('Figtree', 'normal', 9.5, INK); w.y += 2; w.para(intro, { after: 2 }); }

  // Tabelle
  const cols = [
    { x: ML, w: 11, align: 'left' },
    { x: ML + 11, w: CW - 11 - 26 - 28 - 28, align: 'left' },
    { x: 0, w: 26, align: 'right' },
    { x: 0, w: 28, align: 'right' },
    { x: 0, w: 28, align: 'right' },
  ];
  cols[2].x = cols[1].x + cols[1].w;
  cols[3].x = cols[2].x + cols[2].w;
  cols[4].x = cols[3].x + cols[3].w;
  const heads = [...root.querySelectorAll('.p-table th')].map((th) => th.textContent.trim().toUpperCase());
  const tableHead = () => {
    w.font('Figtree', 'bold', 6.8, MUTED);
    heads.forEach((h, i) => w.drawLine(h, cols[i].x + (i ? 1.5 : 0), w.y, cols[i].w - (i ? 1.5 : 0), cols[i].align));
    w.y += 4.2;
    w.rule(w.y, INK, 0.45);
    w.y += 2.2;
  };
  w.y += 5;
  w.ensure(16);
  tableHead();
  const rows = [...root.querySelectorAll('.p-table tbody tr')];
  rows.forEach((tr) => {
    const tds = [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/ /g, ' ').trim());
    w.font('Figtree', 'normal', 9, INK);
    if (tds.length === 1) {
      pdf.setTextColor(...MUTED);
      w.drawLine(tds[0], ML, w.y + 1, CW, 'center');
      w.y += w.lh() + 3;
      w.rule(w.y);
      w.y += 2.2;
      return;
    }
    const descLines = w.wrap(tds[1], cols[1].w - 3);
    const rowH = descLines.length * w.lh(1.45);
    if (w.ensure(rowH + 2.5)) tableHead();
    w.font('Figtree', 'normal', 9, INK);
    pdf.setTextColor(...MUTED);
    pdf.text(tds[0], cols[0].x, w.y, { baseline: 'top' });
    pdf.setTextColor(...INK);
    descLines.forEach((l, j) => { if (l.t) pdf.text(l.t, cols[1].x + 1.5, w.y + j * w.lh(1.45), { baseline: 'top' }); });
    [2, 3, 4].forEach((i) => w.drawLine(tds[i] || '', cols[i].x, w.y, cols[i].w, 'right'));
    w.y += rowH + 1.6;
    w.rule(w.y);
    w.y += 2.2;
  });

  // Summen
  const sums = [...root.querySelectorAll('.p-sum > div')];
  const sx = PAGE_W - MR - 78;
  w.font('Figtree', 'normal', 9, INK);
  w.y += 2;
  w.ensure(sums.length * 6 + 6);
  sums.forEach((row) => {
    const [label, value] = [...row.children].map((s) => s.textContent.replace(/ /g, ' ').trim());
    const total = row.classList.contains('total');
    if (total) {
      w.y += 1.5;
      w.rule(w.y, INK, 0.45, sx, PAGE_W - MR);
      w.y += 2.2;
      w.font('Figtree', 'bold', 10.5, INK);
    } else w.font('Figtree', 'normal', 9, INK);
    pdf.text(label, sx + 1.5, w.y, { baseline: 'top' });
    pdf.text(value, PAGE_W - MR - 1.5, w.y, { baseline: 'top', align: 'right' });
    w.y += w.lh(1.6);
  });

  ['over.payNote', 'closing', 'over.footNote'].forEach((path) => {
    const t = ce(root, path);
    if (!t) return;
    w.font('Figtree', 'normal', 9.5, INK);
    w.y += 4;
    w.para(t, { after: 0 });
  });
}

function invoiceFooter(pdf, root) {
  const cols = ['over.foot1', 'over.foot2', 'over.foot3'].map((p) => ce(root, p));
  const n = pdf.internal.getNumberOfPages();
  const colW = (CW - 8) / 3;
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    const y0 = PAGE_H - 30;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.line(ML, y0, PAGE_W - MR, y0);
    pdf.setFont('Figtree', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED);
    cols.forEach((c, j) => {
      const x = ML + j * (colW + 4);
      let y = y0 + 3;
      String(c).split('\n').forEach((seg) => {
        pdf.splitTextToSize(seg, colW).forEach((line) => { pdf.text(line, x, y, { baseline: 'top' }); y += 7 * PT * 1.5; });
      });
    });
    if (n > 1) pdf.text(`Seite ${i} von ${n}`, PAGE_W - MR, PAGE_H - 8, { baseline: 'top', align: 'right' });
  }
}

function pageNumbers(pdf) {
  const n = pdf.internal.getNumberOfPages();
  if (n < 2) return;
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    pdf.setFont('Figtree', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text(`Seite ${i} von ${n}`, PAGE_W / 2, PAGE_H - 10, { baseline: 'top', align: 'center' });
  }
}

export async function buildPdf(paperHTML, title = '') {
  const [JsPDF, ...fonts] = await Promise.all([loadLib(), ...FONTS.map(([f]) => fontBase64(f))]);
  const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  FONTS.forEach(([file, family, style], i) => {
    pdf.addFileToVFS(file, fonts[i]);
    pdf.addFont(file, family, style, undefined, 'Identity-H');
  });
  pdf.setProperties({ title, creator: 'Baulot' });
  pdf.setLineHeightFactor(1.5);

  const tpl = document.createElement('template');
  tpl.innerHTML = paperHTML.trim();
  const root = tpl.content.firstElementChild;
  const isDoc = root.dataset.paper === 'doc';
  const w = new Writer(pdf, isDoc ? PAGE_H - 36 : PAGE_H - 18);

  if (isDoc) {
    await invoice(w, root);
    invoiceFooter(pdf, root);
  } else {
    await contract(w, root);
    pageNumbers(pdf);
  }
  return pdf.output('blob');
}
