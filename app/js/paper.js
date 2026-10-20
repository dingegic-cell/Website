// Darstellung der Dokumente als „Papier“ – für Vorschau, Bearbeiten im Dokument, Druck und PDF.
import { state, getPath } from './store.js';
import { esc, euro, num, fmtNum, fmtDate, download, safeName, toast } from './ui.js';
import { icon } from './icons.js';
import { buildPdf } from './pdf.js';

export const DEFAULT_LOGO = '../assets/img/logo-dark.png';
export const logoHeight = (size) => Math.round(28 + (Number(size ?? 50) / 100) * 82);

// Ein bearbeitbares Textfeld im Papier
function ce(item, path, def, edit, { cls = '', tag = 'div', ph = '', hideEmpty = false } = {}) {
  const v = getPath(item, path);
  const value = v == null ? (def ?? '') : v;
  if (!edit && hideEmpty && !String(value).trim()) return '';
  return `<${tag} class="ce ${cls}" data-ce="${path}" data-ph="${esc(ph)}" ${edit ? 'contenteditable="true" spellcheck="true"' : ''}>${esc(value)}</${tag}>`;
}

function letterhead(item, c, edit) {
  const src = c.logo || DEFAULT_LOGO;
  const addr = [c.street, [c.zip, c.city].filter(Boolean).join(' '), c.phone, c.email, c.taxNo ? `Steuernummer: ${c.taxNo}` : ''].filter(Boolean).join('\n');
  return `
    <header class="p-head">
      <div class="p-brand">
        ${c.logoHidden ? '' : `<img src="${esc(src)}" alt="" style="height:${logoHeight(c.logoSize)}px">`}
        <div>
          ${ce(item, 'over.coName', c.name, edit, { cls: 'p-co', ph: 'Firmenname' })}
          ${ce(item, 'over.coOwner', c.owner, edit, { cls: 'p-owner', ph: 'Inhaber', hideEmpty: true })}
        </div>
      </div>
      ${ce(item, 'over.coAddr', addr, edit, { cls: 'p-addr', ph: 'Anschrift' })}
    </header>`;
}

// ---------- Kostenvoranschlag / Rechnung ----------
export const DOC_TYPES = {
  kv: { label: 'Kostenvoranschlag', short: 'KV', noLabel: 'Angebots-Nr.', dateLabel: 'Datum', dueLabel: 'Gültig bis', statuses: ['entwurf', 'versendet', 'angenommen', 'abgelehnt'] },
  re: { label: 'Rechnung', short: 'RE', noLabel: 'Rechnungs-Nr.', dateLabel: 'Rechnungsdatum', dueLabel: 'Fällig am', statuses: ['entwurf', 'offen', 'bezahlt', 'storniert'] },
};
export const UNITS = ['Stk.', 'm²', 'm', 'lfm', 'm³', 'h', 'Psch.', 'kg', 't', 'Tag'];

export function totals(doc) {
  const net = (doc.positions || []).reduce((s, p) => s + num(p.qty) * num(p.price), 0);
  const discount = net * num(doc.discount) / 100;
  const base = net - discount;
  const vat = base * num(doc.vat) / 100;
  return { net, discount, base, vat, gross: base + vat };
}

export function customerBlock(cu) {
  if (!cu) return '';
  return [cu.name, cu.contact, cu.street, [cu.zip, cu.city].filter(Boolean).join(' ')].filter(Boolean).join('\n');
}

export function isOverdue(doc) {
  if (doc.type !== 're' || doc.status !== 'offen' || !doc.dueDate) return false;
  return doc.dueDate < new Date().toISOString().slice(0, 10);
}

export function docPaper(doc, edit = false) {
  const c = state.company;
  const T = DOC_TYPES[doc.type];
  const t = totals(doc);
  const service = doc.serviceDate ? fmtDate(doc.serviceDate) + (doc.serviceUntil ? ` – ${fmtDate(doc.serviceUntil)}` : '') : '';
  const payDefault = doc.type === 're'
    ? `Bitte überweisen Sie den Gesamtbetrag${doc.dueDate ? ` bis zum ${fmtDate(doc.dueDate)}` : ''} auf das unten genannte Konto und geben Sie die Rechnungsnummer ${doc.number} als Verwendungszweck an.`
    : (doc.dueDate ? `Dieser Kostenvoranschlag ist gültig bis zum ${fmtDate(doc.dueDate)}.` : '');
  const sender = [c.name, c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const foot1 = [c.name, c.street, [c.zip, c.city].filter(Boolean).join(' '), c.owner ? `Inhaber: ${c.owner}` : ''].filter(Boolean).join('\n');
  const foot2 = [c.phone ? `Tel. ${c.phone}` : '', c.email, c.web, c.taxNo ? `St.-Nr. ${c.taxNo}` : '', c.vatId ? `USt-IdNr. ${c.vatId}` : ''].filter(Boolean).join('\n');
  const foot3 = [c.bank || c.owner, c.iban ? `IBAN ${c.iban}` : '', c.bic ? `BIC ${c.bic}` : ''].filter(Boolean).join('\n');

  const rows = (doc.positions || []).map((p, i) => `
    <tr>
      <td class="c-pos">${i + 1}</td>
      <td>${ce(doc, `positions.${i}.desc`, '', edit, { ph: 'Leistung beschreiben' })}</td>
      <td class="r">${fmtNum(num(p.qty))} ${esc(p.unit || '')}</td>
      <td class="r">${euro(num(p.price))}</td>
      <td class="r">${euro(num(p.qty) * num(p.price))}</td>
    </tr>`).join('');

  return `
  <article class="paper ${edit ? 'editing' : ''}" data-paper="doc" data-id="${doc.id}">
    ${letterhead(doc, c, edit)}
    <div class="p-meta-row">
      <div>
        ${ce(doc, 'over.sender', sender, edit, { cls: 'p-sender', hideEmpty: true })}
        ${ce(doc, 'recipient', '', edit, { cls: 'p-party', ph: 'Kunde auswählen' })}
        ${!edit && !String(doc.recipient || '').trim() ? '<div style="color:#9a9ca3">Kunde auswählen</div>' : ''}
      </div>
      <dl class="p-meta">
        <dt>${ce(doc, 'over.lNo', T.noLabel, edit, { tag: 'span' })}</dt><dd>${ce(doc, 'number', '', edit, { tag: 'span' })}</dd>
        <dt>${ce(doc, 'over.lDate', T.dateLabel, edit, { tag: 'span' })}</dt><dd>${esc(fmtDate(doc.date))}</dd>
        ${service ? `<dt>${ce(doc, 'over.lService', 'Leistungsdatum', edit, { tag: 'span' })}</dt><dd>${esc(service)}</dd>` : ''}
        ${doc.dueDate ? `<dt>${ce(doc, 'over.lDue', T.dueLabel, edit, { tag: 'span' })}</dt><dd>${esc(fmtDate(doc.dueDate))}</dd>` : ''}
        ${c.vatId ? `<dt>${ce(doc, 'over.lVat', 'USt-IdNr.', edit, { tag: 'span' })}</dt><dd>${esc(c.vatId)}</dd>` : ''}
      </dl>
    </div>
    ${ce(doc, 'over.heading', `${T.label} ${doc.number}`, edit, { cls: 'p-doc-title' })}
    ${ce(doc, 'title', '', edit, { cls: 'p-owner', ph: 'Betreff / Bauvorhaben', hideEmpty: true })}
    ${ce(doc, 'intro', '', edit, { cls: 'p-text', ph: 'Einleitungstext (optional)', hideEmpty: true })}
    <table class="p-table">
      <thead><tr>
        <th class="c-pos">${ce(doc, 'over.thPos', 'Pos.', edit, { tag: 'span' })}</th>
        <th>${ce(doc, 'over.thDesc', 'Leistung', edit, { tag: 'span' })}</th>
        <th class="r">${ce(doc, 'over.thQty', 'Menge', edit, { tag: 'span' })}</th>
        <th class="r">${ce(doc, 'over.thPrice', 'Einzelpreis', edit, { tag: 'span' })}</th>
        <th class="r">${ce(doc, 'over.thSum', 'Gesamt', edit, { tag: 'span' })}</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="5" style="color:#9a9ca3;text-align:center;padding:18px">Noch keine Positionen</td></tr>`}</tbody>
    </table>
    <div class="p-sum">
      <div><span>${ce(doc, 'over.lNet', 'Nettosumme', edit, { tag: 'span' })}</span><span>${euro(t.net)}</span></div>
      ${num(doc.discount) ? `<div><span>${ce(doc, 'over.lDisc', `abzgl. ${fmtNum(num(doc.discount))} % Rabatt`, edit, { tag: 'span' })}</span><span>−${euro(t.discount)}</span></div>
      <div><span>${ce(doc, 'over.lBase', 'Zwischensumme', edit, { tag: 'span' })}</span><span>${euro(t.base)}</span></div>` : ''}
      <div><span>${ce(doc, 'over.lVatSum', `zzgl. ${fmtNum(num(doc.vat))} % MwSt.`, edit, { tag: 'span' })}</span><span>${euro(t.vat)}</span></div>
      <div class="total"><span>${ce(doc, 'over.lTotal', 'Gesamtbetrag', edit, { tag: 'span' })}</span><span>${euro(t.gross)}</span></div>
    </div>
    ${ce(doc, 'over.payNote', payDefault, edit, { cls: 'p-text', ph: 'Zahlungshinweis', hideEmpty: true })}
    ${ce(doc, 'closing', '', edit, { cls: 'p-text', ph: 'Schlusstext (optional)', hideEmpty: true })}
    ${ce(doc, 'over.footNote', c.footer || '', edit, { cls: 'p-text', ph: 'Fußzeile, z. B. Vielen Dank für Ihr Vertrauen.', hideEmpty: true })}
    <footer class="p-foot">
      ${ce(doc, 'over.foot1', foot1, edit)}
      ${ce(doc, 'over.foot2', foot2, edit)}
      ${ce(doc, 'over.foot3', foot3, edit)}
    </footer>
  </article>`;
}

// ---------- Verträge ----------
export function contractPaper(k, edit = false) {
  const c = state.company;
  const tool = (act, label, ico, extra = '', cls = '') => `<button type="button" class="p-tool ${cls}" data-action="${act}" ${extra}>${icon(ico, 'sm')}${label}</button>`;
  const parties = (k.parties || []).map((p, i) => `
    <div>
      ${ce(k, `parties.${i}.label`, '', edit, { cls: 'p-label' })}
      ${ce(k, `parties.${i}.text`, '', edit, { cls: `p-party ${p.plain ? 'plain' : ''}` })}
    </div>`).join('');
  const sections = (k.sections || []).map((s, i) => `
    <section class="p-sec">
      <div class="p-sec-h"><span class="num">§${i + 1}</span>${ce(k, `sections.${i}.h`, '', edit, { ph: 'Überschrift' })}</div>
      ${(s.paras || []).map((_, j) => `
        <div class="p-para-wrap">
          ${ce(k, `sections.${i}.paras.${j}`, '', edit, { cls: 'p-para', ph: 'Text eingeben …' })}
          ${edit ? `<button type="button" class="p-para-x" data-action="k-para-del" data-s="${i}" data-p="${j}" aria-label="Absatz löschen">${icon('x', 'sm')}</button>` : ''}
        </div>`).join('')}
      <div class="p-tools">
        ${tool('k-para-add', 'Absatz', 'plus', `data-s="${i}"`)}
        ${tool('k-sec-up', '', 'up', `data-s="${i}" aria-label="Nach oben"`)}
        ${tool('k-sec-down', '', 'down', `data-s="${i}" aria-label="Nach unten"`)}
        ${tool('k-sec-add', 'Paragraf danach', 'plus', `data-s="${i}"`)}
        ${tool('k-sec-del', 'Paragraf löschen', 'trash', `data-s="${i}"`, 'del')}
      </div>
    </section>`).join('');
  return `
  <article class="paper ${edit ? 'editing' : ''}" data-paper="contract" data-id="${k.id}">
    ${letterhead(k, c, edit)}
    ${ce(k, 'title', '', edit, { cls: 'p-title', ph: 'Vertragstitel' })}
    <div class="p-parties">${parties}</div>
    ${ce(k, 'intro', '', edit, { cls: 'p-intro', ph: 'Einleitung', hideEmpty: true })}
    ${sections}
    ${edit && !(k.sections || []).length ? `<div class="p-tools" style="margin-top:18px">${tool('k-sec-add', 'Paragraf hinzufügen', 'plus', 'data-s="-1"')}</div>` : ''}
    ${ce(k, 'placeDate', '', edit, { cls: 'p-sign-date', ph: 'Ort, Datum' })}
    <div class="p-signs">
      ${(k.signatures || []).map((_, i) => `<div class="p-sign">${ce(k, `signatures.${i}`, '', edit, { ph: 'Unterschrift' })}</div>`).join('')}
    </div>
  </article>`;
}

// ---------- PDF ----------
export const makePdf = (paperHTML, name) => buildPdf(paperHTML, name);

export async function savePdf(paperHTML, name) {
  toast('PDF wird erstellt …');
  try {
    const blob = await makePdf(paperHTML, name);
    download(blob, `${safeName(name)}.pdf`);
  } catch (e) {
    console.error(e);
    toast('PDF konnte nicht erstellt werden. Bitte die Seite neu laden und nochmal versuchen.', 'error');
  }
}

export async function sharePdf(paperHTML, name) {
  toast('PDF wird erstellt …');
  try {
    const blob = await makePdf(paperHTML, name);
    const file = new File([blob], `${safeName(name)}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
    } else {
      download(blob, file.name);
      toast('Teilen wird hier nicht unterstützt – PDF wurde gespeichert.');
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    console.error(e);
    toast('PDF konnte nicht geteilt werden.', 'error');
  }
}

// ---------- E-Rechnung (XRechnung, UBL 2.1) ----------
const x = (s) => esc(s ?? '');
const amt = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const UNIT_CODES = { 'Stk.': 'H87', 'm²': 'MTK', m: 'MTR', lfm: 'MTR', 'm³': 'MTQ', h: 'HUR', 'Psch.': 'LS', kg: 'KGM', t: 'TNE', Tag: 'DAY' };

export function eInvoiceXML(doc) {
  const c = state.company;
  const cu = state.customers.find((k) => k.id === doc.customerId);
  const t = totals(doc);
  const rate = num(doc.vat);
  const factor = 1 - num(doc.discount) / 100;
  const recipientLines = String(doc.recipient || '').split('\n').filter(Boolean);
  const buyerName = cu ? cu.name : (recipientLines[0] || 'Kunde');
  const lines = (doc.positions || []).map((p, i) => {
    const lineNet = num(p.qty) * num(p.price) * factor;
    return `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${UNIT_CODES[p.unit] || 'C62'}">${num(p.qty)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${amt(lineNet)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${x(String(p.desc || 'Position').split('\n')[0].slice(0, 120))}</cbc:Name>
      ${String(p.desc || '').includes('\n') ? `<cbc:Description>${x(p.desc)}</cbc:Description>` : ''}
      <cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${rate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${amt(num(p.price) * factor)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${x(doc.number)}</cbc:ID>
  <cbc:IssueDate>${x(doc.date)}</cbc:IssueDate>
  ${doc.dueDate ? `<cbc:DueDate>${x(doc.dueDate)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${doc.title ? `<cbc:Note>${x(doc.title)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${x(cu?.no || doc.number)}</cbc:BuyerReference>
  ${doc.serviceDate ? `<cac:InvoicePeriod><cbc:StartDate>${x(doc.serviceDate)}</cbc:StartDate><cbc:EndDate>${x(doc.serviceUntil || doc.serviceDate)}</cbc:EndDate></cac:InvoicePeriod>` : ''}
  <cac:AccountingSupplierParty><cac:Party>
    ${c.email ? `<cbc:EndpointID schemeID="EM">${x(c.email)}</cbc:EndpointID>` : ''}
    <cac:PartyName><cbc:Name>${x(c.name)}</cbc:Name></cac:PartyName>
    <cac:PostalAddress><cbc:StreetName>${x(c.street)}</cbc:StreetName><cbc:CityName>${x(c.city)}</cbc:CityName><cbc:PostalZone>${x(c.zip)}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
    ${c.vatId ? `<cac:PartyTaxScheme><cbc:CompanyID>${x(c.vatId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    ${c.taxNo ? `<cac:PartyTaxScheme><cbc:CompanyID>${x(c.taxNo)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
    <cac:PartyLegalEntity><cbc:RegistrationName>${x(c.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
    <cac:Contact><cbc:Name>${x(c.owner)}</cbc:Name><cbc:Telephone>${x(c.phone)}</cbc:Telephone><cbc:ElectronicMail>${x(c.email)}</cbc:ElectronicMail></cac:Contact>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party>
    ${cu?.email ? `<cbc:EndpointID schemeID="EM">${x(cu.email)}</cbc:EndpointID>` : ''}
    <cac:PostalAddress><cbc:StreetName>${x(cu?.street || recipientLines[1] || '')}</cbc:StreetName><cbc:CityName>${x(cu?.city || '')}</cbc:CityName><cbc:PostalZone>${x(cu?.zip || '')}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
    <cac:PartyLegalEntity><cbc:RegistrationName>${x(buyerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
  </cac:Party></cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cbc:PaymentID>${x(doc.number)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount><cbc:ID>${x(String(c.iban || '').replace(/\s+/g, ''))}</cbc:ID><cbc:Name>${x(c.owner || c.name)}</cbc:Name>${c.bic ? `<cac:FinancialInstitutionBranch><cbc:ID>${x(c.bic)}</cbc:ID></cac:FinancialInstitutionBranch>` : ''}</cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${amt(t.vat)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${amt(t.base)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${amt(t.vat)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${rate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${amt(t.base)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${amt(t.base)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${amt(t.gross)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${amt(t.gross)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</ubl:Invoice>
`;
}
