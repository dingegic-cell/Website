// Datenhaltung: alles bleibt auf dem Gerät.
// Strukturierte Daten in localStorage, Dateien (Fotos, PDFs, Sprachnachrichten) in IndexedDB.

const KEY = 'baulot-data-v1';

export const DEFAULT_COMPANY = {
  name: 'Nordbau Projektentwicklung',
  owner: 'Din Gegic',
  street: 'Warburger Str. 30',
  zip: '34246',
  city: 'Vellmar',
  phone: '015755234638',
  email: 'info@nordbau-projekt.de',
  web: 'www.nordbau-projektentwicklung.com',
  taxNo: '026 820 63511',
  vatId: 'DE464741055',
  bank: '',
  iban: 'DE08 5307 0394 0075 8458 00',
  bic: 'DEUTDEFFS27',
  footer: '',
  logo: null,
  logoSize: 50,
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function seed() {
  const now = new Date().toISOString();
  return {
    version: 1,
    company: { ...DEFAULT_COMPANY },
    customers: [
      { id: uid(), no: '', name: 'Delic Bau GmbH', contact: '', street: 'Triftstraße 2', zip: '38126', city: 'Braunschweig', email: '', phone: '', note: '', createdAt: now },
      { id: uid(), no: '12', name: 'Fa. Nass und Trocken Helmut Voigt', contact: '', street: '', zip: '', city: '', email: '', phone: '', note: '', createdAt: now },
      { id: uid(), no: '11', name: 'Julian Borkowski', contact: '', street: 'Rogerusstr. 26', zip: '34385', city: 'Bad Karlshafen', email: '', phone: '', note: '', createdAt: now },
    ],
    docs: [],
    contracts: [],
    sites: [],
    events: [],
    templates: [],
    uploads: [],
    counters: {},
    seeded: { contract: false },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const base = seed();
      for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
      data.company = { ...DEFAULT_COMPANY, ...data.company };
      return data;
    }
  } catch (e) {
    console.warn('Daten konnten nicht gelesen werden', e);
  }
  return seed();
}

export const state = load();

let timer = null;
export function save(now = false) {
  clearTimeout(timer);
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('baulot:save-error', { detail: e }));
    }
  };
  if (now) write();
  else timer = setTimeout(write, 250);
}
window.addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

export function replaceAll(data) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, seed(), data);
  state.company = { ...DEFAULT_COMPANY, ...state.company };
  save(true);
}

export function nextNumber(prefix) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  state.counters[key] = (state.counters[key] || 0) + 1;
  save();
  return `${prefix}-${year}-${String(state.counters[key]).padStart(4, '0')}`;
}

// ---------- Pfad-Helfer für bearbeitbare Felder ----------
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

// ---------- Dateien (IndexedDB) ----------
let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open('baulot-files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('files', mode);
    const req = fn(t.objectStore('files'));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
  });
}
export const files = {
  put: (id, blob) => tx('readwrite', (s) => s.put(blob, id)),
  get: (id) => tx('readonly', (s) => s.get(id)),
  del: (id) => tx('readwrite', (s) => s.delete(id)),
  async all() {
    const d = await db();
    return new Promise((resolve, reject) => {
      const out = {};
      const t = d.transaction('files', 'readonly');
      const req = t.objectStore('files').openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (c) { out[c.key] = c.value; c.continue(); }
      };
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
    });
  },
};

// Kleine Vorschaubilder für Listen
const urlCache = new Map();
export async function fileURL(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  const blob = await files.get(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}
export function forgetURL(id) {
  const u = urlCache.get(id);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(id);
}
