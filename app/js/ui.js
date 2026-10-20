import { icon } from './icons.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const euro = (n) => (Number(n) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const num = (v) => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isNaN(n) ? 0 : n;
};
export const fmtNum = (n) => (Number(n) || 0).toLocaleString('de-DE', { maximumFractionDigits: 3 });
export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
export const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
};
export const fmtBytes = (b) => (b > 1048576 ? `${(b / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// ---------- Toast ----------
let toastBox;
export function toast(msg, type = 'ok') {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    toastBox.setAttribute('role', 'status');
    document.body.appendChild(toastBox);
  }
  const t = document.createElement('div');
  t.className = `toast ${type === 'error' ? 'error' : ''}`;
  t.innerHTML = `${icon(type === 'error' ? 'alert' : 'check', 'sm')}<span>${esc(msg)}</span>`;
  toastBox.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s, transform .3s'; t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; }, 2400);
  setTimeout(() => t.remove(), 2800);
}

// ---------- Bottom-Sheet / Dialog ----------
const openSheets = [];
export function openSheet({ title, body, foot = '', acts = {}, onMount, onClose }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-grab"></div>
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="btn ghost icon sm" data-act="close" aria-label="Schließen">${icon('x')}</button></div>
      <div class="sheet-body">${body}</div>
      ${foot ? `<div class="sheet-foot">${foot}</div>` : ''}
    </div>`;
  const api = {
    el: ov,
    close() {
      if (!ov.isConnected) return;
      ov.remove();
      openSheets.splice(openSheets.indexOf(api), 1);
      document.body.style.overflow = openSheets.length ? 'hidden' : '';
      onClose && onClose();
    },
    q: (s) => ov.querySelector(s),
    qa: (s) => [...ov.querySelectorAll(s)],
  };
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) api.close(); });
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !ov.contains(b)) return;
    const a = b.dataset.act;
    if (a === 'close') return api.close();
    if (acts[a]) acts[a](b, e, api);
  });
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  openSheets.push(api);
  onMount && onMount(api);
  const first = ov.querySelector('[autofocus]');
  if (first && matchMedia('(hover: hover)').matches) first.focus();
  return api;
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openSheets.length) openSheets[openSheets.length - 1].close();
});

export function confirmDialog(text, { ok = 'Löschen', danger = true, title = 'Bist du sicher?' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet({
      title,
      body: `<p style="color:var(--muted)">${esc(text)}</p>`,
      foot: `<button class="btn" data-act="close">Abbrechen</button><button class="btn ${danger ? 'danger' : 'primary'}" data-act="ok">${esc(ok)}</button>`,
      acts: { ok: () => { done = true; s.close(); resolve(true); } },
      onClose: () => { if (!done) resolve(false); },
    });
  });
}

// Formularwerte einer Sheet-Form einsammeln
export function formValues(root) {
  const out = {};
  root.querySelectorAll('[name]').forEach((el) => {
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return out;
}

export function field({ name, label, value = '', type = 'text', ph = '', opts, full, hint, inputmode, attrs = '' }) {
  const v = esc(value);
  let control;
  if (type === 'textarea') control = `<textarea class="input" name="${name}" placeholder="${esc(ph)}" ${attrs}>${v}</textarea>`;
  else if (type === 'select') control = `<select class="input" name="${name}" ${attrs}>${opts.map((o) => {
    const [val, lab] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(val)}" ${String(val) === String(value) ? 'selected' : ''}>${esc(lab)}</option>`;
  }).join('')}</select>`;
  else control = `<input class="input" name="${name}" type="${type}" value="${v}" placeholder="${esc(ph)}" ${inputmode ? `inputmode="${inputmode}"` : ''} ${attrs}>`;
  return `<label class="field ${full ? 'full' : ''}"><span>${esc(label)}${hint ? ` <em>· ${esc(hint)}</em>` : ''}</span>${control}</label>`;
}

export function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function safeName(s) {
  return String(s || 'Dokument').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Dokument';
}
