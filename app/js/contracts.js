// Vertragsvorlagen. Jeder Vertrag wird aus den Formularangaben erzeugt und
// danach als freier Text gespeichert – jede Zeile bleibt bearbeitbar.

import { todayISO } from './store.js';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DOTS = '….';

export function longDate(iso) {
  if (!iso) return DOTS;
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${MONTHS[m - 1]} ${y}`;
}
export function shortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function amount(v) {
  if (v === '' || v == null) return '…';
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
const or = (v, fb = DOTS) => (v && String(v).trim() ? String(v).trim() : fb);
const noDot = (s) => String(s).trim().replace(/[.\s]+$/, '');

export function companyBlock(c) {
  return [
    c.name,
    c.owner ? `Inhaber: ${c.owner}` : '',
    [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    c.phone ? `Telefon: ${c.phone}` : '',
    c.email ? `E-Mail: ${c.email}` : '',
    c.taxNo ? `Steuernummer: ${c.taxNo}` : '',
    c.vatId ? `USt-IdNr.: ${c.vatId}` : '',
  ].filter(Boolean).join('\n');
}
function partnerBlock(f) {
  return [or(f.name, '…'), f.address ? f.address.trim() : '', f.birth ? `geb. am ${shortDate(f.birth)}` : ''].filter(Boolean).join('\n');
}
const INTRO = '– nachfolgend gemeinsam „Parteien“ genannt – schließen folgenden Vertrag:';

export const CONTRACT_TYPES = {
  arbeit: {
    label: 'Arbeitsvertrag',
    desc: 'Für angestellte Mitarbeiter – fair, aber mit klarem Schutz für den Betrieb.',
    icon: 'user',
    fields: (c) => [
      { k: 'name', l: 'Name des Mitarbeiters', req: true, full: true },
      { k: 'address', l: 'Anschrift des Mitarbeiters', type: 'textarea', ph: 'Straße, PLZ Ort', full: true },
      { k: 'birth', l: 'Geburtsdatum', type: 'date' },
      { k: 'position', l: 'Tätigkeit / Position', ph: 'Trockenbaumonteur' },
      { k: 'start', l: 'Beginn des Arbeitsverhältnisses', type: 'date' },
      { k: 'until', l: 'Befristet bis', hint: 'leer = unbefristet', type: 'date' },
      { k: 'probation', l: 'Probezeit (Monate)', type: 'number', def: '6' },
      { k: 'hours', l: 'Wochenarbeitszeit (Std.)', type: 'number', def: '40' },
      { k: 'payType', l: 'Vergütung', type: 'select', opts: ['Stundenlohn', 'Monatslohn'], def: 'Stundenlohn', full: true },
      { k: 'hourly', l: 'Bruttostundenlohn (EUR)', ph: '18,50', inputmode: 'decimal' },
      { k: 'monthly', l: 'Bruttomonatslohn (EUR)', hint: 'nur bei Monatslohn', ph: '3200', inputmode: 'decimal' },
      { k: 'vacation', l: 'Urlaubstage pro Jahr', type: 'number', def: '24' },
      { k: 'workplace', l: 'Einsatzort', def: 'Betriebssitz und wechselnde Baustellen' },
      { k: 'signPlace', l: 'Ort der Unterzeichnung', def: c.city || '' },
      { k: 'date', l: 'Vertragsdatum', type: 'date', def: todayISO() },
    ],
  },
  sub: {
    label: 'Subunternehmervertrag',
    desc: 'Für Nachunternehmer – mit Nachweispflichten, Fristen und Gewährleistung.',
    icon: 'handshake',
    fields: (c) => [
      { k: 'name', l: 'Name des Nachunternehmers', req: true, full: true },
      { k: 'address', l: 'Anschrift des Nachunternehmers', type: 'textarea', ph: 'Straße, PLZ Ort', full: true },
      { k: 'scope', l: 'Leistungsumfang', type: 'textarea', ph: 'Trockenbauarbeiten gemäß Leistungsverzeichnis vom …', full: true },
      { k: 'site', l: 'Baustelle / Anschrift', ph: 'Musterstraße 1, 50667 Köln', full: true },
      { k: 'amount', l: 'Vergütung netto (EUR)', ph: '12000', inputmode: 'decimal' },
      { k: 'priceType', l: 'Preisart', type: 'select', opts: ['Pauschalfestpreis', 'Einheitspreise nach Aufmaß'], def: 'Pauschalfestpreis' },
      { k: 'start', l: 'Ausführungsbeginn', type: 'date' },
      { k: 'end', l: 'Fertigstellung', type: 'date' },
      { k: 'payDays', l: 'Zahlungsziel (Tage)', type: 'number', def: '30' },
      { k: 'penalty', l: 'Vertragsstrafe je Werktag (%)', def: '0,2', inputmode: 'decimal' },
      { k: 'signPlace', l: 'Ort der Unterzeichnung', def: c.city || '' },
      { k: 'date', l: 'Vertragsdatum', type: 'date', def: todayISO() },
    ],
  },
  bau: {
    label: 'Bauvertrag mit Kunden',
    desc: 'Werk-/Bauvertrag als Generalunternehmer gegenüber dem Auftraggeber.',
    icon: 'home',
    fields: (c) => [
      { k: 'name', l: 'Name des Auftraggebers (Kunde)', req: true, full: true, customer: true },
      { k: 'address', l: 'Anschrift des Auftraggebers', type: 'textarea', ph: 'Straße, PLZ Ort', full: true },
      { k: 'scope', l: 'Leistungsumfang', type: 'textarea', ph: 'Komplettsanierung Wohnung, 92 m², gemäß Angebot Nr. …', full: true },
      { k: 'site', l: 'Bauvorhaben / Anschrift', ph: 'Musterstraße 1, 50667 Köln', full: true },
      { k: 'amount', l: 'Vergütung brutto (EUR)', ph: '42000', inputmode: 'decimal' },
      { k: 'priceType', l: 'Preisart', type: 'select', opts: ['Pauschalfestpreis', 'Einheitspreise nach Aufmaß'], def: 'Pauschalfestpreis' },
      { k: 'start', l: 'Baubeginn', type: 'date' },
      { k: 'end', l: 'Fertigstellung', type: 'date' },
      { k: 'payDays', l: 'Zahlungsziel (Tage)', type: 'number', def: '14' },
      { k: 'consumer', l: 'Auftraggeber ist Verbraucher', type: 'select', opts: ['Nein', 'Ja'], def: 'Nein' },
      { k: 'signPlace', l: 'Ort der Unterzeichnung', def: c.city || '' },
      { k: 'date', l: 'Vertragsdatum', type: 'date', def: todayISO() },
    ],
  },
};

const sec = (h, ...paras) => ({ h, paras: paras.filter((p) => p != null && p !== '') });

function arbeit(f, c) {
  const pay = f.payType === 'Monatslohn'
    ? `Der Arbeitnehmer erhält ein monatliches Bruttogehalt von ${amount(f.monthly)} EUR. Die Zahlung erfolgt spätestens zum 15. des Folgemonats auf ein vom Arbeitnehmer benanntes Konto.`
    : `Der Arbeitnehmer erhält einen Bruttostundenlohn von ${amount(f.hourly)} EUR je tatsächlich geleisteter Arbeitsstunde. Die Abrechnung erfolgt monatlich auf Grundlage der dokumentierten Arbeitszeit; die Zahlung erfolgt spätestens zum 15. des Folgemonats auf ein vom Arbeitnehmer benanntes Konto.`;
  const place = !f.workplace || f.workplace.trim() === 'Betriebssitz und wechselnde Baustellen'
    ? 'Einsatzort ist der Betriebssitz sowie wechselnde Baustellen.'
    : `Einsatzort ist ${noDot(f.workplace)}.`;
  return {
    title: 'Arbeitsvertrag',
    parties: [
      { label: 'Arbeitgeber', text: companyBlock(c), plain: true },
      { label: 'Arbeitnehmer', text: partnerBlock(f) },
    ],
    intro: INTRO,
    sections: [
      sec('Beginn, Tätigkeit und Einsatzort',
        `Der Arbeitnehmer wird ab dem ${f.start ? shortDate(f.start) : '…'} als ${or(f.position, '…')} eingestellt.`,
        f.until
          ? `Das Arbeitsverhältnis ist bis zum ${shortDate(f.until)} befristet (§ 14 Abs. 2 TzBfG) und endet, ohne dass es einer Kündigung bedarf.`
          : 'Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.',
        `${place} Der Arbeitgeber kann dem Arbeitnehmer im Rahmen des billigen Ermessens (§ 106 GewO) auch andere zumutbare Tätigkeiten und Einsatzorte zuweisen, die seiner Vorbildung und seinen Fähigkeiten entsprechen.`),
      sec('Probezeit und Kündigung',
        `Die ersten ${or(f.probation, '6')} Monate gelten als Probezeit. Während der Probezeit kann das Arbeitsverhältnis beidseitig mit einer Frist von zwei Wochen gekündigt werden.`,
        'Danach gelten die gesetzlichen Kündigungsfristen des § 622 BGB. Die für den Arbeitgeber geltenden verlängerten Fristen gelten auch für den Arbeitnehmer.',
        'Jede Kündigung bedarf der Schriftform (§ 623 BGB). Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.'),
      sec('Arbeitszeit und Mehrarbeit',
        `Die regelmäßige wöchentliche Arbeitszeit beträgt ${or(f.hours, '40')} Stunden, verteilt auf die betriebsüblichen Arbeitstage. Beginn und Ende richten sich nach dem Baustellenablauf.`,
        'Der Arbeitnehmer ist im gesetzlich zulässigen Rahmen (ArbZG) zu Mehrarbeit verpflichtet, wenn der Bauablauf dies erfordert. Mehrarbeit wird auf einem Arbeitszeitkonto erfasst und vorrangig durch bezahlte Freizeit ausgeglichen; ein Ausgleich in Geld erfolgt nach Absprache.',
        'Die Arbeitszeit ist vollständig und tagesaktuell zu dokumentieren.'),
      sec('Vergütung',
        pay,
        'Es werden mindestens die jeweils geltenden Mindestlöhne (MiLoG bzw. allgemeinverbindliche Branchenmindestlöhne im Baugewerbe) eingehalten.',
        'Zusätzliche Leistungen wie Prämien oder Sonderzahlungen sind freiwillig und begründen auch bei wiederholter Zahlung keinen Rechtsanspruch für die Zukunft.',
        'Auslösung, Fahrtkosten und Verpflegungsmehraufwand werden nach den betrieblichen Regelungen und den geltenden tariflichen bzw. steuerlichen Sätzen erstattet.'),
      sec('Urlaub',
        `Der Jahresurlaub beträgt ${or(f.vacation, '24')} Arbeitstage bei einer 5-Tage-Woche, mindestens jedoch der gesetzliche Mindesturlaub nach BUrlG.`,
        'Der Urlaub ist rechtzeitig zu beantragen und unter Berücksichtigung der Bauabläufe und der Urlaubswünsche der übrigen Mitarbeiter abzustimmen. Zunächst wird der gesetzliche Mindesturlaub gewährt.'),
      sec('Arbeitsverhinderung und Krankheit',
        'Der Arbeitnehmer zeigt jede Arbeitsverhinderung dem Arbeitgeber unverzüglich, spätestens vor dem vereinbarten Arbeitsbeginn, an und teilt die voraussichtliche Dauer mit.',
        'Eine ärztliche Arbeitsunfähigkeitsbescheinigung ist spätestens am darauffolgenden Arbeitstag nachzuweisen. Der Arbeitgeber kann den Nachweis auch früher verlangen.',
        'Die Entgeltfortzahlung richtet sich nach dem EFZG.'),
      sec('Arbeitssicherheit, Werkzeug und Fahrzeuge',
        'Der Arbeitnehmer hält alle Unfallverhütungs- und Arbeitsschutzvorschriften sowie die Anweisungen der Bauleitung ein und trägt die gestellte persönliche Schutzausrüstung.',
        'Überlassenes Werkzeug, Maschinen, Material, Schlüssel und Fahrzeuge sind pfleglich zu behandeln und bei Beendigung des Arbeitsverhältnisses unaufgefordert vollständig zurückzugeben.',
        'Für Schäden haftet der Arbeitnehmer nach den Grundsätzen des innerbetrieblichen Schadensausgleichs. Die private Nutzung von Firmenfahrzeugen ist nur mit ausdrücklicher schriftlicher Erlaubnis gestattet.'),
      sec('Verschwiegenheit und Nebentätigkeit',
        'Der Arbeitnehmer bewahrt über Betriebs- und Geschäftsgeheimnisse, Kalkulationen, Preise und Kundendaten Stillschweigen, auch nach Beendigung des Arbeitsverhältnisses.',
        'Kundendaten, Lichtbilder von Baustellen und Unterlagen dürfen nur für betriebliche Zwecke verwendet werden.',
        'Eine entgeltliche Nebentätigkeit ist dem Arbeitgeber vorher schriftlich anzuzeigen. Sie darf nur untersagt werden, wenn betriebliche Interessen beeinträchtigt werden, insbesondere bei Konkurrenztätigkeit oder Verstoß gegen das ArbZG.'),
      sec('Ausschlussfristen',
        'Alle beiderseitigen Ansprüche aus dem Arbeitsverhältnis verfallen, wenn sie nicht innerhalb von drei Monaten nach Fälligkeit in Textform geltend gemacht werden. Lehnt die Gegenseite ab oder äußert sie sich nicht innerhalb eines Monats, verfällt der Anspruch, wenn er nicht innerhalb von weiteren drei Monaten gerichtlich geltend gemacht wird.',
        'Ausgenommen sind Ansprüche auf den gesetzlichen Mindestlohn, Ansprüche aus vorsätzlicher oder grob fahrlässiger Pflichtverletzung, aus Verletzung von Leben, Körper oder Gesundheit sowie sonstige unabdingbare Ansprüche.'),
      sec('Datenschutz und Schlussbestimmungen',
        'Personenbezogene Daten werden ausschließlich zur Durchführung des Arbeitsverhältnisses nach Art. 6 Abs. 1 lit. b DSGVO und § 26 BDSG verarbeitet.',
        'Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform; das gilt auch für die Aufhebung dieser Klausel. Individuelle Vertragsabreden haben Vorrang.',
        'Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam. An die Stelle der unwirksamen Regelung tritt die gesetzliche Regelung.',
        'Ergänzend gelten die gesetzlichen Bestimmungen sowie etwaige allgemeinverbindliche Tarifverträge des Baugewerbes.'),
    ],
    placeDate: `${or(f.signPlace, c.city || '…')}, ${shortDate(f.date || todayISO())}`,
    signatures: [`${c.name} (Arbeitgeber)`, or(f.name, 'Arbeitnehmer')],
  };
}

function sub(f, c) {
  const pct = or(f.penalty, '0,2');
  return {
    title: 'Subunternehmervertrag',
    parties: [
      { label: 'Auftraggeber', text: companyBlock(c), plain: true },
      { label: 'Nachunternehmer', text: partnerBlock(f) },
    ],
    intro: INTRO,
    sections: [
      sec('Vertragsgegenstand',
        `Der Nachunternehmer erbringt für ${c.name} folgende Leistungen: ${f.scope ? noDot(f.scope) + '.' : DOTS}`,
        `Ausführungsort: ${f.site ? noDot(f.site) + '.' : DOTS}`,
        'Grundlage sind dieser Vertrag, das Leistungsverzeichnis bzw. das Angebot des Nachunternehmers, die Pläne und Baubeschreibungen sowie die anerkannten Regeln der Technik und die einschlägigen DIN-Normen. Bei Widersprüchen gilt diese Reihenfolge.',
        'Der Nachunternehmer erbringt die Leistung als selbstständiger Unternehmer mit eigenem Personal, eigenem Werkzeug und eigener Arbeitsorganisation. Eine Weitervergabe an weitere Nachunternehmer bedarf der vorherigen schriftlichen Zustimmung.'),
      sec('Vergütung',
        `Die Vergütung beträgt ${amount(f.amount)} EUR netto zzgl. der gesetzlichen Umsatzsteuer als ${f.priceType === 'Einheitspreise nach Aufmaß' ? 'Einheitspreise nach Aufmaß' : 'Pauschalfestpreis'}.`,
        'Die Vergütung deckt sämtliche zur vollständigen, funktionstauglichen und mangelfreien Leistung erforderlichen Arbeiten ab, einschließlich Material, Kleinteile, Werkzeug, Transport, An- und Abfahrt, Reinigung und Entsorgung der eigenen Abfälle.',
        'Bei Bauleistungen an einen Unternehmer gilt die Steuerschuldnerschaft des Leistungsempfängers nach § 13b UStG; Rechnungen sind entsprechend ohne Umsatzsteuer mit Hinweis auszustellen.',
        'Nachträge werden nur vergütet, wenn sie vor Ausführung schriftlich beauftragt wurden.'),
      sec('Ausführungsfristen und Vertragsstrafe',
        `Ausführungsbeginn: ${f.start ? shortDate(f.start) : DOTS} Fertigstellung: ${f.end ? shortDate(f.end) + '.' : DOTS} Diese Termine sind verbindliche Vertragsfristen.`,
        `Bei schuldhafter Überschreitung der Fertigstellungsfrist wird eine Vertragsstrafe von ${pct} % der Netto-Auftragssumme je Werktag der Verzögerung vereinbart, insgesamt begrenzt auf 5 % der Netto-Auftragssumme. Die Vertragsstrafe wird auf einen weitergehenden Schadensersatzanspruch angerechnet.`,
        'Erkennt der Nachunternehmer, dass Termine gefährdet sind, zeigt er dies unverzüglich schriftlich an und stimmt Abhilfemaßnahmen ab.'),
      sec('Nachweise und gesetzliche Pflichten',
        'Vor Ausführungsbeginn legt der Nachunternehmer unaufgefordert vor: Gewerbeanmeldung bzw. Handwerksrolleneintrag, Freistellungsbescheinigung nach § 48b EStG, Unbedenklichkeitsbescheinigungen der Sozialversicherungsträger und der Berufsgenossenschaft, Nachweis SOKA-Bau (soweit einschlägig) sowie den Nachweis einer Betriebshaftpflichtversicherung mit angemessener Deckungssumme.',
        'Der Nachunternehmer sichert zu, den Mindestlohn nach MiLoG und AEntG sowie alle sozialversicherungs-, melde- und aufenthaltsrechtlichen Vorschriften einzuhalten, und stellt den Auftraggeber von einer Inanspruchnahme aus der Auftraggeberhaftung (§ 13 MiLoG, § 14 AEntG, § 28e Abs. 3a SGB IV) frei.',
        'Auf Verlangen sind Personallisten und Ausweise der eingesetzten Kräfte vorzulegen. Bei fehlenden Nachweisen kann der Auftraggeber die Aufnahme der Arbeiten untersagen; hieraus entstehende Verzögerungen gehen zulasten des Nachunternehmers.'),
      sec('Abrechnung und Zahlung',
        `Rechnungen sind prüffähig mit Aufmaß und Leistungsnachweis einzureichen. Zahlung erfolgt innerhalb von ${or(f.payDays, '30')} Tagen nach Zugang der prüffähigen Rechnung und Abnahme der Leistung.`,
        'Abschlagszahlungen werden nach nachgewiesenem Leistungsstand geleistet.',
        'Als Sicherheit für die vertragsgemäße Ausführung und Gewährleistung wird ein Einbehalt von 5 % der Netto-Abrechnungssumme vereinbart. Der Einbehalt kann jederzeit durch eine unbefristete, selbstschuldnerische Bürgschaft eines deutschen Kreditinstituts abgelöst werden und wird nach Ablauf der Gewährleistungsfrist bzw. nach Ablösung freigegeben.',
        'Eine Aufrechnung durch den Nachunternehmer ist nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen zulässig.'),
      sec('Ausführung, Koordination und Arbeitsschutz',
        'Der Nachunternehmer prüft die Vorleistungen und meldet Bedenken unverzüglich schriftlich an.',
        'Er koordiniert sich mit der Bauleitung und den übrigen Gewerken, hält die Baustellenordnung, die Vorgaben des SiGe-Koordinators und alle Arbeitsschutzvorschriften ein und stellt die persönliche Schutzausrüstung seines Personals selbst.',
        'Die Baustelle ist täglich besenrein zu hinterlassen. Kommt der Nachunternehmer der Reinigungs- oder Entsorgungspflicht nach angemessener Fristsetzung nicht nach, kann der Auftraggeber sie auf Kosten des Nachunternehmers durchführen lassen.'),
      sec('Abnahme und Gewährleistung',
        'Die Abnahme erfolgt förmlich nach schriftlicher Fertigstellungsanzeige unter Aufnahme eines gemeinsamen Protokolls. Eine fiktive Abnahme durch Ingebrauchnahme oder Zeitablauf ist ausgeschlossen.',
        'Die Gewährleistungsfrist beträgt 5 Jahre ab Abnahme für Bauwerksleistungen (§ 634a Abs. 1 Nr. 2 BGB).',
        'Mängel sind nach schriftlicher Aufforderung innerhalb angemessener Frist zu beseitigen. Bei Gefahr im Verzug oder fruchtlosem Fristablauf darf der Auftraggeber die Mängel auf Kosten des Nachunternehmers beseitigen lassen (Selbstvornahme).'),
      sec('Kündigung, Abwerbeverbot, Schlussbestimmungen',
        'Der Auftraggeber kann den Vertrag jederzeit aus wichtigem Grund kündigen, insbesondere bei erheblichen Vertragsverstößen, fehlenden Nachweisen, Zahlungsunfähigkeit oder wiederholt mangelhafter Leistung.',
        'Der Nachunternehmer verpflichtet sich, Auftraggeber-Kunden während der Vertragslaufzeit und 12 Monate danach nicht unmittelbar für gleichartige Leistungen anzusprechen; Mitarbeiter des Auftraggebers werden nicht abgeworben.',
        'Über alle Kalkulationen, Preise und Kundendaten ist Stillschweigen zu bewahren.',
        'Änderungen bedürfen der Schriftform. Erfüllungsort und – soweit gesetzlich zulässig – Gerichtsstand ist der Sitz des Auftraggebers. Es gilt deutsches Recht. Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam.'),
    ],
    placeDate: `${or(f.signPlace, c.city || '…')}, ${shortDate(f.date || todayISO())}`,
    signatures: [`${c.name} (Auftraggeber)`, or(f.name, 'Nachunternehmer')],
  };
}

function bau(f, c) {
  const consumer = f.consumer === 'Ja';
  const unit = f.priceType === 'Einheitspreise nach Aufmaß';
  return {
    title: 'Bauvertrag mit Kunden',
    parties: [
      { label: 'Auftragnehmer', text: companyBlock(c), plain: true },
      { label: 'Auftraggeber (Kunde)', text: partnerBlock(f) },
    ],
    intro: INTRO,
    sections: [
      sec('Vertragsgegenstand',
        `${c.name} übernimmt für ${or(f.name, '…')} folgende Leistungen: ${f.scope ? noDot(f.scope) + '.' : DOTS}`,
        `Bauvorhaben: ${f.site ? noDot(f.site) + '.' : DOTS}`,
        'Vertragsgrundlagen sind dieser Vertrag, das zugrunde liegende Angebot mit Leistungsbeschreibung sowie die anerkannten Regeln der Technik. Bei Widersprüchen gilt diese Reihenfolge.',
        'Nicht ausdrücklich beschriebene Leistungen sind nicht geschuldet.'),
      sec('Vergütung und Zahlung',
        `Die Vergütung beträgt ${amount(f.amount)} EUR brutto (inkl. gesetzlicher Umsatzsteuer) als ${unit ? 'Einheitspreise nach Aufmaß' : 'Pauschalfestpreis'}.`,
        consumer
          ? 'Der Auftragnehmer kann Abschlagszahlungen nach dem Wert der jeweils nachgewiesenen, vertragsgemäß erbrachten Leistungen verlangen (§ 632a BGB), insgesamt höchstens 90 % der vereinbarten Gesamtvergütung (§ 650m BGB).'
          : 'Der Auftragnehmer kann Abschlagszahlungen nach dem Wert der jeweils nachgewiesenen, vertragsgemäß erbrachten Leistungen verlangen (§ 632a BGB).',
        `Rechnungen sind innerhalb von ${or(f.payDays, '14')} Tagen nach Zugang ohne Abzug zur Zahlung fällig. Ein Skontoabzug ist nicht vereinbart.`,
        'Die Schlussrechnung wird nach Abnahme gestellt. Der Auftraggeber kann bei wesentlichen Mängeln einen angemessenen Teil der Vergütung bis zur Beseitigung zurückbehalten.',
        'Leistungen, die auf Wunsch des Auftraggebers zusätzlich ausgeführt werden, werden gesondert vergütet und vor Ausführung in Textform vereinbart (§ 650b BGB).'),
      sec('Ausführungszeit und Behinderungen',
        `Voraussichtlicher Baubeginn: ${f.start ? longDate(f.start) + '.' : DOTS} Voraussichtliche Fertigstellung: ${f.end ? longDate(f.end) + '.' : DOTS}`,
        'Die Fristen verlängern sich angemessen bei Umständen, die der Auftragnehmer nicht zu vertreten hat, insbesondere fehlende Mitwirkung des Auftraggebers, nachträgliche Änderungswünsche, fehlende Vorleistungen anderer, behördliche Verzögerungen, Lieferausfälle oder Witterungseinflüsse, die die Ausführung unzumutbar machen.',
        'Behinderungen werden dem Auftraggeber unverzüglich angezeigt.'),
      sec('Mitwirkungspflichten des Auftraggebers',
        'Der Auftraggeber stellt rechtzeitig und unentgeltlich zur Verfügung: freien und ungehinderten Zugang zur Baustelle, Bau- und Reinigungsstrom, Bauwasser, geeignete Lager- und Stellflächen sowie ggf. Halteverbotszonen.',
        'Erforderliche Genehmigungen, Statik und Nachweise sowie Angaben zu Leitungsverläufen und Schadstoffen (z. B. Asbest) obliegen dem Auftraggeber. Räume sind vor Arbeitsbeginn geräumt zu übergeben.',
        'Kommt der Auftraggeber diesen Pflichten nicht nach, kann der Auftragnehmer die dadurch entstehenden Mehrkosten und Wartezeiten in Rechnung stellen.'),
      sec('Abnahme',
        'Nach Fertigstellungsanzeige erfolgt die Abnahme innerhalb von 12 Werktagen, im Regelfall förmlich mit gemeinsamem Protokoll (§ 640 BGB).',
        'Unwesentliche Mängel berechtigen nicht zur Verweigerung der Abnahme; sie werden im Protokoll festgehalten und zeitnah beseitigt.',
        consumer
          ? 'Nimmt der Auftraggeber die Leistung in Gebrauch oder verweigert er die Abnahme nicht innerhalb der gesetzten angemessenen Frist unter Angabe wesentlicher Mängel, gilt die Leistung als abgenommen (§ 640 Abs. 2 BGB). Auf diese Folge wird der Auftraggeber mit der Aufforderung zur Abnahme in Textform gesondert hingewiesen.'
          : 'Nimmt der Auftraggeber die Leistung in Gebrauch oder verweigert er die Abnahme nicht innerhalb der gesetzten angemessenen Frist unter Angabe wesentlicher Mängel, gilt die Leistung als abgenommen (§ 640 Abs. 2 BGB).'),
      sec('Gewährleistung und Haftung',
        'Die Gewährleistungsfrist für Bauwerksleistungen beträgt 5 Jahre ab Abnahme (§ 634a Abs. 1 Nr. 2 BGB).',
        'Mängel sind in Textform anzuzeigen. Der Auftragnehmer erhält Gelegenheit zur Nacherfüllung innerhalb angemessener Frist; erst danach kommen weitere Rechte in Betracht. Eigenmächtige Beauftragung Dritter vor Fristablauf schließt Kostenerstattung aus.',
        'Für Schäden aus der Verletzung von Leben, Körper und Gesundheit sowie bei Vorsatz und grober Fahrlässigkeit haftet der Auftragnehmer unbeschränkt nach den gesetzlichen Bestimmungen. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt; im Übrigen ist die Haftung ausgeschlossen.',
        'Der Auftragnehmer unterhält eine Betriebshaftpflichtversicherung.'),
      sec('Änderungen, Kündigung und Eigentum',
        'Änderungswünsche des Auftraggebers werden in Textform vereinbart; der Auftragnehmer legt hierzu ein Nachtragsangebot vor (§ 650b BGB).',
        'Bis zur vollständigen Bezahlung bleibt das eingebaute Material, soweit rechtlich möglich, Eigentum des Auftragnehmers.',
        'Kündigt der Auftraggeber den Vertrag frei, so steht dem Auftragnehmer die vereinbarte Vergütung abzüglich ersparter Aufwendungen zu (§ 648 BGB). Das Recht beider Seiten zur Kündigung aus wichtigem Grund (§ 648a BGB) bleibt unberührt.',
        'Der Auftragnehmer darf Lichtbilder des fertiggestellten Werks für eigene Referenzzwecke verwenden, sofern keine personenbezogenen Daten erkennbar sind und der Auftraggeber nicht widerspricht.'),
      sec('Schlussbestimmungen',
        consumer
          ? 'Der Auftraggeber ist Verbraucher. Ihm steht das gesetzliche Widerrufsrecht nach § 650l BGB zu; die Widerrufsbelehrung wird ihm gesondert in Textform ausgehändigt. Es gilt der gesetzliche Gerichtsstand.'
          : 'Der Auftraggeber ist Unternehmer. Ein Widerrufsrecht besteht nicht. Erfüllungsort und Gerichtsstand ist der Sitz des Auftragnehmers.',
        'Änderungen und Ergänzungen bedürfen der Textform. Mündliche Nebenabreden bestehen nicht.',
        'Es gilt deutsches Recht. Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam; an die Stelle der unwirksamen Regelung tritt die gesetzliche Regelung.'),
    ],
    placeDate: `${or(f.signPlace, c.city || '…')}, ${shortDate(f.date || todayISO())}`,
    signatures: [`${c.name} (Auftragnehmer)`, or(f.name, 'Auftraggeber')],
  };
}

const BUILDERS = { arbeit, sub, bau };

export function buildContract(type, form, company) {
  return BUILDERS[type](form, company);
}

export function contractName(type, form) {
  return `${CONTRACT_TYPES[type].label} – ${or(form.name, 'ohne Namen')}`;
}

// Der Bauvertrag aus der bisherigen App (15.10.2026)
export const SEED_CONTRACT_FORM = {
  name: 'Bcmp GbR Marvin Pitsch',
  address: 'Birkenweg 16\n34255 Staufenberg',
  scope: 'Fassadensanierung inkl. Material: Baustelleneinrichtung, Gerüstaufstellung, Untergrundvorbereitung, Grundierung, eine Schicht Kalkzementputz an allen erforderlichen Stellen, eine Armierungsschicht, Fensterarbeiten, Sockelarbeiten, Oberputz (Scheibenputz 2mm), Fassadenanstrich und Entsorgung von Müll',
  site: 'Zentgrafenstr. 37, 34130 Kassel',
  amount: '31416',
  priceType: 'Einheitspreise nach Aufmaß',
  start: '2026-10-26',
  end: '',
  payDays: '7',
  consumer: 'Nein',
  signPlace: 'Vellmar',
  date: '2026-10-15',
};
