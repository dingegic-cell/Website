import { state, save, uid, todayISO, nextNumber, getPath, setPath, files, fileURL, forgetURL, replaceAll } from './store.js';
import { icon } from './icons.js';
import { esc, euro, num, fmtDate, fmtDateTime, fmtBytes, toast, openSheet, confirmDialog, formValues, field, download, safeName } from './ui.js';
import { CONTRACT_TYPES, buildContract, contractName, SEED_CONTRACT_FORM } from './contracts.js';
import { DOC_TYPES, UNITS, totals, customerBlock, isOverdue, docPaper, contractPaper, savePdf, sharePdf, eInvoiceXML, DEFAULT_LOGO, logoHeight } from './paper.js';

const app = document.getElementById('app');
const MAX_FILE = 50 * 1024 * 1024;

// ---------- Erstbefüllung ----------
if (!state.seeded.contract) {
  const k = newContract('bau', SEED_CONTRACT_FORM);
  k.createdAt = k.updatedAt = '2026-10-15T12:00:00.000Z';
  state.contracts.push(k);
  state.seeded.contract = true;
  save(true);
}

// ---------- Darstellung (Theme) ----------
function applyTheme() {
  let t = 'system';
  try { t = localStorage.getItem('baulot-theme') || 'system'; } catch (e) { /* privat */ }
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}
applyTheme();

window.addEventListener('baulot:save-error', () => toast('Speicher voll – bitte große Logos oder alte Daten entfernen.', 'error'));

// ---------- Navigation ----------
const NAV = [
  { r: 'uebersicht', l: 'Übersicht', i: 'grid', tone: 'orange' },
  { r: 'dokumente', l: 'Dokumente', i: 'file', tone: 'blue' },
  { r: 'vertraege', l: 'Verträge', i: 'contract', tone: 'violet' },
  { r: 'termine', l: 'Termine', i: 'calendar', tone: 'green' },
  { r: 'baustellen', l: 'Baustellen', i: 'hat', tone: 'yellow' },
  { r: 'kunden', l: 'Kunden', i: 'users', tone: 'blue' },
  { r: 'ablage', l: 'Ablage', i: 'folder', tone: 'orange' },
  { r: 'vorlagen', l: 'Vorlagen', i: 'layers', tone: 'violet' },
  { r: 'firma', l: 'Firma', i: 'building', tone: 'green' },
];
const TAB_ROUTES = ['uebersicht', 'dokumente', 'vertraege', 'termine'];
const ROUTE_GROUP = { dokument: 'dokumente', vertrag: 'vertraege', baustelle: 'baustellen' };

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'uebersicht', id: parts[1] ? decodeURIComponent(parts[1]) : null };
}
const go = (h) => { location.hash = h; };

// ---------- Anmeldung (lokal) ----------
const ACC_KEY = 'baulot-account';
const SES_KEY = 'baulot-session';
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privat */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* privat */ } },
};
async function hash(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return String(h);
}
const account = () => { try { return JSON.parse(ls.get(ACC_KEY) || 'null'); } catch (e) { return null; } };
const loggedIn = () => ls.get(SES_KEY) === '1' && !!account();

let authMode = null;
function renderAuth() {
  const acc = account();
  const mode = authMode || (acc ? 'login' : 'register');
  document.title = 'Anmelden · Baulot';
  app.innerHTML = `
  <main class="auth">
    <div class="auth-card">
      <div class="brand"><div class="brand-mark">${icon('hat')}</div><div>Baulot<small>${esc(state.company.name)}</small></div></div>
      <h1>${mode === 'login' ? 'Willkommen zurück' : 'Konto anlegen'}</h1>
      <p class="lead">${mode === 'login' ? 'Melde dich an, um weiterzuarbeiten.' : 'Lege einmalig deinen Zugang für dieses Gerät fest.'}</p>
      <form class="form" id="auth-form">
        ${field({ name: 'email', label: 'E-Mail', type: 'email', ph: 'name@firma.de', value: acc?.email || '', attrs: 'autocomplete="username" required' })}
        ${field({ name: 'pw', label: 'Passwort', type: 'password', ph: '••••••••', attrs: `autocomplete="${mode === 'login' ? 'current' : 'new'}-password" required minlength="4"` })}
        ${mode === 'register' ? field({ name: 'pw2', label: 'Passwort wiederholen', type: 'password', ph: '••••••••', attrs: 'autocomplete="new-password" required' }) : ''}
        <button class="btn primary block" type="submit">${mode === 'login' ? 'Anmelden' : 'Konto anlegen'}</button>
      </form>
      ${mode === 'login'
        ? `<p class="switch">Passwort vergessen? <button type="button" data-auth="reset">Zugang zurücksetzen</button></p>`
        : (acc ? `<p class="switch">Schon ein Konto? <button type="button" data-auth="login">Anmelden</button></p>` : '')}
      <div class="note">${icon('lock', 'sm')}<span>Alle Daten bleiben auf diesem Gerät gespeichert. Sichere sie regelmäßig unter <b>Firma → Datensicherung</b>.</span></div>
    </div>
  </main>`;
  const form = app.querySelector('#auth-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(form);
    if (mode === 'register') {
      if (v.pw !== v.pw2) return toast('Die Passwörter stimmen nicht überein.', 'error');
      const salt = uid();
      ls.set(ACC_KEY, JSON.stringify({ email: v.email.trim(), salt, hash: await hash(salt + v.pw) }));
      ls.set(SES_KEY, '1');
      authMode = null;
      toast('Konto angelegt');
      return render();
    }
    const a = account();
    if (a && a.email.toLowerCase() === v.email.trim().toLowerCase() && a.hash === await hash(a.salt + v.pw)) {
      ls.set(SES_KEY, '1');
      authMode = null;
      render();
    } else toast('E-Mail oder Passwort ist falsch.', 'error');
  });
  app.querySelectorAll('[data-auth]').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.auth === 'reset') {
      if (await confirmDialog('Der Zugang wird entfernt und du legst ein neues Passwort fest. Deine Daten bleiben erhalten.', { ok: 'Zurücksetzen', title: 'Zugang zurücksetzen?' })) {
        ls.del(ACC_KEY);
        authMode = 'register';
        renderAuth();
      }
    } else { authMode = b.dataset.auth; renderAuth(); }
  }));
}

// ---------- Rahmen ----------
function shell() {
  app.innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand"><div class="brand-mark">${icon('hat')}</div><div>Baulot<small>${esc(state.company.name)}</small></div></div>
      <nav class="side-nav">${NAV.map((n) => `<a class="side-link" data-nav="${n.r}" href="#/${n.r}">${icon(n.i)}${n.l}</a>`).join('')}</nav>
      <div class="side-foot">Daten lokal auf diesem Gerät</div>
    </aside>
    <main class="main" id="view"></main>
    <nav class="tabbar">
      ${NAV.filter((n) => TAB_ROUTES.includes(n.r)).map((n) => `<a class="tab" data-nav="${n.r}" href="#/${n.r}">${icon(n.i)}<span>${n.l}</span></a>`).join('')}
      <button class="tab" data-action="more" data-nav="mehr">${icon('more')}<span>Mehr</span></button>
    </nav>
  </div>`;
}

const VIEWS = {};
let current = null;

function render() {
  if (!loggedIn()) return renderAuth();
  if (!document.getElementById('view')) shell();
  const r = route();
  const view = VIEWS[r.name] || VIEWS.uebersicht;
  const group = ROUTE_GROUP[r.name] || r.name;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const n = a.dataset.nav;
    a.classList.toggle('active', n === group || (n === 'mehr' && !TAB_ROUTES.includes(group)));
  });
  const main = document.getElementById('view');
  main.classList.remove('wide');
  if (current?.cleanup) current.cleanup(r);
  current = { route: r };
  main.innerHTML = view(r.id, main) || '';
  const title = main.querySelector('h1')?.textContent?.trim();
  document.title = `${title || 'Baulot'} · Baulot`;
  if (current.mount) current.mount(main);
  hydrateImages(main);
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

// Bilder aus IndexedDB nachladen
function hydrateImages(root) {
  root.querySelectorAll('img[data-file]').forEach(async (img) => {
    const url = await fileURL(img.dataset.file);
    if (url) img.src = url;
  });
}

// ---------- Hilfen ----------
const pageHead = (title, sub, actions = '', eyebrow = '') => `
  <div class="page-head">
    <div>${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </div>`;
const empty = (ico, title, text, btn = '') => `<div class="empty"><div class="empty-icon">${icon(ico, 'lg')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${btn}</div>`;
const badge = (s, label) => `<span class="badge ${esc(s)}">${esc(label || s)}</span>`;
const byUpdated = (a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt));
const customer = (id) => state.customers.find((c) => c.id === id);
const site = (id) => state.sites.find((s) => s.id === id);
const touch = (o) => { o.updatedAt = new Date().toISOString(); };
const STATUS_LABEL = { entwurf: 'Entwurf', versendet: 'Versendet', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt', offen: 'Offen', bezahlt: 'Bezahlt', storniert: 'Storniert', ueberfaellig: 'Überfällig', geplant: 'Geplant', aktiv: 'Aktiv', pausiert: 'Pausiert', abgeschlossen: 'Abgeschlossen' };
const docStatus = (d) => (isOverdue(d) ? 'ueberfaellig' : d.status);

function customerOptions(selected, emptyLabel = 'Kein Kunde') {
  return `<option value="">${esc(emptyLabel)}</option>${state.customers.map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}${c.no ? ` (Nr. ${esc(c.no)})` : ''}</option>`).join('')}`;
}

// =====================================================================
// Übersicht
// =====================================================================
VIEWS.uebersicht = () => {
  const kvOpen = state.docs.filter((d) => d.type === 'kv' && ['entwurf', 'versendet'].includes(d.status));
  const reOpen = state.docs.filter((d) => d.type === 're' && d.status === 'offen');
  const sitesActive = state.sites.filter((s) => s.status === 'aktiv');
  const defects = state.sites.flatMap((s) => (s.defects || []).filter((d) => !d.done));
  const sum = (arr) => arr.reduce((s, d) => s + totals(d).gross, 0);
  const h = new Date().getHours();
  const greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  const first = (state.company.owner || '').split(' ')[0];
  const now = new Date();
  const upcoming = state.events
    .filter((e) => new Date(`${e.date}T${e.end || e.start}`) >= now)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
    .slice(0, 4);
  const recent = [
    ...state.docs.map((d) => ({ t: 'doc', o: d })),
    ...state.contracts.map((k) => ({ t: 'k', o: k })),
  ].sort((a, b) => byUpdated(a.o, b.o)).slice(0, 5);

  const stat = (href, label, value, sub, ico, tone) => `
    <a class="stat" href="${href}">
      <div class="stat-icon tone-${tone}">${icon(ico)}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-sub">${sub}</div>
    </a>`;

  return `
  <section class="hero">
    <h1>${greet}${first ? `, ${esc(first)}` : ''}</h1>
    <p>Dein Baustellen- und Büroüberblick · ${now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <div class="hero-actions">
      <button class="btn primary" data-action="new-any">${icon('plus')}Neues Dokument</button>
      <button class="btn" data-action="event-new">${icon('calendar')}Termin</button>
    </div>
  </section>
  <div class="grid four">
    ${stat('#/dokumente', 'Offene Angebote', kvOpen.length, euro(sum(kvOpen)), 'quote', 'orange')}
    ${stat('#/dokumente', 'Offene Rechnungen', euro(sum(reOpen)), `${reOpen.length} Stück`, 'receipt', 'blue')}
    ${stat('#/baustellen', 'Aktive Baustellen', sitesActive.length, `${state.sites.length} gesamt`, 'hat', 'green')}
    ${stat('#/baustellen', 'Offene Mängel', defects.length, 'zu erledigen', 'alert', 'red')}
  </div>

  <div class="section">
    <div class="section-title"><h2>Nächste Termine</h2><a href="#/termine">Kalender</a></div>
    <div class="card">
      ${upcoming.length ? `<div class="list">${upcoming.map(eventRow).join('')}</div>`
        : empty('calendar', 'Keine Termine geplant', 'Trage Baustellen-Termine, Aufmaße oder Abnahmen im Kalender ein.', `<button class="btn sm" data-action="event-new">${icon('plus', 'sm')}Termin eintragen</button>`)}
    </div>
  </div>

  <div class="section">
    <div class="section-title"><h2>Zuletzt bearbeitet</h2></div>
    <div class="card">
      ${recent.length ? `<div class="list">${recent.map((r) => (r.t === 'doc' ? docRow(r.o) : contractRow(r.o))).join('')}</div>`
        : empty('file', 'Noch nichts erstellt', 'Erstelle deinen ersten Kostenvoranschlag – in zwei Minuten fertig.')}
    </div>
  </div>`;
};

function eventRow(e) {
  const s = site(e.siteId);
  const d = new Date(`${e.date}T00:00:00`);
  return `
  <button class="row" data-action="event-open" data-id="${e.id}">
    <div class="row-icon" style="flex-direction:column;gap:0;background:var(--accent-soft);color:var(--accent)">
      <b style="font-size:15px;line-height:1">${d.getDate()}</b><small style="font-size:10px;font-weight:700;text-transform:uppercase">${d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')}</small>
    </div>
    <div class="row-main">
      <div class="row-title">${esc(e.title || 'Termin')}</div>
      <div class="row-sub">${d.toLocaleDateString('de-DE', { weekday: 'long' })} · ${esc(e.start)}–${esc(e.end)}${s ? ` · ${esc(s.name)}` : ''}</div>
    </div>
    ${icon('right', 'chev')}
  </button>`;
}

function docRow(d) {
  const cu = customer(d.customerId);
  const st = docStatus(d);
  return `
  <a class="row" href="#/dokument/${d.id}">
    <div class="row-icon ${d.type === 'kv' ? 'tone-orange' : 'tone-blue'}">${icon(d.type === 'kv' ? 'quote' : 'receipt')}</div>
    <div class="row-main">
      <div class="row-title">${esc(d.number)} · ${esc(d.title || 'Ohne Titel')}</div>
      <div class="row-sub">${esc(cu ? cu.name : (String(d.recipient || '').split('\n')[0] || 'Kein Kunde'))} · ${fmtDate(d.date)}</div>
    </div>
    <div class="row-end">${euro(totals(d).gross)}<small>${badge(st, STATUS_LABEL[st])}</small></div>
  </a>`;
}

function contractRow(k) {
  return `
  <a class="row" href="#/vertrag/${k.id}">
    <div class="row-icon tone-violet">${icon('contract')}</div>
    <div class="row-main">
      <div class="row-title">${esc(k.name)}</div>
      <div class="row-sub">${esc(CONTRACT_TYPES[k.type]?.label || 'Vertrag')} · ${fmtDate((k.form?.date) || k.createdAt.slice(0, 10))}</div>
    </div>
    ${icon('right', 'chev')}
  </a>`;
}

function newAnySheet() {
  const item = (act, ico, tone, label, sub) => `
    <button class="type-card" data-act="${act}"><div class="row-icon tone-${tone}">${icon(ico)}</div><div><strong>${label}</strong><small>${sub}</small></div></button>`;
  openSheet({
    title: 'Was möchtest du erstellen?',
    body: `<div class="type-cards">
      ${item('kv', 'quote', 'orange', 'Kostenvoranschlag', 'Angebot mit Positionen, MwSt. und Rabatt')}
      ${item('re', 'receipt', 'blue', 'Rechnung', 'Inkl. PDF und E-Rechnung (XRechnung)')}
      ${item('vertrag', 'contract', 'violet', 'Vertrag', 'Arbeits-, Subunternehmer- oder Bauvertrag')}
      ${item('termin', 'calendar', 'green', 'Termin', 'Im Wochenkalender eintragen')}
      ${item('baustelle', 'hat', 'yellow', 'Baustelle', 'Mit Fotos, Sprachnachrichten und Mängeln')}
      ${item('kunde', 'users', 'blue', 'Kunde', 'Auftraggeber anlegen')}
    </div>`,
    acts: {
      kv: (b, e, s) => { s.close(); createDoc('kv'); },
      re: (b, e, s) => { s.close(); createDoc('re'); },
      vertrag: (b, e, s) => { s.close(); contractSheet(); },
      termin: (b, e, s) => { s.close(); eventSheet(); },
      baustelle: (b, e, s) => { s.close(); siteSheet(); },
      kunde: (b, e, s) => { s.close(); customerSheet(); },
    },
  });
}

function moreSheet() {
  const items = NAV.filter((n) => !TAB_ROUTES.includes(n.r));
  openSheet({
    title: 'Mehr',
    body: `<div class="more-grid">${items.map((n) => `<a class="more-item" href="#/${n.r}" data-act="close"><div class="stat-icon tone-${n.tone}">${icon(n.i)}</div>${n.l}</a>`).join('')}</div>`,
  });
}

// =====================================================================
// Dokumente (Kostenvoranschläge & Rechnungen)
// =====================================================================
let docFilter = 'alle';
let uploadKind = 'Kostenvoranschlag';

VIEWS.dokumente = () => {
  const list = state.docs.filter((d) => docFilter === 'alle' || d.type === docFilter).sort(byUpdated);
  const uploads = state.uploads.filter((u) => ['Kostenvoranschlag', 'Rechnung'].includes(u.kind)).sort(byUpdated);
  return `
  ${pageHead('Dokumente', 'Kostenvoranschläge und Rechnungen', `
    <button class="btn" data-action="doc-new" data-type="kv">${icon('plus')}Kostenvoranschlag</button>
    <button class="btn primary" data-action="doc-new" data-type="re">${icon('plus')}Rechnung</button>`)}
  <div class="chips">
    ${[['alle', 'Alle'], ['kv', 'Kostenvoranschläge'], ['re', 'Rechnungen']].map(([k, l]) => `<button class="chip ${docFilter === k ? 'active' : ''}" data-action="doc-filter" data-f="${k}">${l}</button>`).join('')}
  </div>
  <div class="card">
    ${list.length ? `<div class="list">${list.map(docRow).join('')}</div>`
      : empty('file', 'Noch keine Dokumente', 'Erstelle deinen ersten Kostenvoranschlag – in zwei Minuten fertig.', `<button class="btn primary" data-action="doc-new" data-type="kv">${icon('plus')}Kostenvoranschlag erstellen</button>`)}
  </div>

  <div class="section">
    <div class="section-title"><div><h2>Hochgeladene Dokumente</h2><p>Eigene Kostenvoranschläge und Rechnungen aus deiner Ablage (Fotos &amp; PDFs).</p></div></div>
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <select class="input" style="width:auto;flex:1;min-width:170px" data-action-change="upload-kind">
          ${['Kostenvoranschlag', 'Rechnung'].map((k) => `<option ${k === uploadKind ? 'selected' : ''}>${k}</option>`).join('')}
        </select>
        <label class="btn">${icon('upload')}Datei hochladen<input type="file" class="sr" accept="image/*,application/pdf" multiple data-quick-upload></label>
      </div>
      ${uploads.length ? `<div class="list">${uploads.map(uploadRow).join('')}</div>`
        : `<p class="hint" style="padding:14px 4px 4px;text-align:center">Noch nichts hochgeladen. Lade hier eigene Dateien hoch oder verschiebe sie in der Ablage.</p>`}
    </div>
  </div>`;
};

function createDoc(type, from) {
  const d = {
    id: uid(), type,
    number: nextNumber(type === 'kv' ? 'KV' : 'RE'),
    date: todayISO(), title: '', customerId: '', recipient: '',
    dueDate: '', status: type === 'kv' ? 'entwurf' : 'offen',
    vat: '19', discount: '0', serviceDate: todayISO(), serviceUntil: '',
    intro: '', closing: '', positions: [], over: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  if (from) {
    Object.assign(d, {
      title: from.title, customerId: from.customerId, recipient: from.recipient, vat: from.vat, discount: from.discount,
      positions: from.positions.map((p) => ({ ...p, id: uid() })), fromId: from.id,
    });
  }
  state.docs.push(d);
  save();
  go(`#/dokument/${d.id}`);
  return d;
}

let docEdit = false;
VIEWS.dokument = (id, main) => {
  const d = state.docs.find((x) => x.id === id);
  if (!d) return empty('file', 'Dokument nicht gefunden', 'Es wurde vielleicht gelöscht.', '<a class="btn" href="#/dokumente">Zu den Dokumenten</a>');
  main.classList.add('wide');
  const T = DOC_TYPES[d.type];
  const tplOpts = (kind) => state.templates.filter((t) => t.kind === kind);
  const tplSelect = (kind, target) => tplOpts(kind).length
    ? `<select class="input" style="min-height:36px;padding:6px 34px 6px 10px;font-size:14px;width:auto" data-tpl-insert="${target}"><option value="">Vorlage einfügen …</option>${tplOpts(kind).map((t) => `<option value="${t.id}">${esc(t.title || 'Ohne Titel')}</option>`).join('')}</select>`
    : `<a class="hint" href="#/vorlagen">Vorlagen anlegen</a>`;
  const b = (path, label, opts = {}) => field({ name: path, label, value: getPath(d, path) ?? '', ...opts, attrs: `data-bind="${path}" ${opts.attrs || ''}` });

  current.mount = () => { current.scope = { kind: 'doc', obj: d }; };

  return `
  <a class="back" href="#/dokumente">${icon('back', 'sm')}Dokumente</a>
  ${pageHead(`${d.number} · ${T.label}`, d.title || 'Ohne Titel')}
  <div class="toolbar">
    <button class="btn sm" data-action="pdf" data-kind="doc">${icon('download', 'sm')}PDF speichern</button>
    <button class="btn sm" data-action="print">${icon('printer', 'sm')}Drucken</button>
    <button class="btn sm" data-action="share" data-kind="doc">${icon('share', 'sm')}Teilen</button>
    ${d.type === 're' ? `<button class="btn sm" data-action="xml">${icon('code', 'sm')}E-Rechnung (XML)</button>` : `<button class="btn sm" data-action="kv-to-re">${icon('receipt', 'sm')}In Rechnung umwandeln</button>`}
    <button class="btn sm" data-action="doc-copy">${icon('copy', 'sm')}Duplizieren</button>
    <button class="btn sm icon danger" data-action="doc-del" aria-label="Löschen">${icon('trash', 'sm')}</button>
    <span class="grow"></span>
    <button class="btn sm primary" data-action="saved">${icon('check', 'sm')}Speichern</button>
  </div>

  <div class="editor split">
    <div>
      <div class="card">
        <div class="card-head"><h3>Kopfdaten</h3></div>
        <div class="form cols">
          ${b('number', T.label === 'Rechnung' ? 'Rechnungsnummer' : 'Angebotsnummer')}
          ${b('date', 'Datum', { type: 'date' })}
          ${b('title', 'Titel', { ph: 'Badsanierung Musterstraße', full: true })}
          <label class="field full"><span>Kunde</span>
            <select class="input" data-bind="customerId" data-after="customer">${customerOptions(d.customerId)}<option value="__new">+ Neuen Kunden anlegen …</option></select>
          </label>
          ${b('recipient', 'Empfänger (Anschrift auf dem Dokument)', { type: 'textarea', full: true, ph: 'Name\nStraße\nPLZ Ort', attrs: 'rows="3" style="min-height:84px"' })}
          ${b('dueDate', T.dueLabel, { type: 'date' })}
          ${b('status', 'Status', { type: 'select', opts: T.statuses.map((s) => [s, STATUS_LABEL[s]]) })}
          ${b('vat', 'MwSt. %', { inputmode: 'decimal' })}
          ${b('discount', 'Rabatt %', { inputmode: 'decimal' })}
          ${b('serviceDate', 'Leistungsdatum', { type: 'date' })}
          ${b('serviceUntil', 'Leistung bis', { type: 'date', hint: 'optional' })}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Texte</h3></div>
        <div class="form">
          <div class="field"><span style="display:flex;justify-content:space-between;align-items:center;gap:8px">Einleitung ${tplSelect('intro', 'intro')}</span>
            <textarea class="input" data-bind="intro" placeholder="Sehr geehrte Damen und Herren, …">${esc(d.intro)}</textarea></div>
          <div class="field"><span style="display:flex;justify-content:space-between;align-items:center;gap:8px">Schlusstext ${tplSelect('closing', 'closing')}</span>
            <textarea class="input" data-bind="closing" placeholder="Mit freundlichen Grüßen …">${esc(d.closing)}</textarea></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Positionen</h3>
          <div style="display:flex;gap:6px">
            ${tplOpts('service').length ? `<button class="btn sm" data-action="pos-tpl">${icon('layers', 'sm')}Vorlage</button>` : ''}
            <button class="btn sm" data-action="pos-add">${icon('plus', 'sm')}Position</button>
          </div>
        </div>
        <div id="pos-list">${positionsHTML(d)}</div>
        <div id="doc-totals">${totalsHTML(d)}</div>
      </div>
    </div>

    <div class="preview-col">
      <div class="preview-label"><span>Vorschau</span>
        <button class="btn sm ${docEdit ? 'on' : ''}" data-action="paper-edit">${icon(docEdit ? 'check' : 'pencil', 'sm')}${docEdit ? 'Fertig' : 'Im Dokument bearbeiten'}</button>
      </div>
      ${docEdit ? `<div class="edit-hint">${icon('pencil', 'sm')}Tippe auf einen Text im Dokument, um ihn direkt zu ändern.</div>` : ''}
      <div id="doc-preview">${docPaper(d, docEdit)}</div>
    </div>
  </div>`;
};

function positionsHTML(d) {
  if (!d.positions.length) return `<p class="hint" style="text-align:center;padding:12px">Noch keine Positionen. Füge die erste Leistung hinzu.</p>`;
  return `<div class="pos-list">${d.positions.map((p, i) => `
    <div class="pos">
      <div class="pos-top">
        <div class="pos-num">${i + 1}</div>
        <textarea class="input" rows="2" data-bind="positions.${i}.desc" placeholder="Leistung, z. B. Wände spachteln und streichen">${esc(p.desc)}</textarea>
        <div class="pos-tools">
          <button class="btn sm icon ghost" data-action="pos-up" data-i="${i}" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>${icon('up', 'sm')}</button>
          <button class="btn sm icon ghost" data-action="pos-down" data-i="${i}" aria-label="Nach unten" ${i === d.positions.length - 1 ? 'disabled' : ''}>${icon('down', 'sm')}</button>
          <button class="btn sm icon ghost danger" data-action="pos-del" data-i="${i}" aria-label="Löschen">${icon('trash', 'sm')}</button>
        </div>
      </div>
      <div class="pos-nums">
        <label class="field"><span>Menge</span><input class="input" inputmode="decimal" data-bind="positions.${i}.qty" value="${esc(p.qty)}"></label>
        <label class="field"><span>Einheit</span><select class="input" data-bind="positions.${i}.unit">${[...new Set([...UNITS, p.unit].filter(Boolean))].map((u) => `<option ${u === p.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></label>
        <label class="field"><span>Einzelpreis €</span><input class="input" inputmode="decimal" data-bind="positions.${i}.price" value="${esc(p.price)}"></label>
        <div class="pos-total" data-pos-total="${i}">${euro(num(p.qty) * num(p.price))}</div>
      </div>
    </div>`).join('')}</div>`;
}

function totalsHTML(d) {
  const t = totals(d);
  return `<div class="totals">
    <div><span>Nettosumme</span><span>${euro(t.net)}</span></div>
    ${num(d.discount) ? `<div><span>Rabatt ${esc(d.discount)} %</span><span>−${euro(t.discount)}</span></div>` : ''}
    <div><span>zzgl. ${esc(d.vat)} % MwSt.</span><span>${euro(t.vat)}</span></div>
    <div class="sum"><span>Gesamtbetrag</span><span>${euro(t.gross)}</span></div>
  </div>`;
}

function refreshDoc(d, { positions = false } = {}) {
  const v = document.getElementById('view');
  if (positions) v.querySelector('#pos-list').innerHTML = positionsHTML(d);
  else d.positions.forEach((p, i) => { const el = v.querySelector(`[data-pos-total="${i}"]`); if (el) el.textContent = euro(num(p.qty) * num(p.price)); });
  v.querySelector('#doc-totals').innerHTML = totalsHTML(d);
  const prev = v.querySelector('#doc-preview');
  if (prev && !prev.contains(document.activeElement)) prev.innerHTML = docPaper(d, docEdit);
  const sub = v.querySelector('.page-head p');
  if (sub) sub.textContent = d.title || 'Ohne Titel';
  const h1 = v.querySelector('.page-head h1');
  if (h1) h1.textContent = `${d.number} · ${DOC_TYPES[d.type].label}`;
}

// =====================================================================
// Verträge
// =====================================================================
function newContract(type, form) {
  const built = buildContract(type, form, state.company);
  const now = new Date().toISOString();
  return { id: uid(), type, name: contractName(type, form), form: { ...form }, over: {}, ...built, createdAt: now, updatedAt: now };
}

VIEWS.vertraege = () => {
  const list = [...state.contracts].sort(byUpdated);
  return `
  ${pageHead('Verträge', 'Arbeitsverträge, Nachunternehmer- und Bauverträge – fair und rechtssicher', `<button class="btn primary" data-action="contract-new">${icon('plus')}Neuer Vertrag</button>`)}
  <div class="grid three" style="margin-bottom:18px">
    ${Object.entries(CONTRACT_TYPES).map(([k, t]) => `
      <button class="type-card" data-action="contract-new" data-type="${k}" style="background:var(--surface);box-shadow:var(--shadow)">
        <div class="row-icon tone-violet">${icon(t.icon)}</div><div><strong>${t.label}</strong><small>${t.desc}</small></div>
      </button>`).join('')}
  </div>
  <div class="section-title"><h2>Meine Verträge</h2><p>${list.length} ${list.length === 1 ? 'Vertrag' : 'Verträge'}</p></div>
  <div class="card">
    ${list.length ? `<div class="list">${list.map(contractRow).join('')}</div>`
      : empty('contract', 'Noch kein Vertrag', 'Wähle oben „Neuer Vertrag“: Arbeitsvertrag für Mitarbeiter, Vertrag für Nachunternehmer oder Bauvertrag mit deinem Kunden – mit deinem Logo und deinen Firmendaten.')}
  </div>
  <p class="hint" style="margin:14px 6px 0">Hinweis: Die Vorlagen sind eine sorgfältige Grundlage, ersetzen aber keine Rechtsberatung im Einzelfall.</p>`;
};

function contractSheet(type = 'arbeit', existing = null) {
  let t = existing ? existing.type : type;
  const values = existing ? { ...existing.form } : {};
  const formHTML = () => {
    const defs = CONTRACT_TYPES[t].fields(state.company);
    return `<div class="form cols">${defs.map((f) => {
      const v = values[f.k] ?? f.def ?? '';
      const fieldHTML = field({ name: f.k, label: f.l, value: v, type: f.type || 'text', ph: f.ph || '', opts: f.opts, full: f.full || f.type === 'textarea', hint: f.hint, inputmode: f.inputmode, attrs: f.type === 'textarea' ? 'rows="3" style="min-height:84px"' : '' });
      if (f.customer && state.customers.length) {
        return `<label class="field full"><span>Aus Kunden übernehmen <em>· optional</em></span><select class="input" data-pick-customer>${customerOptions('', '— Kunde wählen —')}</select></label>${fieldHTML}`;
      }
      return fieldHTML;
    }).join('')}</div>`;
  };
  const cardsHTML = () => Object.entries(CONTRACT_TYPES).map(([k, c]) => `
    <button class="type-card ${k === t ? 'active' : ''}" data-act="type" data-type="${k}" ${existing ? 'disabled' : ''}>
      <div class="row-icon">${icon(c.icon)}</div><div><strong>${c.label}</strong><small>${c.desc}</small></div>
    </button>`).join('');
  const collect = (s) => Object.assign(values, formValues(s.q('#k-form')));
  const s = openSheet({
    title: existing ? 'Angaben ändern' : 'Neuer Vertrag',
    body: `${existing ? `<div class="edit-hint">${icon('info', 'sm')}Der Vertragstext wird mit den neuen Angaben neu erzeugt. Eigene Textänderungen gehen dabei verloren.</div>` : ''}
      <div class="type-cards" id="k-types">${existing ? '' : cardsHTML()}</div><div id="k-form">${formHTML()}</div>`,
    foot: `<button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="create">${existing ? 'Neu erzeugen' : 'Vertrag erstellen'}</button>`,
    acts: {
      type(b, e, sh) {
        collect(sh);
        t = b.dataset.type;
        sh.q('#k-types').innerHTML = cardsHTML();
        sh.q('#k-form').innerHTML = formHTML();
      },
      create(b, e, sh) {
        collect(sh);
        if (!String(values.name || '').trim()) {
          toast('Bitte den Namen des Vertragspartners eintragen.', 'error');
          sh.q('[name="name"]').focus();
          return;
        }
        const form = {};
        CONTRACT_TYPES[t].fields(state.company).forEach((f) => { form[f.k] = values[f.k] ?? ''; });
        if (existing) {
          const built = buildContract(t, form, state.company);
          Object.assign(existing, built, { form, name: contractName(t, form) });
          touch(existing);
          save();
          sh.close();
          toast('Vertrag neu erzeugt');
          render();
        } else {
          const k = newContract(t, form);
          state.contracts.push(k);
          save();
          sh.close();
          toast('Vertrag erstellt');
          go(`#/vertrag/${k.id}`);
        }
      },
    },
    onMount(sh) {
      sh.el.addEventListener('change', (e) => {
        if (!e.target.matches('[data-pick-customer]')) return;
        const cu = customer(e.target.value);
        if (!cu) return;
        sh.q('[name="name"]').value = cu.name;
        const addr = sh.q('[name="address"]');
        if (addr) addr.value = [cu.street, [cu.zip, cu.city].filter(Boolean).join(' ')].filter(Boolean).join('\n');
      });
    },
  });
  return s;
}

let contractEdit = false;
VIEWS.vertrag = (id) => {
  const k = state.contracts.find((x) => x.id === id);
  if (!k) return empty('contract', 'Vertrag nicht gefunden', 'Er wurde vielleicht gelöscht.', '<a class="btn" href="#/vertraege">Zu den Verträgen</a>');
  current.mount = () => { current.scope = { kind: 'contract', obj: k }; };
  return `
  <a class="back" href="#/vertraege">${icon('back', 'sm')}Verträge</a>
  <div class="page-head"><div style="flex:1;min-width:0">
    <div class="eyebrow">${esc(CONTRACT_TYPES[k.type]?.label || 'Vertrag')}</div>
    <h1 class="sr">${esc(k.name)}</h1>
    <textarea class="name-input" rows="2" data-bind="name" aria-label="Name des Vertrags">${esc(k.name)}</textarea>
  </div></div>
  <div class="toolbar">
    <button class="btn sm ${contractEdit ? 'on' : ''}" data-action="contract-edit">${icon(contractEdit ? 'check' : 'pencil', 'sm')}${contractEdit ? 'Fertig' : 'Bearbeiten'}</button>
    <button class="btn sm" data-action="print">${icon('printer', 'sm')}Drucken</button>
    <button class="btn sm" data-action="pdf" data-kind="contract">${icon('download', 'sm')}Als PDF speichern</button>
    <button class="btn sm" data-action="share" data-kind="contract">${icon('share', 'sm')}PDF teilen</button>
    <button class="btn sm" data-action="contract-regen">${icon('refresh', 'sm')}Angaben ändern</button>
    <button class="btn sm" data-action="contract-copy">${icon('copy', 'sm')}Duplizieren</button>
    <button class="btn sm icon danger" data-action="contract-del" aria-label="Löschen">${icon('trash', 'sm')}</button>
  </div>
  ${contractEdit ? `<div class="edit-hint">${icon('pencil', 'sm')}Jeder Text ist bearbeitbar – Titel, Parteien, Paragrafen, Ort, Datum und Unterschriften. Änderungen werden sofort gespeichert.</div>` : ''}
  <div class="preview-col" id="contract-paper">${contractPaper(k, contractEdit)}</div>`;
};

function rerenderContract(k) {
  const el = document.getElementById('contract-paper');
  if (el) el.innerHTML = contractPaper(k, contractEdit);
}

// =====================================================================
// Ablage
// =====================================================================
const KINDS = ['Kostenvoranschlag', 'Rechnung', 'Vertrag', 'Foto', 'Sonstiges'];
let ablageFilter = 'Alle';
let pending = [];

function uploadRow(u) {
  const isImg = (u.mime || '').startsWith('image/');
  return `
  <div class="row" style="cursor:default;flex-wrap:wrap">
    <div class="row-icon">${isImg ? `<img data-file="${u.id}" alt="">` : icon('file')}</div>
    <div class="row-main">
      <div class="row-title">${esc(u.name)}</div>
      <div class="row-sub">${esc(u.kind)} · ${fmtDateTime(u.createdAt)} · ${fmtBytes(u.size)}</div>
      ${u.note ? `<div class="row-sub" style="white-space:normal">${esc(u.note)}</div>` : ''}
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;width:100%;padding-left:56px">
      <select class="input" style="min-height:36px;padding:6px 34px 6px 10px;font-size:14px;width:auto" data-upload-kind="${u.id}">${KINDS.map((k) => `<option ${k === u.kind ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <button class="btn sm" data-action="file-view" data-id="${u.id}">${icon('eye', 'sm')}Ansehen</button>
      <button class="btn sm icon" data-action="file-dl" data-id="${u.id}" aria-label="Herunterladen">${icon('download', 'sm')}</button>
      <button class="btn sm icon danger" data-action="file-del" data-id="${u.id}" aria-label="Löschen">${icon('trash', 'sm')}</button>
    </div>
  </div>`;
}

VIEWS.ablage = () => {
  const list = state.uploads.filter((u) => ablageFilter === 'Alle' || u.kind === ablageFilter).sort(byUpdated);
  current.mount = (main) => setupDropzone(main);
  return `
  ${pageHead('Ablage', 'Eigene Dokumente, Fotos und PDFs privat hochladen')}
  <div class="card">
    <label class="dropzone" id="dz">
      ${icon('upload', 'lg')}
      <strong>Dateien wählen</strong>
      <span class="hint">oder hierher ziehen · Fotos und PDFs</span>
      <input type="file" class="sr" id="dz-input" accept="image/*,application/pdf" multiple>
    </label>
    <div class="file-list" id="dz-files">${pending.map((f) => `<span class="file-pill">${esc(f.name)}</span>`).join('')}</div>
    <div class="form" style="margin-top:14px">
      ${field({ name: 'up-title', label: 'Titel (optional)', ph: 'z. B. Rechnung Müller 08/2026', attrs: 'id="up-title"' })}
      ${field({ name: 'up-kind', label: 'Art', type: 'select', opts: KINDS, value: 'Sonstiges', attrs: 'id="up-kind"' })}
      ${field({ name: 'up-note', label: 'Notiz', type: 'textarea', ph: 'Kurze Beschreibung', attrs: 'id="up-note" rows="3" style="min-height:84px"' })}
      <button class="btn primary block" data-action="upload">${icon('upload')}Fotos oder PDFs hochladen</button>
      <p class="hint">Bis 50 MB pro Datei. Nur du kannst deine Dateien sehen – sie bleiben auf diesem Gerät.</p>
    </div>
  </div>
  <div class="section">
    <div class="chips">${['Alle', ...KINDS].map((k) => `<button class="chip ${ablageFilter === k ? 'active' : ''}" data-action="ablage-filter" data-f="${k}">${k}</button>`).join('')}</div>
    <div class="card">
      ${list.length ? `<div class="list">${list.map(uploadRow).join('')}</div>` : empty('folder', 'Noch nichts hochgeladen', 'Lade hier Fotos, Pläne, Angebote oder Rechnungen als Bild oder PDF hoch.')}
    </div>
  </div>`;
};

function setupDropzone(main) {
  const dz = main.querySelector('#dz');
  const input = main.querySelector('#dz-input');
  const show = () => { main.querySelector('#dz-files').innerHTML = pending.map((f) => `<span class="file-pill">${esc(f.name)} · ${fmtBytes(f.size)}</span>`).join(''); };
  input.addEventListener('change', () => { pending = [...input.files]; show(); });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', (e) => { pending = [...e.dataTransfer.files]; show(); });
}

async function storeUploads(list, { kind, title = '', note = '' }) {
  let n = 0;
  for (const f of list) {
    if (f.size > MAX_FILE) { toast(`${f.name} ist größer als 50 MB.`, 'error'); continue; }
    const id = uid();
    try {
      await files.put(id, f);
    } catch (e) {
      toast('Datei konnte nicht gespeichert werden (Speicher voll?).', 'error');
      continue;
    }
    const base = f.name.replace(/\.[^.]+$/, '');
    state.uploads.push({
      id, name: title ? (list.length > 1 ? `${title} (${n + 1})` : title) : base, fileName: f.name,
      mime: f.type, size: f.size, kind, note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    n++;
  }
  save();
  if (n) toast(n === 1 ? 'Datei hochgeladen' : `${n} Dateien hochgeladen`);
  return n;
}

async function viewFile(id, name) {
  const blob = await files.get(id);
  if (!blob) return toast('Datei nicht gefunden.', 'error');
  const url = URL.createObjectURL(blob);
  const isImg = (blob.type || '').startsWith('image/');
  const isPdf = blob.type === 'application/pdf';
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = `
    <div class="viewer-bar"><strong style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name || '')}</strong>
      <div style="display:flex;gap:8px"><a class="btn sm" href="${url}" target="_blank" rel="noopener">${icon('share', 'sm')}Öffnen</a><button class="btn sm icon" data-close aria-label="Schließen">${icon('x', 'sm')}</button></div></div>
    <div class="viewer-body">${isImg ? `<img src="${url}" alt="">` : isPdf ? `<iframe src="${url}" title="PDF"></iframe>` : `<p style="color:#fff">Vorschau nicht möglich – nutze „Öffnen“.</p>`}</div>`;
  const close = () => { v.remove(); URL.revokeObjectURL(url); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  v.querySelector('[data-close]').addEventListener('click', close);
  v.addEventListener('click', (e) => { if (e.target.classList.contains('viewer-body')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(v);
}

// =====================================================================
// Baustellen
// =====================================================================
const SITE_STATUS = ['geplant', 'aktiv', 'pausiert', 'abgeschlossen'];

VIEWS.baustellen = () => {
  const list = [...state.sites].sort((a, b) => SITE_STATUS.indexOf(a.status) === SITE_STATUS.indexOf(b.status) ? byUpdated(a, b) : (a.status === 'aktiv' ? -1 : b.status === 'aktiv' ? 1 : 0));
  return `
  ${pageHead('Baustellen', 'Fotos, Sprachnachrichten und Mängel – alles an einem Ort', `<button class="btn primary" data-action="site-new">${icon('plus')}Neue Baustelle</button>`)}
  ${list.length ? `<div class="grid two" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${list.map((s) => {
    const cu = customer(s.customerId);
    const open = (s.defects || []).filter((d) => !d.done).length;
    const cover = (s.photos || [])[0];
    return `
    <a class="card" href="#/baustelle/${s.id}" style="text-decoration:none;padding:0;overflow:hidden;margin:0">
      <div style="height:120px;background:linear-gradient(135deg,var(--surface-3),var(--accent-soft));display:grid;place-items:center;color:var(--accent)">
        ${cover ? `<img data-file="${cover.id}" alt="" style="width:100%;height:100%;object-fit:cover">` : icon('hat', 'lg')}
      </div>
      <div style="padding:16px">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">${badge(s.status, STATUS_LABEL[s.status])}${open ? `<span class="badge ueberfaellig">${open} Mängel</span>` : ''}</div>
        <h3 style="font-size:18px;margin-top:10px">${esc(s.name)}</h3>
        <div class="kv">${s.address ? `<span>${icon('pin', 'sm')}${esc(s.address)}</span>` : ''}${cu ? `<span>${icon('user', 'sm')}${esc(cu.name)}</span>` : ''}</div>
        <div class="kv" style="margin-top:8px"><span>${icon('camera', 'sm')}${(s.photos || []).length}</span><span>${icon('mic', 'sm')}${(s.voice || []).length}</span><span>${icon('alert', 'sm')}${(s.defects || []).length}</span></div>
      </div>
    </a>`;
  }).join('')}</div>`
    : `<div class="card">${empty('hat', 'Noch keine Baustellen', 'Lege deine erste Baustelle an und dokumentiere sie mit Fotos und Sprachnachrichten.', `<button class="btn primary" data-action="site-new">${icon('plus')}Baustelle anlegen</button>`)}</div>`}`;
};

function siteSheet(s = null) {
  const v = s || { status: 'aktiv', start: todayISO() };
  openSheet({
    title: s ? 'Baustelle bearbeiten' : 'Neue Baustelle',
    body: `<div class="form cols" id="site-form">
      ${field({ name: 'name', label: 'Name', value: v.name, ph: 'z. B. Fassade Zentgrafenstraße', full: true, attrs: 'autofocus' })}
      ${field({ name: 'address', label: 'Anschrift', value: v.address, ph: 'Straße, PLZ Ort', full: true })}
      <label class="field full"><span>Kunde</span><select class="input" name="customerId">${customerOptions(v.customerId)}</select></label>
      ${field({ name: 'status', label: 'Status', type: 'select', value: v.status, opts: SITE_STATUS.map((x) => [x, STATUS_LABEL[x]]), full: true })}
      ${field({ name: 'start', label: 'Beginn', type: 'date', value: v.start })}
      ${field({ name: 'end', label: 'Ende', type: 'date', value: v.end })}
      ${field({ name: 'note', label: 'Notiz', type: 'textarea', value: v.note, ph: 'Zugang, Ansprechpartner, Besonderheiten …', full: true })}
    </div>`,
    foot: `<button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="save">Speichern</button>`,
    acts: {
      save(b, e, sh) {
        const f = formValues(sh.q('#site-form'));
        if (!f.name.trim()) return toast('Bitte einen Namen eintragen.', 'error');
        if (s) { Object.assign(s, f); touch(s); } else {
          const n = { id: uid(), ...f, photos: [], voice: [], defects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          state.sites.push(n);
          sh.close(); save(); toast('Baustelle angelegt');
          return go(`#/baustelle/${n.id}`);
        }
        save(); sh.close(); toast('Gespeichert'); render();
      },
    },
  });
}

let recorder = null;
VIEWS.baustelle = (id) => {
  const s = site(id);
  if (!s) return empty('hat', 'Baustelle nicht gefunden', 'Sie wurde vielleicht gelöscht.', '<a class="btn" href="#/baustellen">Zu den Baustellen</a>');
  const cu = customer(s.customerId);
  const evs = state.events.filter((e) => e.siteId === s.id).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  current.mount = () => { current.scope = { kind: 'site', obj: s }; };
  current.cleanup = (next) => { if (recorder && recorder.state === 'recording' && (next.name !== 'baustelle' || next.id !== s.id)) recorder.stop(); };
  return `
  <a class="back" href="#/baustellen">${icon('back', 'sm')}Baustellen</a>
  ${pageHead(s.name, [s.address, cu?.name].filter(Boolean).join(' · '), `
    ${s.address ? `<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">${icon('pin')}Karte</a>` : ''}
    <button class="btn" data-action="site-edit">${icon('pencil')}Bearbeiten</button>
    <button class="btn icon danger" data-action="site-del" aria-label="Löschen">${icon('trash')}</button>`)}
  <div class="grid two" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:16px">
    <label class="field"><span>Status</span><select class="input" data-bind="status" data-after="render">${SITE_STATUS.map((x) => `<option value="${x}" ${x === s.status ? 'selected' : ''}>${STATUS_LABEL[x]}</option>`).join('')}</select></label>
    <div class="field"><span>Zeitraum</span><div class="input" style="display:flex;align-items:center">${s.start ? fmtDate(s.start) : '–'}${s.end ? ` – ${fmtDate(s.end)}` : ''}</div></div>
  </div>

  <div class="card">
    <div class="card-head"><div><h3>Fotos</h3><p>${(s.photos || []).length} Fotos</p></div>
      <label class="btn sm primary">${icon('camera', 'sm')}Foto hinzufügen<input type="file" class="sr" accept="image/*" multiple data-site-photo></label></div>
    ${(s.photos || []).length ? `<div class="thumbs">${s.photos.map((p) => `<button class="thumb" data-action="photo-view" data-id="${p.id}"><img data-file="${p.id}" alt=""></button>`).join('')}</div>` : '<p class="hint">Noch keine Fotos. Mit dem Handy direkt die Kamera nutzen.</p>'}
  </div>

  <div class="card">
    <div class="card-head"><div><h3>Sprachnachrichten</h3><p>Schnell etwas festhalten, statt zu tippen</p></div>
      <button class="btn sm ${recorder && recorder.state === 'recording' ? 'danger' : 'primary'}" data-action="rec" id="rec-btn">${recorder && recorder.state === 'recording' ? `<span class="rec-dot"></span>Stopp` : `${icon('mic', 'sm')}Aufnehmen`}</button></div>
    ${(s.voice || []).length ? s.voice.map((v) => `
      <div class="audio-row">
        <audio controls preload="none" data-audio="${v.id}"></audio>
        <span class="hint">${fmtDateTime(v.createdAt)}</span>
        <button class="btn sm icon ghost danger" data-action="voice-del" data-id="${v.id}" aria-label="Löschen">${icon('trash', 'sm')}</button>
      </div>`).join('') : '<p class="hint">Noch keine Sprachnachrichten.</p>'}
  </div>

  <div class="card">
    <div class="card-head"><div><h3>Mängel</h3><p>${(s.defects || []).filter((d) => !d.done).length} offen</p></div></div>
    <div style="display:flex;gap:8px;margin-bottom:6px">
      <input class="input" id="defect-title" placeholder="Neuer Mangel, z. B. Riss im Putz Wohnzimmer">
      <button class="btn primary icon" data-action="defect-add" aria-label="Mangel hinzufügen">${icon('plus')}</button>
    </div>
    ${(s.defects || []).map((d) => `
      <div class="defect ${d.done ? 'done' : ''}">
        <input type="checkbox" style="width:22px;height:22px;accent-color:var(--ok);margin-top:2px" data-defect-done="${d.id}" ${d.done ? 'checked' : ''} aria-label="Erledigt">
        <div class="row-main">
          <div class="row-title" style="white-space:normal">${esc(d.title)}</div>
          <div class="row-sub">${fmtDate(d.createdAt.slice(0, 10))}${d.done ? ' · erledigt' : ''}</div>
          ${d.photoId ? `<button class="thumb" style="width:90px;margin-top:8px" data-action="photo-view" data-id="${d.photoId}"><img data-file="${d.photoId}" alt=""></button>` : ''}
        </div>
        <label class="btn sm icon ghost" aria-label="Foto zum Mangel">${icon('camera', 'sm')}<input type="file" class="sr" accept="image/*" data-defect-photo="${d.id}"></label>
        <button class="btn sm icon ghost danger" data-action="defect-del" data-id="${d.id}" aria-label="Löschen">${icon('trash', 'sm')}</button>
      </div>`).join('')}
  </div>

  <div class="card">
    <div class="card-head"><h3>Notizen</h3></div>
    <textarea class="input" data-bind="note" rows="5" placeholder="Bautagebuch, Absprachen, Material …">${esc(s.note || '')}</textarea>
  </div>

  <div class="card">
    <div class="card-head"><h3>Termine</h3><button class="btn sm" data-action="event-new" data-site="${s.id}">${icon('plus', 'sm')}Termin</button></div>
    ${evs.length ? `<div class="list">${evs.map(eventRow).join('')}</div>` : '<p class="hint">Keine Termine für diese Baustelle.</p>'}
  </div>`;
};

async function hydrateAudio(root) {
  for (const a of root.querySelectorAll('audio[data-audio]')) {
    const url = await fileURL(a.dataset.audio);
    if (url) a.src = url;
  }
}

async function toggleRecording(s) {
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast('Aufnahme wird von diesem Browser nicht unterstützt.', 'error');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast('Kein Zugriff auf das Mikrofon.', 'error'); }
  const chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    const id = uid();
    await files.put(id, blob);
    (s.voice ||= []).push({ id, createdAt: new Date().toISOString() });
    touch(s); save();
    recorder = null;
    toast('Sprachnachricht gespeichert');
    if (route().id === s.id) render();
  };
  recorder.start();
  render();
}

// =====================================================================
// Kunden
// =====================================================================
let custQuery = '';
VIEWS.kunden = () => {
  const q = custQuery.toLowerCase();
  const list = state.customers.filter((c) => !q || `${c.name} ${c.no} ${c.city} ${c.street}`.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return `
  ${pageHead('Kunden', 'Deine Auftraggeber', `<button class="btn primary" data-action="customer-new">${icon('plus')}Neuer Kunde</button>`)}
  ${state.customers.length > 4 ? `<input class="input" style="margin-bottom:14px" placeholder="Kunden suchen …" value="${esc(custQuery)}" data-search="customers">` : ''}
  ${list.length ? `<div class="grid two" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${list.map((c) => {
    const docs = state.docs.filter((d) => d.customerId === c.id).length;
    return `
    <div class="card" style="margin:0">
      ${c.no ? `<div class="eyebrow" style="margin-bottom:4px">Nr. ${esc(c.no)}</div>` : ''}
      <h3 style="font-size:18px">${esc(c.name)}</h3>
      ${c.contact ? `<div class="row-sub">${esc(c.contact)}</div>` : ''}
      <div class="kv">
        ${c.street || c.city ? `<span>${icon('pin', 'sm')}${esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(' · '))}</span>` : ''}
        ${c.phone ? `<a href="tel:${esc(c.phone.replace(/\s+/g, ''))}" style="text-decoration:none"><span>${icon('phone', 'sm')}${esc(c.phone)}</span></a>` : ''}
        ${c.email ? `<a href="mailto:${esc(c.email)}" style="text-decoration:none"><span>${icon('mail', 'sm')}${esc(c.email)}</span></a>` : ''}
        ${docs ? `<span>${icon('file', 'sm')}${docs} Dokumente</span>` : ''}
      </div>
      <div class="cust-actions">
        <button class="btn sm" data-action="customer-edit" data-id="${c.id}">${icon('pencil', 'sm')}Bearbeiten</button>
        <button class="btn sm ghost danger" data-action="customer-del" data-id="${c.id}">Löschen</button>
      </div>
    </div>`;
  }).join('')}</div>`
    : `<div class="card">${empty('users', state.customers.length ? 'Kein Treffer' : 'Noch keine Kunden angelegt.', state.customers.length ? 'Versuche einen anderen Suchbegriff.' : 'Lege Auftraggeber einmal an und wähle sie in Angeboten, Rechnungen und Verträgen aus.')}</div>`}`;
};

function customerSheet(c = null, onSaved) {
  const v = c || {};
  openSheet({
    title: c ? 'Kunde bearbeiten' : 'Neuer Kunde',
    body: `<div class="form cols" id="cust-form">
      ${field({ name: 'name', label: 'Name / Firma', value: v.name, full: true, attrs: 'autofocus' })}
      ${field({ name: 'no', label: 'Kundennummer', value: v.no, ph: 'optional' })}
      ${field({ name: 'contact', label: 'Ansprechpartner', value: v.contact, ph: 'optional' })}
      ${field({ name: 'street', label: 'Straße', value: v.street, full: true })}
      ${field({ name: 'zip', label: 'PLZ', value: v.zip, inputmode: 'numeric' })}
      ${field({ name: 'city', label: 'Ort', value: v.city })}
      ${field({ name: 'phone', label: 'Telefon', value: v.phone, type: 'tel' })}
      ${field({ name: 'email', label: 'E-Mail', value: v.email, type: 'email' })}
      ${field({ name: 'note', label: 'Notiz', value: v.note, type: 'textarea', full: true })}
    </div>`,
    foot: `<button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="save">Speichern</button>`,
    acts: {
      save(b, e, sh) {
        const f = formValues(sh.q('#cust-form'));
        if (!f.name.trim()) return toast('Bitte einen Namen eintragen.', 'error');
        let saved = c;
        if (c) { Object.assign(c, f); touch(c); } else { saved = { id: uid(), ...f, createdAt: new Date().toISOString() }; state.customers.push(saved); }
        save(); sh.close(); toast('Kunde gespeichert');
        if (onSaved) onSaved(saved); else render();
      },
    },
  });
}

// =====================================================================
// Termine (Wochenkalender)
// =====================================================================
const H_START = 6;
const H_END = 21;
const COLORS = ['', 'ev-blue', 'ev-green', 'ev-violet', 'ev-red', 'ev-ink'];
let weekOffset = 0;

const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const toTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function weekDays() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  return [...Array(7)].map((_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}
function kw(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
}

VIEWS.termine = () => {
  const days = weekDays();
  const today = todayISO();
  const range = `${days[0].getDate()}.${days[0].getMonth() !== days[6].getMonth() ? ` ${days[0].toLocaleDateString('de-DE', { month: 'short' })}` : ''} – ${days[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const isos = days.map(isoOf);
  const weekEvents = state.events.filter((e) => isos.includes(e.date)).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  current.mount = (main) => setupCalendar(main);
  return `
  ${pageHead('Terminkalender', 'Woche im Blick – mit dem Finger ziehen, eintragen und verschieben', `<button class="btn primary" data-action="event-new">${icon('plus')}Neuer Termin</button>`)}
  <div class="cal-nav">
    <button class="btn icon" data-action="week" data-d="-1" aria-label="Vorherige Woche">${icon('left')}</button>
    <h3>KW ${kw(days[0])} · ${range}</h3>
    <button class="btn icon" data-action="week" data-d="1" aria-label="Nächste Woche">${icon('right')}</button>
    ${weekOffset ? `<button class="btn sm" data-action="week" data-d="0">Heute</button>` : ''}
  </div>
  <div class="cal" id="cal">
    <div class="cal-days"><div></div>${days.map((d) => `<div class="cal-day ${isoOf(d) === today ? 'today' : ''}">${d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')}<b>${d.getDate()}</b></div>`).join('')}</div>
    <div class="cal-scroll" id="cal-scroll">
      <div class="cal-body">
        <div class="cal-times">${[...Array(H_END - H_START)].map((_, i) => `<div>${i ? `${pad(H_START + i)}:00` : ''}</div>`).join('')}</div>
        ${isos.map((iso) => `<div class="cal-col ${iso === today ? 'today' : ''}" data-date="${iso}" style="height:calc(var(--hour) * ${H_END - H_START})">
          ${state.events.filter((e) => e.date === iso).map(evBlock).join('')}
        </div>`).join('')}
      </div>
    </div>
  </div>
  <p class="hint" style="margin:10px 4px 0">Tippe auf eine freie Stelle, um einen Termin einzutragen. Termine lassen sich mit dem Finger verschieben, unten am Rand in der Länge ändern.</p>
  <div class="section">
    <div class="section-title"><h2>Diese Woche</h2><p>${weekEvents.length} Termine</p></div>
    <div class="card">${weekEvents.length ? `<div class="list">${weekEvents.map(eventRow).join('')}</div>` : '<p class="hint" style="text-align:center;padding:10px">Keine Termine in dieser Woche.</p>'}</div>
  </div>`;
};

function evBlock(e) {
  const top = Math.max(0, toMin(e.start) - H_START * 60);
  const h = Math.max(20, toMin(e.end) - toMin(e.start));
  const s = site(e.siteId);
  return `<div class="cal-ev ${e.color || ''}" data-ev="${e.id}" style="top:calc(var(--hour) * ${top / 60});height:calc(var(--hour) * ${h / 60})">
    ${esc(e.title || 'Termin')}<small>${esc(e.start)}–${esc(e.end)}${s ? ` · ${esc(s.name)}` : ''}</small><span class="rs" data-rs></span></div>`;
}

function setupCalendar(main) {
  const sc = main.querySelector('#cal-scroll');
  const cal = main.querySelector('#cal');
  const hourPx = () => parseFloat(getComputedStyle(cal).getPropertyValue('--hour')) || 52;
  sc.scrollTop = hourPx() * (7 - H_START);
  const todayCol = main.querySelector('.cal-col.today');
  const nowLine = () => {
    if (!todayCol) return;
    const m = new Date().getHours() * 60 + new Date().getMinutes() - H_START * 60;
    let line = todayCol.querySelector('.cal-now');
    if (m < 0 || m > (H_END - H_START) * 60) { line?.remove(); return; }
    if (!line) { line = document.createElement('div'); line.className = 'cal-now'; todayCol.appendChild(line); }
    line.style.top = `${(m / 60) * hourPx()}px`;
  };
  nowLine();
  const tick = setInterval(nowLine, 60000);
  current.cleanup = () => clearInterval(tick);

  const snap = (min) => Math.round(min / 15) * 15;
  const minAt = (col, y) => snap(H_START * 60 + ((y - col.getBoundingClientRect().top) / hourPx()) * 60);
  const colAt = (x, y) => document.elementsFromPoint(x, y).find((el) => el.classList?.contains('cal-col'));

  let drag = null;
  sc.addEventListener('pointerdown', (e) => {
    const evEl = e.target.closest('.cal-ev');
    const col = e.target.closest('.cal-col');
    if (!col) return;
    if (evEl) {
      const ev = state.events.find((x) => x.id === evEl.dataset.ev);
      drag = { mode: e.target.closest('[data-rs]') ? 'resize' : 'move', ev, el: evEl, x0: e.clientX, y0: e.clientY, start: toMin(ev.start), end: toMin(ev.end), date: ev.date, moved: false, grab: minAt(col, e.clientY) - toMin(ev.start) };
      evEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    } else if (e.pointerType === 'mouse') {
      const m = minAt(col, e.clientY);
      const sel = document.createElement('div');
      sel.className = 'cal-sel';
      col.appendChild(sel);
      drag = { mode: 'create', col, a: m, b: m + 60, sel, x0: e.clientX, y0: e.clientY, moved: false };
      col.setPointerCapture(e.pointerId);
      paintSel();
    } else {
      drag = { mode: 'tap', col, x0: e.clientX, y0: e.clientY, y: e.clientY, moved: false };
    }
  });
  const paintSel = () => {
    const a = Math.min(drag.a, drag.b);
    const b = Math.max(drag.a, drag.b);
    drag.sel.style.top = `${((a - H_START * 60) / 60) * hourPx()}px`;
    drag.sel.style.height = `${((b - a) / 60) * hourPx()}px`;
  };
  sc.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 6) drag.moved = true;
    if (drag.mode === 'tap') return;
    if (drag.mode === 'create') {
      drag.b = Math.max(drag.a + 15, minAt(drag.col, e.clientY));
      return paintSel();
    }
    if (!drag.moved) return;
    drag.el.classList.add('dragging');
    const col = colAt(e.clientX, e.clientY) || drag.el.parentElement;
    if (drag.mode === 'move') {
      const len = drag.end - drag.start;
      let s = minAt(col, e.clientY) - drag.grab;
      s = Math.max(H_START * 60, Math.min(H_END * 60 - len, snap(s)));
      drag.nStart = s; drag.nEnd = s + len; drag.nDate = col.dataset.date;
      if (col !== drag.el.parentElement) col.appendChild(drag.el);
    } else {
      const e2 = Math.max(drag.start + 15, Math.min(H_END * 60, minAt(drag.el.parentElement, e.clientY)));
      drag.nStart = drag.start; drag.nEnd = e2; drag.nDate = drag.date;
    }
    drag.el.style.top = `${((drag.nStart - H_START * 60) / 60) * hourPx()}px`;
    drag.el.style.height = `${((drag.nEnd - drag.nStart) / 60) * hourPx()}px`;
    drag.el.querySelector('small').textContent = `${toTime(drag.nStart)}–${toTime(drag.nEnd)}`;
  });
  const end = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.mode === 'tap') {
      if (!d.moved && e.type === 'pointerup') {
        const m = Math.max(H_START * 60, Math.min(H_END * 60 - 60, Math.floor(minAt(d.col, d.y) / 30) * 30));
        eventSheet(null, { date: d.col.dataset.date, start: toTime(m), end: toTime(m + 60) });
      }
      return;
    }
    if (d.mode === 'create') {
      d.sel.remove();
      if (e.type !== 'pointerup') return;
      const a = Math.min(d.a, d.b);
      const b = Math.max(d.a, d.b);
      const s = Math.max(H_START * 60, a);
      eventSheet(null, { date: d.col.dataset.date, start: toTime(s), end: toTime(Math.min(H_END * 60, Math.max(b, s + 30))) });
      return;
    }
    d.el.classList.remove('dragging');
    if (!d.moved) { eventSheet(d.ev); return; }
    if (d.nStart != null) {
      Object.assign(d.ev, { date: d.nDate, start: toTime(d.nStart), end: toTime(d.nEnd) });
      touch(d.ev); save();
      toast('Termin verschoben');
      render();
    }
  };
  sc.addEventListener('pointerup', end);
  sc.addEventListener('pointercancel', end);
}

function eventSheet(ev = null, preset = {}) {
  const v = ev || { date: todayISO(), start: '08:00', end: '09:00', color: '', ...preset };
  let color = v.color || '';
  const sw = () => COLORS.map((c) => `<button type="button" class="swatch cal-ev ${c} ${c === color ? 'active' : ''}" style="position:static" data-act="color" data-c="${c}" aria-label="Farbe"></button>`).join('');
  openSheet({
    title: ev ? 'Termin bearbeiten' : 'Neuer Termin',
    body: `<div class="form cols" id="ev-form">
      ${field({ name: 'title', label: 'Titel', value: v.title, ph: 'z. B. Aufmaß, Abnahme, Materiallieferung', full: true, attrs: 'autofocus' })}
      ${field({ name: 'date', label: 'Datum', type: 'date', value: v.date, full: true })}
      ${field({ name: 'start', label: 'Beginn', type: 'time', value: v.start, attrs: 'step="900"' })}
      ${field({ name: 'end', label: 'Ende', type: 'time', value: v.end, attrs: 'step="900"' })}
      <label class="field full"><span>Baustelle</span><select class="input" name="siteId"><option value="">Keine Baustelle</option>${state.sites.map((s) => `<option value="${s.id}" ${s.id === v.siteId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      ${field({ name: 'note', label: 'Notiz', type: 'textarea', value: v.note, full: true })}
      <div class="field full"><span>Farbe</span><div class="swatches" id="ev-sw">${sw()}</div></div>
    </div>`,
    foot: `${ev ? `<button class="btn danger" data-act="del">${icon('trash', 'sm')}</button>` : ''}<button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="save">Speichern</button>`,
    acts: {
      color(b, e, sh) { color = b.dataset.c; sh.q('#ev-sw').innerHTML = sw(); },
      save(b, e, sh) {
        const f = formValues(sh.q('#ev-form'));
        if (!f.date || !f.start) return toast('Bitte Datum und Beginn angeben.', 'error');
        if (!f.end || toMin(f.end) <= toMin(f.start)) f.end = toTime(Math.min(23 * 60 + 45, toMin(f.start) + 60));
        if (ev) { Object.assign(ev, f, { color }); touch(ev); } else state.events.push({ id: uid(), ...f, color, createdAt: new Date().toISOString() });
        save(); sh.close(); toast('Termin gespeichert');
        if (route().name === 'termine') {
          const days = weekDays().map(isoOf);
          if (!days.includes(f.date)) {
            const now = new Date();
            const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
            weekOffset = Math.floor((new Date(`${f.date}T00:00:00`) - monday) / (7 * 86400000));
          }
        }
        render();
      },
      async del(b, e, sh) {
        if (!(await confirmDialog('Termin wirklich löschen?'))) return;
        state.events = state.events.filter((x) => x.id !== ev.id);
        save(); sh.close(); toast('Termin gelöscht'); render();
      },
    },
  });
}

// =====================================================================
// Textvorlagen
// =====================================================================
const TPL_KINDS = { intro: 'Einleitungstexte', closing: 'Schlusstexte', service: 'Leistungsbeschreibungen' };
const TPL_EXAMPLES = [
  { kind: 'intro', title: 'Angebot Standard', text: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für die geplanten Arbeiten.' },
  { kind: 'intro', title: 'Rechnung Standard', text: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag. Wir stellen Ihnen die ausgeführten Leistungen wie folgt in Rechnung.' },
  { kind: 'closing', title: 'Zahlungsziel 14 Tage', text: 'Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen ohne Abzug auf das unten angegebene Konto.\n\nMit freundlichen Grüßen' },
  { kind: 'closing', title: 'Angebot Gültigkeit', text: 'Dieses Angebot ist 30 Tage gültig. Über Ihren Auftrag freuen wir uns.\n\nMit freundlichen Grüßen' },
  { kind: 'service', title: 'Malerarbeiten', text: 'Wände und Decken spachteln, grundieren und zweifach in Wunschfarbe streichen. Inkl. Abdeck- und Schutzarbeiten.', unit: 'm²', price: '' },
  { kind: 'service', title: 'Trockenbauwand', text: 'Ständerwand aus Metallprofilen erstellen, beidseitig mit Gipskartonplatten beplanken, inkl. Dämmung und Spachtelung Q2.', unit: 'm²', price: '' },
  { kind: 'service', title: 'Innenputz', text: 'Untergrund vorbereiten, Kalkzementputz maschinell auftragen und filzen. Inkl. Eckschutzschienen.', unit: 'm²', price: '' },
];

VIEWS.vorlagen = () => {
  const groups = Object.entries(TPL_KINDS).map(([k, label]) => ({ k, label, items: state.templates.filter((t) => t.kind === k) }));
  return `
  ${pageHead('Textvorlagen', 'Einmal schreiben, immer wieder einsetzen', `<button class="btn" data-action="tpl-examples">${icon('sparkle')}Beispiele laden</button>`)}
  <div class="card">
    <div class="card-head"><h3>Neue Vorlage</h3></div>
    <div class="form" id="tpl-form">
      ${field({ name: 'kind', label: 'Art', type: 'select', opts: Object.entries(TPL_KINDS) })}
      ${field({ name: 'title', label: 'Titel', ph: 'z. B. Angebot Standard' })}
      ${field({ name: 'text', label: 'Text', type: 'textarea', attrs: 'rows="5"' })}
      <div><button class="btn primary" data-action="tpl-add">${icon('save')}Vorlage speichern</button></div>
    </div>
  </div>
  ${state.templates.length ? groups.filter((g) => g.items.length).map((g) => `
    <div class="card">
      <div class="card-head"><h3>${g.label}</h3><span class="hint">${g.items.length}</span></div>
      ${g.items.map((t) => `
        <div class="tpl" data-tpl="${t.id}">
          <div class="tpl-top">
            <input class="input" data-tpl-field="title" value="${esc(t.title)}" aria-label="Titel">
            <button class="btn icon ghost danger" data-action="tpl-del" data-id="${t.id}" aria-label="Löschen">${icon('trash', 'sm')}</button>
          </div>
          <textarea class="input" data-tpl-field="text" rows="3">${esc(t.text)}</textarea>
          ${t.kind === 'service' ? `<div class="form cols">
            <label class="field"><span>Einheit</span><select class="input" data-tpl-field="unit">${UNITS.map((u) => `<option ${u === t.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
            <label class="field"><span>Einzelpreis €</span><input class="input" inputmode="decimal" data-tpl-field="price" value="${esc(t.price || '')}"></label>
          </div>` : ''}
        </div>`).join('')}
    </div>`).join('')
    : `<div class="card">${empty('layers', 'Noch keine Vorlagen', 'Lade die Beispiele oder schreibe deine eigenen Texte.')}</div>`}`;
};

// =====================================================================
// Firma
// =====================================================================
VIEWS.firma = () => {
  const c = state.company;
  const b = (k, label, opts = {}) => field({ name: k, label, value: c[k] ?? '', ...opts, attrs: `data-bind="${k}"` });
  const sizeLabel = (v) => (v < 20 ? 'Sehr klein' : v < 40 ? 'Klein' : v < 60 ? 'Mittel' : v < 80 ? 'Groß' : 'Sehr groß');
  let theme = 'system';
  try { theme = localStorage.getItem('baulot-theme') || 'system'; } catch (e) { /* privat */ }
  const acc = account();
  current.mount = () => { current.scope = { kind: 'company', obj: c }; };
  return `
  ${pageHead('Firma', 'Diese Daten erscheinen auf Angeboten, Rechnungen und Verträgen', `<button class="btn primary" data-action="saved">${icon('check')}Speichern</button>`)}
  <div class="card">
    <div class="card-head"><h3>Logo</h3></div>
    <div class="logo-box"><img id="logo-prev" src="${esc(c.logo || DEFAULT_LOGO)}" alt="Logo" style="height:${logoHeight(c.logoSize)}px;${c.logoHidden ? 'opacity:.3' : ''}"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <label class="btn">${icon('image')}Logo hochladen<input type="file" class="sr" accept="image/*" data-logo></label>
      ${c.logo ? `<button class="btn ghost" data-action="logo-reset">Standardlogo</button>` : ''}
      <label class="check" style="margin-left:auto"><input type="checkbox" data-logo-hidden ${c.logoHidden ? 'checked' : ''}>Logo ausblenden</label>
    </div>
    <div class="field" style="margin-top:16px">
      <span style="display:flex;justify-content:space-between">Größe auf Dokumenten <b id="logo-size-label" style="color:var(--accent)">${sizeLabel(c.logoSize)}</b></span>
      <input type="range" min="0" max="100" value="${c.logoSize}" data-logo-size>
      <div class="range-labels"><span>Sehr klein</span><span>Sehr groß</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><h3>Stammdaten</h3></div>
    <div class="form cols">
      ${b('name', 'Firmenname', { full: true })}
      ${b('owner', 'Inhaber')}
      ${b('phone', 'Telefon', { type: 'tel' })}
      ${b('street', 'Straße', { full: true })}
      ${b('zip', 'PLZ', { inputmode: 'numeric' })}
      ${b('city', 'Ort')}
      ${b('email', 'E-Mail', { type: 'email' })}
      ${b('web', 'Webseite')}
      ${b('taxNo', 'Steuernummer')}
      ${b('vatId', 'USt-IdNr.')}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><h3>Bankverbindung</h3></div>
    <div class="form cols">
      ${b('bank', 'Bank / Kontoinhaber', { full: true, ph: 'z. B. Kasseler Sparkasse' })}
      ${b('iban', 'IBAN', { full: true })}
      ${b('bic', 'BIC')}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><h3>Fußzeile</h3></div>
    ${field({ name: 'footer', label: 'Text unter Angeboten und Rechnungen', type: 'textarea', value: c.footer, ph: 'z. B. Vielen Dank für Ihr Vertrauen.', attrs: 'data-bind="footer"' })}
  </div>
  <div class="card">
    <div class="card-head"><h3>Darstellung</h3></div>
    <div class="chips" style="margin:0">
      ${[['system', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="chip ${theme === k ? 'active' : ''}" data-action="theme" data-t="${k}">${l}</button>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h3>Datensicherung</h3><p>Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig – oder übertrage sie so auf ein anderes Gerät.</p></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" data-action="export">${icon('download')}Sicherung speichern</button>
      <label class="btn">${icon('upload')}Sicherung laden<input type="file" class="sr" accept="application/json,.json" data-import></label>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div><h3>Konto</h3><p>${esc(acc?.email || '')}</p></div></div>
    <button class="btn" data-action="logout">${icon('logout')}Abmelden</button>
  </div>
  <p class="hint" style="text-align:center;margin-top:20px">Baulot · Büro-App für ${esc(c.name)}</p>`;
};

async function resizeImage(file, max = 700) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale);
    cv.height = Math.round(img.height * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

const blobToDataURL = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

async function exportData() {
  toast('Sicherung wird erstellt …');
  const all = await files.all();
  const out = {};
  for (const [id, blob] of Object.entries(all)) out[id] = await blobToDataURL(blob);
  const json = JSON.stringify({ app: 'baulot', version: 1, exportedAt: new Date().toISOString(), data: state, files: out });
  download(new Blob([json], { type: 'application/json' }), `Baulot-Sicherung-${todayISO()}.json`);
}

async function importData(file) {
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch (e) { return toast('Die Datei ist keine gültige Sicherung.', 'error'); }
  if (parsed?.app !== 'baulot' || !parsed.data) return toast('Die Datei ist keine Baulot-Sicherung.', 'error');
  if (!(await confirmDialog('Alle aktuellen Daten auf diesem Gerät werden durch die Sicherung ersetzt.', { ok: 'Sicherung laden', title: 'Sicherung laden?' }))) return;
  for (const [id, dataURL] of Object.entries(parsed.files || {})) {
    const blob = await (await fetch(dataURL)).blob();
    await files.put(id, blob);
  }
  replaceAll(parsed.data);
  toast('Sicherung geladen');
  location.hash = '#/uebersicht';
  render();
}

// =====================================================================
// Aktionen (Klicks)
// =====================================================================
const scope = () => current?.scope;
const curDoc = () => (scope()?.kind === 'doc' ? scope().obj : null);
const curContract = () => (scope()?.kind === 'contract' ? scope().obj : null);
const curSite = () => (scope()?.kind === 'site' ? scope().obj : null);

const ACTIONS = {
  more: moreSheet,
  'new-any': newAnySheet,
  saved: () => { save(true); toast('Gespeichert'); },
  print: () => window.print(),

  // Dokumente
  'doc-new': (b) => createDoc(b.dataset.type),
  'doc-filter': (b) => { docFilter = b.dataset.f; render(); },
  'paper-edit': () => { docEdit = !docEdit; render(); },
  'pos-add': () => { const d = curDoc(); d.positions.push({ id: uid(), desc: '', qty: '1', unit: 'Stk.', price: '' }); touch(d); save(); refreshDoc(d, { positions: true }); document.querySelector(`[data-bind="positions.${d.positions.length - 1}.desc"]`)?.focus(); },
  'pos-del': (b) => { const d = curDoc(); d.positions.splice(+b.dataset.i, 1); touch(d); save(); refreshDoc(d, { positions: true }); },
  'pos-up': (b) => { const d = curDoc(); const i = +b.dataset.i; if (i > 0) [d.positions[i - 1], d.positions[i]] = [d.positions[i], d.positions[i - 1]]; save(); refreshDoc(d, { positions: true }); },
  'pos-down': (b) => { const d = curDoc(); const i = +b.dataset.i; if (i < d.positions.length - 1) [d.positions[i + 1], d.positions[i]] = [d.positions[i], d.positions[i + 1]]; save(); refreshDoc(d, { positions: true }); },
  'pos-tpl': () => {
    const d = curDoc();
    const list = state.templates.filter((t) => t.kind === 'service');
    openSheet({
      title: 'Leistung aus Vorlage',
      body: `<div class="list">${list.map((t) => `<button class="row" data-act="pick" data-id="${t.id}"><div class="row-icon">${icon('wrench')}</div><div class="row-main"><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.text)}</div></div>${t.price ? `<div class="row-end">${euro(num(t.price))}<small class="hint">/${esc(t.unit)}</small></div>` : ''}</button>`).join('')}</div>`,
      acts: {
        pick(btn, e, sh) {
          const t = state.templates.find((x) => x.id === btn.dataset.id);
          d.positions.push({ id: uid(), desc: `${t.title}\n${t.text}`, qty: '1', unit: t.unit || 'Stk.', price: t.price || '' });
          touch(d); save(); sh.close(); refreshDoc(d, { positions: true });
        },
      },
    });
  },
  async 'doc-del'() {
    const d = curDoc();
    if (!(await confirmDialog(`${d.number} wird endgültig gelöscht.`))) return;
    state.docs = state.docs.filter((x) => x.id !== d.id);
    save(); toast('Dokument gelöscht'); go('#/dokumente');
  },
  'doc-copy': () => { const d = curDoc(); const n = createDoc(d.type, d); Object.assign(n, { intro: d.intro, closing: d.closing, over: { ...d.over, heading: undefined, payNote: undefined } }); save(); toast('Kopie erstellt'); render(); },
  'kv-to-re': () => {
    const d = curDoc();
    d.status = 'angenommen'; touch(d);
    createDoc('re', d);
    toast('Rechnung aus Kostenvoranschlag erstellt');
  },
  xml: () => {
    const d = curDoc();
    download(new Blob([eInvoiceXML(d)], { type: 'application/xml' }), `${safeName(d.number)}-XRechnung.xml`);
    toast('E-Rechnung gespeichert');
  },
  pdf: (b) => {
    if (b.dataset.kind === 'doc') { const d = curDoc(); savePdf(docPaper(d), `${d.number} ${d.title || DOC_TYPES[d.type].label}`); } else { const k = curContract(); savePdf(contractPaper(k), k.name); }
  },
  share: (b) => {
    if (b.dataset.kind === 'doc') { const d = curDoc(); sharePdf(docPaper(d), `${d.number} ${d.title || DOC_TYPES[d.type].label}`); } else { const k = curContract(); sharePdf(contractPaper(k), k.name); }
  },

  // Verträge
  'contract-new': (b) => contractSheet(b.dataset.type || 'arbeit'),
  'contract-edit': () => { contractEdit = !contractEdit; render(); },
  'contract-regen': () => contractSheet(null, curContract()),
  'contract-copy': () => {
    const k = curContract();
    const n = JSON.parse(JSON.stringify(k));
    Object.assign(n, { id: uid(), name: `${k.name} (Kopie)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    state.contracts.push(n); save(); toast('Kopie erstellt'); go(`#/vertrag/${n.id}`);
  },
  async 'contract-del'() {
    const k = curContract();
    if (!(await confirmDialog(`„${k.name}“ wird endgültig gelöscht.`))) return;
    state.contracts = state.contracts.filter((x) => x.id !== k.id);
    save(); toast('Vertrag gelöscht'); go('#/vertraege');
  },
  'k-para-add': (b) => { const k = curContract(); k.sections[+b.dataset.s].paras.push(''); touch(k); save(); rerenderContract(k); focusCE(`sections.${b.dataset.s}.paras.${k.sections[+b.dataset.s].paras.length - 1}`); },
  'k-para-del': (b) => { const k = curContract(); k.sections[+b.dataset.s].paras.splice(+b.dataset.p, 1); touch(k); save(); rerenderContract(k); },
  'k-sec-add': (b) => { const k = curContract(); const i = +b.dataset.s + 1; k.sections.splice(i, 0, { h: 'Neuer Paragraf', paras: [''] }); touch(k); save(); rerenderContract(k); focusCE(`sections.${i}.h`, true); },
  async 'k-sec-del'(b) {
    const k = curContract();
    const i = +b.dataset.s;
    if (!(await confirmDialog(`§${i + 1} „${k.sections[i].h}“ mit allen Absätzen löschen?`))) return;
    k.sections.splice(i, 1); touch(k); save(); rerenderContract(k);
  },
  'k-sec-up': (b) => { const k = curContract(); const i = +b.dataset.s; if (i > 0) { [k.sections[i - 1], k.sections[i]] = [k.sections[i], k.sections[i - 1]]; save(); rerenderContract(k); } },
  'k-sec-down': (b) => { const k = curContract(); const i = +b.dataset.s; if (i < k.sections.length - 1) { [k.sections[i + 1], k.sections[i]] = [k.sections[i], k.sections[i + 1]]; save(); rerenderContract(k); } },

  // Ablage
  'ablage-filter': (b) => { ablageFilter = b.dataset.f; render(); },
  async upload() {
    if (!pending.length) return toast('Bitte zuerst Dateien wählen.', 'error');
    const v = document.getElementById('view');
    const n = await storeUploads(pending, { kind: v.querySelector('#up-kind').value, title: v.querySelector('#up-title').value.trim(), note: v.querySelector('#up-note').value.trim() });
    if (n) { pending = []; render(); }
  },
  'file-view': (b) => { const u = state.uploads.find((x) => x.id === b.dataset.id); viewFile(u.id, u.name); },
  async 'file-dl'(b) {
    const u = state.uploads.find((x) => x.id === b.dataset.id);
    const blob = await files.get(u.id);
    if (blob) download(blob, u.fileName || u.name);
  },
  async 'file-del'(b) {
    const u = state.uploads.find((x) => x.id === b.dataset.id);
    if (!(await confirmDialog(`„${u.name}“ wird endgültig gelöscht.`))) return;
    await files.del(u.id); forgetURL(u.id);
    state.uploads = state.uploads.filter((x) => x.id !== u.id);
    save(); toast('Datei gelöscht'); render();
  },

  // Baustellen
  'site-new': () => siteSheet(),
  'site-edit': () => siteSheet(curSite()),
  async 'site-del'() {
    const s = curSite();
    if (!(await confirmDialog(`„${s.name}“ mit allen Fotos, Sprachnachrichten und Mängeln löschen?`))) return;
    for (const f of [...(s.photos || []), ...(s.voice || [])]) await files.del(f.id);
    for (const d of s.defects || []) if (d.photoId) await files.del(d.photoId);
    state.sites = state.sites.filter((x) => x.id !== s.id);
    state.events.forEach((e) => { if (e.siteId === s.id) e.siteId = ''; });
    save(); toast('Baustelle gelöscht'); go('#/baustellen');
  },
  'photo-view': (b) => viewFile(b.dataset.id, 'Foto'),
  rec: () => toggleRecording(curSite()),
  async 'voice-del'(b) {
    const s = curSite();
    if (!(await confirmDialog('Sprachnachricht löschen?'))) return;
    await files.del(b.dataset.id); forgetURL(b.dataset.id);
    s.voice = s.voice.filter((v) => v.id !== b.dataset.id); save(); render();
  },
  'defect-add': () => {
    const s = curSite();
    const inp = document.getElementById('defect-title');
    const t = inp.value.trim();
    if (!t) return inp.focus();
    (s.defects ||= []).unshift({ id: uid(), title: t, done: false, createdAt: new Date().toISOString() });
    touch(s); save(); render();
    document.getElementById('defect-title')?.focus();
  },
  async 'defect-del'(b) {
    const s = curSite();
    const d = s.defects.find((x) => x.id === b.dataset.id);
    if (!(await confirmDialog(`Mangel „${d.title}“ löschen?`))) return;
    if (d.photoId) await files.del(d.photoId);
    s.defects = s.defects.filter((x) => x.id !== d.id); save(); render();
  },

  // Kunden
  'customer-new': () => customerSheet(),
  'customer-edit': (b) => customerSheet(customer(b.dataset.id)),
  async 'customer-del'(b) {
    const c = customer(b.dataset.id);
    if (!(await confirmDialog(`„${c.name}“ wird gelöscht. Bestehende Dokumente behalten die Anschrift.`))) return;
    state.customers = state.customers.filter((x) => x.id !== c.id);
    state.docs.forEach((d) => { if (d.customerId === c.id) d.customerId = ''; });
    state.sites.forEach((s) => { if (s.customerId === c.id) s.customerId = ''; });
    save(); toast('Kunde gelöscht'); render();
  },

  // Termine
  'event-new': (b) => eventSheet(null, b.dataset.site ? { siteId: b.dataset.site } : {}),
  'event-open': (b) => eventSheet(state.events.find((e) => e.id === b.dataset.id)),
  week: (b) => { const d = +b.dataset.d; weekOffset = d === 0 ? 0 : weekOffset + d; render(); },

  // Vorlagen
  'tpl-add': () => {
    const f = formValues(document.getElementById('tpl-form'));
    if (!f.text.trim()) return toast('Bitte einen Text eingeben.', 'error');
    state.templates.push({ id: uid(), kind: f.kind, title: f.title.trim() || 'Ohne Titel', text: f.text, unit: 'm²', price: '' });
    save(); toast('Vorlage gespeichert'); render();
  },
  'tpl-examples': () => {
    let n = 0;
    TPL_EXAMPLES.forEach((ex) => { if (!state.templates.some((t) => t.title === ex.title && t.kind === ex.kind)) { state.templates.push({ id: uid(), ...ex }); n++; } });
    save(); toast(n ? `${n} Beispiele geladen` : 'Beispiele sind schon vorhanden'); render();
  },
  async 'tpl-del'(b) {
    if (!(await confirmDialog('Vorlage löschen?'))) return;
    state.templates = state.templates.filter((t) => t.id !== b.dataset.id); save(); render();
  },

  // Firma
  'logo-reset': () => { state.company.logo = null; save(); render(); },
  theme: (b) => { try { localStorage.setItem('baulot-theme', b.dataset.t); } catch (e) { /* privat */ } applyTheme(); render(); },
  export: exportData,
  async logout() {
    if (!(await confirmDialog('Du wirst auf diesem Gerät abgemeldet. Deine Daten bleiben erhalten.', { ok: 'Abmelden', danger: false, title: 'Abmelden?' }))) return;
    ls.del(SES_KEY);
    location.hash = '';
    render();
  },
};

function focusCE(path, select = false) {
  const el = document.querySelector(`[data-ce="${path}"]`);
  if (!el) return;
  el.focus();
  if (select) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b || b.closest('.overlay')) return;
  const fn = ACTIONS[b.dataset.action];
  if (fn) { e.preventDefault(); fn(b, e); }
});

// =====================================================================
// Eingaben: Formularfelder und Texte direkt im Dokument
// =====================================================================
function onBind(el) {
  const sc = scope();
  if (!sc) return;
  const obj = sc.obj;
  const path = el.dataset.bind;
  let value = el.type === 'checkbox' ? el.checked : el.value;
  if (path === 'customerId' && value === '__new') {
    el.value = obj.customerId || '';
    return customerSheet(null, (c) => {
      obj.customerId = c.id;
      obj.recipient = customerBlock(c);
      touch(obj); save(); render();
    });
  }
  setPath(obj, path, value);
  touch(obj);
  save();
  if (sc.kind === 'doc') {
    if (path === 'customerId') {
      obj.recipient = customerBlock(customer(value));
      const r = document.querySelector('[data-bind="recipient"]');
      if (r) r.value = obj.recipient;
    }
    refreshDoc(obj);
  } else if (sc.kind === 'company') {
    document.querySelectorAll('.brand small').forEach((s) => { s.textContent = state.company.name; });
  }
  if (el.dataset.after === 'render') render();
}

function onCE(el) {
  const paper = el.closest('[data-paper]');
  if (!paper) return;
  const obj = paper.dataset.paper === 'doc' ? state.docs.find((d) => d.id === paper.dataset.id) : state.contracts.find((k) => k.id === paper.dataset.id);
  if (!obj) return;
  const text = el.innerText.replace(/\n$/, '');
  setPath(obj, el.dataset.ce, text);
  touch(obj);
  save();
  // gleiches Feld im Formular mitziehen
  const twin = document.querySelector(`#view [data-bind="${el.dataset.ce}"]`);
  if (twin && twin !== el) twin.value = text;
  if (paper.dataset.paper === 'doc' && el.dataset.ce === 'title') {
    const sub = document.querySelector('.page-head p');
    if (sub) sub.textContent = text || 'Ohne Titel';
  }
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.closest('.overlay')) return;
  if (t.matches('[data-bind]')) {
    if (t.tagName === 'SELECT') return; // über "change"
    onBind(t);
  } else if (t.matches('[data-ce]')) onCE(t);
  else if (t.matches('[data-tpl-field]')) {
    const tpl = state.templates.find((x) => x.id === t.closest('[data-tpl]').dataset.tpl);
    tpl[t.dataset.tplField] = t.value; save();
  } else if (t.matches('[data-search="customers"]')) {
    custQuery = t.value;
    const pos = t.selectionStart;
    render();
    const n = document.querySelector('[data-search="customers"]');
    n.focus(); n.setSelectionRange(pos, pos);
  } else if (t.matches('[data-logo-size]')) {
    state.company.logoSize = +t.value; save();
    document.getElementById('logo-prev').style.height = `${logoHeight(+t.value)}px`;
    const v = +t.value;
    document.getElementById('logo-size-label').textContent = v < 20 ? 'Sehr klein' : v < 40 ? 'Klein' : v < 60 ? 'Mittel' : v < 80 ? 'Groß' : 'Sehr groß';
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.closest('.overlay')) return;
  if (t.matches('select[data-bind]')) return onBind(t);
  if (t.matches('[data-tpl-field]') && t.tagName === 'SELECT') {
    const tpl = state.templates.find((x) => x.id === t.closest('[data-tpl]').dataset.tpl);
    tpl[t.dataset.tplField] = t.value; save(); return;
  }
  if (t.matches('[data-tpl-insert]')) {
    const tpl = state.templates.find((x) => x.id === t.value);
    const d = curDoc();
    if (tpl && d) {
      const key = t.dataset.tplInsert;
      d[key] = d[key] ? `${d[key]}\n\n${tpl.text}` : tpl.text;
      touch(d); save();
      document.querySelector(`[data-bind="${key}"]`).value = d[key];
      refreshDoc(d);
    }
    t.value = '';
    return;
  }
  if (t.matches('[data-action-change="upload-kind"]')) { uploadKind = t.value; return; }
  if (t.matches('[data-quick-upload]')) { const n = await storeUploads([...t.files], { kind: uploadKind }); if (n) render(); return; }
  if (t.matches('[data-upload-kind]')) {
    const u = state.uploads.find((x) => x.id === t.dataset.uploadKind);
    u.kind = t.value; touch(u); save(); toast(`Verschoben nach „${t.value}“`);
    if (ablageFilter !== 'Alle' || route().name === 'dokumente') render();
    return;
  }
  if (t.matches('[data-site-photo]')) {
    const s = curSite();
    for (const f of t.files) {
      if (f.size > MAX_FILE) { toast(`${f.name} ist größer als 50 MB.`, 'error'); continue; }
      const id = uid(); await files.put(id, f);
      (s.photos ||= []).push({ id, name: f.name, createdAt: new Date().toISOString() });
    }
    touch(s); save(); toast('Fotos gespeichert'); render(); return;
  }
  if (t.matches('[data-defect-photo]')) {
    const s = curSite();
    const d = s.defects.find((x) => x.id === t.dataset.defectPhoto);
    const f = t.files[0];
    if (!f) return;
    if (d.photoId) await files.del(d.photoId);
    d.photoId = uid(); await files.put(d.photoId, f);
    save(); render(); return;
  }
  if (t.matches('[data-defect-done]')) {
    const s = curSite();
    const d = s.defects.find((x) => x.id === t.dataset.defectDone);
    d.done = t.checked; touch(s); save(); render(); return;
  }
  if (t.matches('[data-logo]')) {
    const f = t.files[0];
    if (!f) return;
    try { state.company.logo = await resizeImage(f); state.company.logoHidden = false; save(); toast('Logo gespeichert'); render(); } catch (err) { toast('Bild konnte nicht gelesen werden.', 'error'); }
    return;
  }
  if (t.matches('[data-logo-hidden]')) { state.company.logoHidden = t.checked; save(); render(); return; }
  if (t.matches('[data-import]')) { if (t.files[0]) importData(t.files[0]); }
});

// Nur reinen Text in die Dokument-Felder einfügen
document.addEventListener('paste', (e) => {
  const el = e.target.closest?.('[data-ce]');
  if (!el) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});
// Enter im einzeiligen Feld = neue Zeile (kein <div>)
document.addEventListener('keydown', (e) => {
  const el = e.target.closest?.('[data-ce]');
  if (el && e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    document.execCommand('insertLineBreak');
  }
  if (e.key === 'Enter' && e.target.id === 'defect-title') ACTIONS['defect-add']();
});

// Audio nach jedem Rendern nachladen
const mo = new MutationObserver(() => { const v = document.getElementById('view'); if (v && v.querySelector('audio[data-audio]:not([src])')) hydrateAudio(v); });
mo.observe(app, { childList: true, subtree: true });

// Offline-Fähigkeit
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
