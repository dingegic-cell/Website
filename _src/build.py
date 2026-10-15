#!/usr/bin/env python3
"""Erzeugt alle HTML-Seiten der Website.

Alle Texte stehen in dieser Datei. Nach einer Änderung im Hauptordner ausführen:

    python3 _src/build.py

Die fertigen Seiten (index.html, leistungen/…, kontakt.html usw.) werden neu geschrieben.
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def e(text):
    return escape(text, quote=True)


# ---------------------------------------------------------------------------
# Firmendaten
# ---------------------------------------------------------------------------
COMPANY = {
    "name": "Nordbau Projektentwicklung",
    "owner": "Din Gegic",
    "street": "Warburger Str. 30",
    "city": "34246 Vellmar",
    "phone": "0157 55234836",
    "phone_href": "+4915755234836",
    "email": "info@nordbau-projekt.de",
    "tax": "026 820 63511",
}
MAPS_QUERY = "Warburger+Str.+30,+34246+Vellmar"
MAPS_EMBED = f"https://www.google.com/maps?q={MAPS_QUERY}&output=embed"
MAPS_LINK = f"https://www.google.com/maps/search/?api=1&query={MAPS_QUERY}"
FORM_ACTION = f"https://formsubmit.co/{COMPANY['email']}"

# ---------------------------------------------------------------------------
# Icons (Linien-Icons im Stil von Lucide, MIT-Lizenz)
# ---------------------------------------------------------------------------
ICONS = {
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "left": '<path d="m15 18-6-6 6-6"/>',
    "right": '<path d="m9 18 6-6-6-6"/>',
    "brush": '<path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/>',
    "layout": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    "thermo": '<path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="m6.6 18.4-1.4 1.4"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M4 13H2"/><path d="M6.34 7.34 4.93 5.93"/>',
    "floor": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/>',
    "brick": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 9v6"/><path d="M16 15v6"/><path d="M16 3v6"/><path d="M3 15h18"/><path d="M3 9h18"/><path d="M8 15v6"/><path d="M8 3v6"/>',
    "badge": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    "wallet": '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    "calendar": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    "external": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "quote": '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
}


def icon(name, cls="icon"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


def stars(n=5):
    star = ('<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
            '<path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z"/></svg>')
    return f'<div class="stars" role="img" aria-label="{n} von 5 Sternen">{star * n}</div>'


# ---------------------------------------------------------------------------
# Bilder
# ---------------------------------------------------------------------------
IMAGES = {
    "rohbau": (1046, 816),
    "fassade": (1046, 820),
    "bad": (1046, 814),
    "innenputz": (1046, 814),
}


def picture(r, name, alt="", eager=False):
    w, h = IMAGES[name]
    loading = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<picture><source srcset="{r}assets/img/projekt-{name}.webp" type="image/webp">'
            f'<img src="{r}assets/img/projekt-{name}.jpg" alt="{e(alt)}" width="{w}" height="{h}" '
            f'{loading} decoding="async"></picture>')


# ---------------------------------------------------------------------------
# Inhalte: Leistungen
# ---------------------------------------------------------------------------
SERVICES = [
    {
        "slug": "malerarbeiten",
        "title": "Malerarbeiten",
        "icon": "brush",
        "img": "innenputz",
        "short": "Saubere Anstriche, Tapeten und Spachteltechniken für Innen und Außen.",
        "intro": "Von der klassischen Wohnungsrenovierung bis zur hochwertigen Spachteltechnik: Wir bereiten "
                 "Untergründe fachgerecht vor und arbeiten mit emissionsarmen Qualitätsfarben – staubarm, "
                 "termingerecht und mit sauberer Baustelle.",
        "scope": [
            "Innen- und Außenanstriche",
            "Tapezier- und Spachtelarbeiten",
            "Dekorative Techniken & Lasuren",
            "Fassadenanstrich inkl. Untergrundsanierung",
            "Lackierarbeiten an Türen, Zargen und Heizkörpern",
        ],
        "steps": [
            ("Aufmaß & Beratung", "Wir prüfen den Untergrund vor Ort und beraten zu Farbe, Material und Ausführung."),
            ("Festpreisangebot", "Sie erhalten ein transparentes Angebot mit klaren Positionen – ohne versteckte Kosten."),
            ("Ausführung", "Abdecken, Vorbereiten, Streichen – im vereinbarten Zeitfenster mit festen Ansprechpartnern."),
            ("Abnahme", "Gemeinsame Begehung, Feinkorrekturen und besenreine Übergabe."),
        ],
    },
    {
        "slug": "trockenbauarbeiten",
        "title": "Trockenbauarbeiten",
        "icon": "layout",
        "img": "innenputz",
        "short": "Wände, Decken und Dachgeschossausbau – millimetergenau umgesetzt.",
        "intro": "Neue Raumaufteilung, abgehängte Decken oder Schall- und Brandschutz: Wir planen und montieren "
                 "Trockenbaukonstruktionen präzise und normgerecht – inklusive Dämmung, Beplankung und "
                 "Q1–Q4-Oberflächen.",
        "scope": [
            "Trennwände & Vorsatzschalen",
            "Abgehängte Decken mit Lichtvouten",
            "Dachgeschoss- und Innenausbau",
            "Schall-, Wärme- und Brandschutz",
            "Spachtelqualitäten Q1 bis Q4",
        ],
        "steps": [
            ("Planung", "Wir klären Statik, Leitungswege und Aufbauhöhen vor der ersten Schraube."),
            ("Unterkonstruktion", "Metall- oder Holzständerwerk exakt gelotet und schallentkoppelt."),
            ("Beplankung & Dämmung", "Fachgerechte Dämmung und Plattenmontage nach Normanforderung."),
            ("Oberfläche", "Verspachteln in der gewünschten Qualitätsstufe – malerfertig."),
        ],
    },
    {
        "slug": "innen-aussenputz",
        "title": "Innen- & Außenputz",
        "icon": "layers",
        "img": "fassade",
        "short": "Glatte Innenflächen und wetterfeste Fassadenputze in jeder Struktur.",
        "intro": "Ob Kalk-Zement, Gips oder mineralischer Edelputz – wir bringen Flächen dauerhaft in Form. "
                 "Auch bei Altbausanierung, Rissbildung oder Feuchteschäden finden wir das passende Putzsystem.",
        "scope": [
            "Gips-, Kalk- und Zementputz innen",
            "Mineralische & Silikonharzputze außen",
            "Sanierputzsysteme bei Feuchtigkeit",
            "Struktur-, Kratz- und Reibeputze",
            "Riss- und Altbausanierung",
        ],
        "steps": [
            ("Untergrundprüfung", "Haftung, Feuchte und Ebenheit werden dokumentiert."),
            ("Systemauswahl", "Wir wählen das Putzsystem passend zu Untergrund und Belastung."),
            ("Auftrag", "Maschineller Auftrag, Abziehen und Strukturieren in einem Zug."),
            ("Nachbehandlung", "Kontrollierte Trocknung und Endkontrolle der Flächen."),
        ],
    },
    {
        "slug": "wdvs-waermedaemmverbundsystem",
        "title": "WDVS / Wärmedämmverbundsystem",
        "icon": "thermo",
        "img": "fassade",
        "short": "Energetische Fassadensanierung mit spürbar niedrigeren Heizkosten.",
        "intro": "Wir dämmen Fassaden fachgerecht nach GEG – von der Bestandsaufnahme über Dübelplan und "
                 "Armierung bis zur Schlussbeschichtung. So senken Sie Energiekosten und erhöhen den Wert "
                 "Ihrer Immobilie.",
        "scope": [
            "EPS-, Mineralwolle- und Holzfasersysteme",
            "Sockel- und Perimeterdämmung",
            "Detaillösungen an Fenstern & Anschlüssen",
            "Armierung und Schlussbeschichtung",
            "Unterstützung bei Förderanträgen",
        ],
        "steps": [
            ("Bestandsaufnahme", "Aufbau, Untergrundfestigkeit und Wärmebrücken werden erfasst."),
            ("Systemplanung", "Dämmstoff, Stärke und Befestigung werden objektbezogen festgelegt."),
            ("Montage", "Kleben, Dübeln, Armieren – lückenlos und wärmebrückenarm."),
            ("Finish", "Grundierung und Schlussputz in Ihrer Farb- und Strukturwahl."),
        ],
    },
    {
        "slug": "bodenverlegung",
        "title": "Bodenverlegung",
        "icon": "floor",
        "img": "bad",
        "short": "Parkett, Vinyl, Laminat und Designböden – perfekt vorbereitet verlegt.",
        "intro": "Der schönste Boden hält nur so lange wie sein Untergrund. Wir prüfen, spachteln und grundieren, "
                 "bevor wir verlegen – für ein ruhiges Fugenbild und dauerhaft feste Flächen.",
        "scope": [
            "Parkett & Massivholzdielen",
            "Vinyl-, Design- und Klickböden",
            "Laminat & Teppichböden",
            "Untergrundvorbereitung & Ausgleich",
            "Sockelleisten und Übergangsprofile",
        ],
        "steps": [
            ("Messung", "Restfeuchte und Ebenheit des Untergrunds werden gemessen."),
            ("Vorbereitung", "Grundieren, Spachteln, Schleifen – die Basis für jedes gute Ergebnis."),
            ("Verlegung", "Sauberer Verlegeplan mit optimaler Ausrichtung und Dehnungsfugen."),
            ("Abschluss", "Leisten, Profile und Endreinigung inklusive."),
        ],
    },
    {
        "slug": "maurerarbeiten",
        "title": "Maurerarbeiten",
        "icon": "brick",
        "img": "rohbau",
        "short": "Mauerwerk, Durchbrüche und Betonarbeiten – fachgerecht ausgeführt.",
        "intro": "Neubau, Umbau oder Sanierung: Wir mauern, betonieren und stellen tragfähige Anschlüsse her – "
                 "inklusive Wanddurchbrüchen mit Sturz, statisch abgestimmt und sauber ausgeführt.",
        "scope": [
            "Mauerwerk in Ziegel, Kalksandstein, Beton",
            "Wanddurchbrüche inkl. Sturzeinbau",
            "Fundamente & Bodenplatten",
            "Kelleraußenwandsanierung",
            "Sanierung von Rissen und Mauerwerksschäden",
        ],
        "steps": [
            ("Statikcheck", "Wir klären mit Statiker, welche Eingriffe möglich sind."),
            ("Baustelleneinrichtung", "Abstützungen, Staubschutz und Entsorgung werden organisiert."),
            ("Rohbauarbeiten", "Mauern, Betonieren, Stürze setzen – normgerecht dokumentiert."),
            ("Übergabe", "Anschlüsse verputzt, Baustelle geräumt, Nachweise übergeben."),
        ],
    },
]

PROMISES = [
    ("badge", "Erfahrenes Fachteam", "Über 25 Jahre Praxis – geprüfte Ausführung nach Norm und Regelwerk."),
    ("wallet", "Festpreisgarantie", "Ihr Angebot ist verbindlich. Keine Nachträge, die nicht vorher abgestimmt sind."),
    ("calendar", "Termintreue", "Verbindliche Zeitfenster und feste Ansprechpartner vom Aufmaß bis zur Abnahme."),
    ("shield", "Gewährleistung", "Volle gesetzliche Gewährleistung – und ein Team, das auch danach erreichbar bleibt."),
]

STATS = [
    (25, "+", "Jahre Erfahrung"),
    (100, "+", "Abgeschlossene Projekte"),
    (98, "%", "Zufriedene Kunden"),
    (10, "+", "Fachkräfte im Team"),
]

# Weitere Kundenstimmen einfach hier ergänzen – Slider und Bewertungsseite passen sich an.
TESTIMONIALS = [
    {
        "text": "Unser komplettes Haus mit rund 120 m² wurde verspachtelt – gleichmäßige, malerfertige Flächen "
                "und eine jeden Abend aufgeräumte Baustelle.",
        "name": "Familie Walden",
        "place": "Kassel",
        "stars": 5,
    },
]

PROJECTS = [
    {
        "img": "rohbau",
        "tag": "Rohbau",
        "title": "Mehrfamilienhaus im Rohbau",
        "text": "Tragende Wände, Geschossdecken und Balkonanschlüsse entstehen hier im Zusammenspiel mit dem "
                "Rohbau – maßgenau ausgeführt, sauber dokumentiert und pünktlich für die nachfolgenden Gewerke bereit.",
    },
    {
        "img": "fassade",
        "tag": "Fassade",
        "title": "Fassade nach der Modernisierung",
        "text": "Untergrund saniert, Fassadenflächen gedämmt und in gleichmäßigem Farbton beschichtet. Das Ergebnis: "
                "klare Kanten, geschlossene Anschlüsse und ein Erscheinungsbild, das Wind und Wetter dauerhaft trotzt.",
    },
    {
        "img": "bad",
        "tag": "Fliesenverlegung",
        "title": "Neues Badezimmer, fliesenfertig übergeben",
        "text": "Großformatige Wandfliesen im exakten Fugenbild, ein sauber abgedichteter Duschbereich und "
                "passgenaue Anschlüsse an Sanitärobjekte – ein Bad, das sich pflegeleicht und wertig anfühlt.",
    },
    {
        "img": "innenputz",
        "tag": "Innenputz",
        "title": "Innenputz in Wohnräumen",
        "text": "Wände und Decken maschinell verputzt, abgezogen und filzglatt nachgearbeitet. Ebene, malerfertige "
                "Flächen ohne Wellen – die perfekte Basis für Anstrich, Tapete oder Spachteltechnik.",
    },
]


def service_url(r, s):
    return f"{r}leistungen/{s['slug']}.html"


# ---------------------------------------------------------------------------
# Bausteine
# ---------------------------------------------------------------------------
def head(r, title, desc, noindex=False):
    robots = '\n  <meta name="robots" content="noindex">' if noindex else ""
    return f"""<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">{robots}
  <meta name="theme-color" content="#0a0d12">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="de_DE">
  <meta property="og:site_name" content="{e(COMPANY['name'])}">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <link rel="icon" type="image/png" href="{r}assets/img/favicon.png">
  <link rel="apple-touch-icon" href="{r}assets/img/apple-touch-icon.png">
  <link rel="preload" href="{r}assets/fonts/outfit-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{r}assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{r}assets/css/style.css">
  <script>
    (function (d) {{
      d.classList.add("js");
      setTimeout(function () {{ if (!d.classList.contains("ready")) d.classList.remove("js"); }}, 2500);
    }})(document.documentElement);
  </script>
  <script src="{r}assets/js/main.js" defer></script>
</head>"""


def header(r, current):
    def cur(key):
        return ' aria-current="page"' if current == key else ""

    service_keys = {s["slug"] for s in SERVICES}
    drop_current = " is-current" if current in service_keys else ""
    drop_items = "".join(
        f'<a class="drop-item" href="{service_url(r, s)}"{cur(s["slug"])}>'
        f'<span class="icon-box">{icon(s["icon"])}</span>'
        f'<span><strong>{e(s["title"])}</strong><span>{e(s["short"])}</span></span></a>'
        for s in SERVICES
    )
    m_services = "".join(
        f'<li><a href="{service_url(r, s)}"{cur(s["slug"])}>{e(s["title"])}</a></li>' for s in SERVICES
    )
    acc_open = " is-open" if current in service_keys else ""
    acc_expanded = "true" if current in service_keys else "false"
    return f"""
<body>
<a class="skip-link" href="#inhalt">Zum Inhalt springen</a>
<div class="loader" aria-hidden="true">
  <div class="loader-inner">
    <img src="{r}assets/img/logo-light.png" alt="" width="883" height="224">
    <div class="loader-bar"></div>
  </div>
</div>

<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="{r}index.html" aria-label="{e(COMPANY['name'])} – zur Startseite">
      <img src="{r}assets/img/logo-light.png" alt="{e(COMPANY['name'])}" width="883" height="224">
    </a>
    <nav class="nav-desktop" aria-label="Hauptnavigation">
      <a class="nav-link" href="{r}index.html"{cur("home")}>Startseite</a>
      <div class="nav-drop{drop_current}">
        <button class="nav-link" type="button" data-drop aria-expanded="false" aria-controls="drop-leistungen">Leistungen {icon("chev")}</button>
        <div class="nav-drop-panel" id="drop-leistungen">{drop_items}</div>
      </div>
      <a class="nav-link" href="{r}referenzen.html"{cur("referenzen")}>Referenzen</a>
      <a class="nav-link" href="{r}bewertungen.html"{cur("bewertungen")}>Bewertungen</a>
      <a class="nav-link" href="{r}kontakt.html"{cur("kontakt")}>Kontakt</a>
    </nav>
    <a class="btn btn-primary btn-sm header-cta" href="{r}kontakt.html">Kostenlose Beratung anfragen {icon("arrow")}</a>
    <button class="burger" type="button" data-burger aria-label="Menü öffnen" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
  </div>
</header>

<div class="mobile-menu" id="mobile-menu" aria-hidden="true" inert>
  <nav aria-label="Mobile Navigation">
    <ul class="m-nav">
      <li style="--i:0"><a class="m-link" href="{r}index.html"{cur("home")}>Startseite</a></li>
      <li class="m-acc{acc_open}" style="--i:1">
        <button class="m-link" type="button" data-acc aria-expanded="{acc_expanded}" aria-controls="m-sub">Leistungen {icon("chev")}</button>
        <div class="m-sub" id="m-sub"><div><ul>{m_services}</ul></div></div>
      </li>
      <li style="--i:2"><a class="m-link" href="{r}referenzen.html"{cur("referenzen")}>Referenzen</a></li>
      <li style="--i:3"><a class="m-link" href="{r}bewertungen.html"{cur("bewertungen")}>Bewertungen</a></li>
      <li style="--i:4"><a class="m-link" href="{r}kontakt.html"{cur("kontakt")}>Kontakt</a></li>
    </ul>
  </nav>
  <div class="m-foot">
    <a class="btn btn-primary btn-block" href="{r}kontakt.html">Kostenlose Beratung anfragen {icon("arrow")}</a>
    <div class="m-contact">
      <a href="tel:{COMPANY['phone_href']}">{icon("phone")} {e(COMPANY['phone'])}</a>
      <a href="mailto:{COMPANY['email']}">{icon("mail")} {e(COMPANY['email'])}</a>
    </div>
  </div>
</div>
"""


def contact_list(include_owner=False):
    owner = (f'<li>{icon("user")}<span>Inhaber: {e(COMPANY["owner"])}</span></li>' if include_owner else "")
    return f"""<ul class="contact-list">
        <li>{icon("pin")}<span>{e(COMPANY['street'])}<br>{e(COMPANY['city'])}</span></li>
        <li>{icon("mail")}<a href="mailto:{COMPANY['email']}">{e(COMPANY['email'])}</a></li>
        <li>{icon("phone")}<a href="tel:{COMPANY['phone_href']}">{e(COMPANY['phone'])}</a></li>
        {owner}
      </ul>"""


def footer(r):
    services = "".join(f'<li><a href="{service_url(r, s)}">{e(s["title"])}</a></li>' for s in SERVICES)
    return f"""
<footer class="site-footer">
  <div class="footer-word" aria-hidden="true" data-reveal="fade">NORDBAU</div>
  <div class="container footer-grid">
    <div class="footer-brand">
      <img src="{r}assets/img/logo-light.png" alt="{e(COMPANY['name'])}" width="883" height="224" loading="lazy">
      <p>Ausbau, Sanierung und energetische Modernisierung in Vellmar, Kassel sowie in Hessen und Niedersachsen. Ein Ansprechpartner für alle Gewerke – zum Festpreis.</p>
    </div>
    <div class="footer-col">
      <h2>Leistungen</h2>
      <ul>{services}</ul>
    </div>
    <div class="footer-col">
      <h2>Unternehmen</h2>
      <ul>
        <li><a href="{r}referenzen.html">Referenzen</a></li>
        <li><a href="{r}bewertungen.html">Bewertungen</a></li>
        <li><a href="{r}kontakt.html">Kontakt</a></li>
        <li><a href="{r}impressum.html">Impressum</a></li>
        <li><a href="{r}datenschutz.html">Datenschutz</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>Kontakt</h2>
      {contact_list()}
    </div>
  </div>
  <div class="container footer-bottom">
    <span>Copyright © 2026 {e(COMPANY['name'])}</span>
    <span>Inhaber: {e(COMPANY['owner'])}</span>
  </div>
</footer>
</body>
</html>
"""


def cta(r):
    return f"""
<section class="cta-band">
  <div class="container cta-inner">
    <h2 data-split>Ihr Projekt verdient einen sauberen Zeitplan und einen festen Preis.</h2>
    <p data-reveal style="--d:.3s">Kostenlose Vor-Ort-Beratung in Vellmar, Kassel und Umgebung – meist innerhalb von 48 Stunden.</p>
    <div data-reveal style="--d:.45s"><a class="btn btn-dark" href="{r}kontakt.html">Kostenlose Beratung anfragen {icon("arrow")}</a></div>
  </div>
</section>"""


def page_hero(r, eyebrow, title, lead="", img=None, bg_word=None, crumbs=None, plain=False):
    media = ""
    if img and not plain:
        media = (f'<div class="hero-bg" data-parallax="0.18" aria-hidden="true">'
                 f'<div class="hero-media">{picture(r, img, eager=True)}</div></div>')
    word = f'<div class="bg-word" aria-hidden="true">{e(bg_word)}</div>' if bg_word else ""
    crumb_html = ""
    if crumbs:
        parts = []
        for label, href in crumbs:
            parts.append(f'<a href="{href}">{e(label)}</a>' if href else f'<span aria-current="page">{e(label)}</span>')
        crumb_html = ('<nav class="breadcrumb" aria-label="Brotkrumen" data-reveal>'
                      + ' <span aria-hidden="true">/</span> '.join(parts) + "</nav>")
    lead_html = f'<p class="lead" data-reveal style="--d:.35s">{lead}</p>' if lead else ""
    cls = "page-hero page-hero--plain" if plain else "page-hero"
    return f"""
<section class="{cls}">
  {media}{word}
  <div class="container">
    {crumb_html}
    <p class="eyebrow" data-reveal>{e(eyebrow)}</p>
    <h1 data-split>{title}</h1>
    {lead_html}
  </div>
</section>"""


def section_head(eyebrow, title, lead="", extra="", center=False, h="h2"):
    cls = "section-head section-head--center" if center else "section-head"
    eb = f'<p class="eyebrow" data-reveal>{e(eyebrow)}</p>' if eyebrow else ""
    ld = f'<p class="lead" data-reveal style="--d:.15s">{lead}</p>' if lead else ""
    return f"""<div class="{cls}">
      {eb}
      <{h} data-split>{title}</{h}>
      {ld}
      {extra}
    </div>"""


def quote_card(t, carousel=False):
    cls = "slide" if carousel else "quote-card"
    inner = f"""<blockquote><p>„{e(t['text'])}“</p></blockquote>
        <div class="quote-foot">
          <div class="quote-author">
            {stars(t['stars'])}
            <strong>{e(t['name'])}</strong>
            <span>{e(t['place'])}</span>
          </div>
        </div>"""
    if carousel:
        return f'<div class="{cls}">{inner}</div>'
    return f'<article class="{cls}" data-reveal>{icon("quote", "quote-icon")}{inner}</article>'


def project_card(r, p, overlay=False):
    cls = "project project--overlay" if overlay else "project"
    return f"""<article class="{cls}" data-reveal>
        <div class="project-media" data-reveal="clip">{picture(r, p['img'], p['title'])}</div>
        <div class="project-body">
          <span class="tag">{e(p['tag'])}</span>
          <h3>{e(p['title'])}</h3>
          <p>{e(p['text'])}</p>
        </div>
      </article>"""


def page(r, current, title, desc, body, noindex=False):
    return head(r, title, desc, noindex) + header(r, current) + f'\n<main id="inhalt">{body}\n</main>\n' + footer(r)


# ---------------------------------------------------------------------------
# Seiten
# ---------------------------------------------------------------------------
def build_home():
    r = ""
    ticker_items = [s["title"] for s in SERVICES] + [p[1] for p in PROMISES]
    group = "".join(f'<span class="ticker-item">{e(t)}</span>' for t in ticker_items)
    cards = "".join(
        f"""<article class="card" data-reveal data-spot>
        <span class="card-num">{i:02d}</span>
        <span class="icon-box">{icon(s["icon"])}</span>
        <h3>{e(s["title"])}</h3>
        <p>{e(s["short"])}</p>
        <a class="link-arrow stretched" href="{service_url(r, s)}">Mehr erfahren {icon("arrow")}<span class="visually-hidden"> über {e(s["title"])}</span></a>
      </article>"""
        for i, s in enumerate(SERVICES, 1)
    )
    promises = "".join(
        f"""<div class="promise" data-reveal>
          {icon(ic)}
          <div><h3>{e(t)}</h3><p>{e(d)}</p></div>
          <span class="promise-num" aria-hidden="true">{i:02d}</span>
        </div>"""
        for i, (ic, t, d) in enumerate(PROMISES, 1)
    )
    slides = "".join(quote_card(t, carousel=True) for t in TESTIMONIALS)
    projects = "".join(project_card(r, p, overlay=True) for p in PROJECTS)
    stats = "".join(
        f"""<div class="stat" data-reveal>
          <span class="stat-value" data-count="{n}" data-suffix="{suf}">{n}{suf}</span>
          <span class="stat-label">{e(label)}</span>
        </div>"""
        for n, suf, label in STATS
    )

    body = f"""
<section class="hero">
  <div class="hero-bg" data-parallax="0.14" aria-hidden="true"><div class="hero-media">{picture(r, "rohbau", eager=True)}</div></div>
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow eyebrow--plain" data-reveal>Vellmar · Kassel · Hessen · Niedersachsen</p>
      <h1 data-split>Sanierung und Ausbau, <span class="accent">die messbar</span> überzeugen.</h1>
      <p class="lead" data-reveal style="--d:.5s">Neubau, Innenausbau und Altbau-Sanierung aus einer Hand: Innen- und Außenputz, Trockenbau, Malerarbeiten, WDVS, Bodenverlegung und Maurerarbeiten – zum Festpreis, termintreu und mit sauberer Baustelle.</p>
      <div class="hero-actions" data-reveal style="--d:.65s">
        <a class="btn btn-primary" href="kontakt.html">Kostenlose Beratung anfragen {icon("arrow")}</a>
        <a class="btn btn-ghost" href="#leistungen">Leistungen ansehen</a>
      </div>
    </div>
    <div class="hero-frame" data-reveal="scale" style="--d:.35s" aria-hidden="true">
      <div class="hero-frame-media" data-parallax="0.05">{picture(r, "fassade")}</div>
      <div class="chip chip--a"><span class="icon-box">{icon("badge")}</span><span><strong>25+ Jahre</strong><span>Erfahrung</span></span></div>
      <div class="chip chip--b"><span>{stars()}<strong>5 Sterne</strong><span>von unseren Auftraggebern</span></span></div>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true">Scrollen</div>
  <div class="ticker" aria-hidden="true">
    <div class="ticker-track"><div class="ticker-group">{group}</div><div class="ticker-group">{group}</div></div>
  </div>
</section>

<section class="section" id="leistungen">
  <div class="container">
    {section_head("Leistungen", "Alle Gewerke, ein Ansprechpartner",
                  "Sechs Kernleistungen, die wir mit eigenen Fachkräften ausführen – einzeln beauftragbar oder als komplette Sanierung im Paket.")}
    <div class="services-grid" data-stagger="90">{cards}</div>
  </div>
</section>

<section class="section section--alt">
  <div class="container promise-layout">
    {section_head("Warum Nordbau?", "Vier Versprechen, die wir schriftlich geben",
                  "Baustellen scheitern selten am Material, sondern an Organisation. Genau dort setzen wir an.")}
    <div data-stagger="110">{promises}</div>
  </div>
</section>

<section class="section">
  <div class="container reviews-layout">
    {section_head("Kundenstimmen", "Durchgehend 5 Sterne von unseren Auftraggebern",
                  "Was unsere Auftraggeber über Ablauf, Sauberkeit und Ergebnis sagen.",
                  f'<a class="link-arrow" href="bewertungen.html" data-reveal style="--d:.25s">Alle Bewertungen lesen {icon("arrow")}</a>')}
    <div class="quote-card carousel" data-carousel data-slides="{len(TESTIMONIALS)}" data-reveal aria-roledescription="Karussell" aria-label="Kundenstimmen">
      {icon("quote", "quote-icon")}
      {slides}
      <div class="quote-foot">
        <span></span>
        <div class="carousel-controls">
          <span class="carousel-count" data-carousel-count>1 / {len(TESTIMONIALS)}</span>
          <button class="round-btn" type="button" data-prev aria-label="Vorherige Bewertung">{icon("left")}</button>
          <button class="round-btn round-btn--accent" type="button" data-next aria-label="Nächste Bewertung">{icon("right")}</button>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container">
    <div class="results-intro">
      {section_head("Referenzen", "Ergebnisse, die man anfassen kann",
                    "Echte Baustellen aus Hessen und Niedersachsen – Rohbau, Fassade, Fliesenverlegung und Innenputz.")}
      <div class="results-copy" data-reveal>
        <h3>Projekte aus unserem Alltag</h3>
        <p>Wir dokumentieren jede Baustelle professionell: vom Rohbau über die Fassadensanierung bis zur fertigen Wand- und Bodenfläche. In unserer Galerie sehen Sie, wie wir arbeiten – sauber, termintreu und mit echten Handwerksergebnissen.</p>
        <a class="btn btn-primary" href="referenzen.html">Alle Referenzen ansehen {icon("arrow")}</a>
      </div>
    </div>
    <div class="project-grid project-grid--home" data-stagger="120">{projects}</div>
  </div>
</section>

<section class="stats-band section--tight">
  <div class="container stats" data-stagger="120">{stats}</div>
</section>
{cta(r)}"""
    return page(
        r, "home",
        "Nordbau Projektentwicklung – Sanierung & Ausbau in Vellmar und Kassel",
        "Neubau, Innenausbau und Altbau-Sanierung aus einer Hand: Putz, Trockenbau, Malerarbeiten, WDVS, "
        "Bodenverlegung und Maurerarbeiten – zum Festpreis, termintreu und mit sauberer Baustelle.",
        body,
    )


def build_service(s):
    r = "../"
    scope = "".join(
        f'<li data-reveal><span class="check">{icon("check")}</span><span>{e(x)}</span></li>' for x in s["scope"]
    )
    steps = "".join(
        f"""<li class="step" data-reveal>
            <span class="step-num">{i}</span>
            <div><h3>{e(t)}</h3><p>{e(d)}</p></div>
          </li>"""
        for i, (t, d) in enumerate(s["steps"], 1)
    )
    others = "".join(
        f'<li><a href="{service_url(r, o)}">{e(o["title"])} {icon("arrow")}</a></li>' for o in SERVICES if o is not s
    )
    body = page_hero(
        r, "Leistung", e(s["title"]), e(s["intro"]), img=s["img"],
        crumbs=[("Startseite", f"{r}index.html"), ("Leistungen", f"{r}index.html#leistungen"), (s["title"], None)],
    ) + f"""

<section class="section">
  <div class="container detail-grid">
    <div class="detail-main">
      <div>
        {section_head("Leistungsumfang", "Das übernehmen wir für Sie")}
        <ul class="scope-list" data-stagger="70">{scope}</ul>
      </div>
      <div>
        {section_head("Ablauf", "So läuft Ihr Auftrag ab")}
        <ol class="steps" data-steps>{steps}</ol>
      </div>
    </div>
    <aside class="detail-aside" aria-label="Angebot anfragen">
      <div class="offer-card" data-reveal>
        <h3>Angebot für {e(s["title"])}</h3>
        <p>Senden Sie uns Fotos und ein paar Angaben zum Objekt – Sie erhalten ein verbindliches Festpreisangebot, meist innerhalb von 48 Stunden.</p>
        <a class="btn btn-primary btn-block" href="{r}kontakt.html">Kostenlose Beratung {icon("arrow")}</a>
        <hr>
        <p class="eyebrow eyebrow--plain">Weitere Leistungen</p>
        <ul class="more-links">{others}</ul>
      </div>
    </aside>
  </div>
</section>

<section class="section section--alt section--tight">
  <div class="container">
    <div class="prep-card" data-reveal>
      <p class="eyebrow eyebrow--plain">In Vorbereitung</p>
      <h2>Projektbilder folgen in Kürze</h2>
      <p>Wir dokumentieren unsere aktuellen Baustellen professionell. Gern zeigen wir Ihnen vergleichbare Referenzen zu {e(s["title"])} direkt im Beratungsgespräch.</p>
      <a class="btn btn-primary" href="{r}kontakt.html">Beratung anfragen {icon("arrow")}</a>
    </div>
  </div>
</section>
{cta(r)}"""
    return page(r, s["slug"], f"{s['title']} – Nordbau Projektentwicklung", s["intro"], body)


def build_referenzen():
    r = ""
    cards = "".join(project_card(r, p) for p in PROJECTS)
    body = page_hero(
        r, "Referenzen", "Projekte, die für sich sprechen",
        "Über 100 abgeschlossene Aufträge in Hessen und Niedersachsen – ein Auszug aus Rohbau, Fassade, "
        "Fliesenverlegung und Innenputz.",
        img="rohbau",
    ) + f"""

<section class="section">
  <div class="container">
    {section_head("Projektgalerie", "Ausgewählte Projekte nach Gewerk",
                  "Echte Baustellen aus unserem Alltag – vom Rohbau bis zur fertigen Oberfläche.")}
    <div class="project-grid" data-stagger="120">{cards}</div>
    <div class="center-actions" data-reveal><a class="btn btn-primary" href="kontakt.html">Weitere Referenzen anfragen {icon("arrow")}</a></div>
  </div>
</section>
{cta(r)}"""
    return page(r, "referenzen", "Referenzen – Nordbau Projektentwicklung",
                "Über 100 abgeschlossene Aufträge in Hessen und Niedersachsen – ein Auszug aus Rohbau, Fassade, "
                "Fliesenverlegung und Innenputz.", body)


def build_bewertungen():
    r = ""
    cards = "".join(quote_card(t) for t in TESTIMONIALS)
    body = page_hero(
        r, "Kundenstimmen", "Durchgehend 5 Sterne von unseren Auftraggebern",
        "Was unsere Auftraggeber über Ablauf, Sauberkeit und Ergebnis sagen.",
        img="bad",
    ) + f"""

<section class="section">
  <div class="container">
    <div class="review-list" data-stagger="120">{cards}</div>
  </div>
</section>
{cta(r)}"""
    return page(r, "bewertungen", "Bewertungen – Nordbau Projektentwicklung",
                "Was unsere Auftraggeber über Ablauf, Sauberkeit und Ergebnis sagen.", body)


def build_kontakt():
    r = ""
    options = "".join(f'<option>{e(s["title"])}</option>' for s in SERVICES)
    body = page_hero(
        r, "Kontakt", "Lassen Sie uns über Ihr Projekt sprechen",
        "Beschreiben Sie kurz Ihr Vorhaben und laden Sie gern Fotos hoch. Sie erhalten in der Regel innerhalb "
        "von 24 Stunden eine Rückmeldung.",
        img="fassade",
    ) + f"""

<section class="section">
  <div class="container contact-grid">
    <div class="form-card" data-reveal>
      <h2>Kostenlose Beratung anfragen</h2>
      <form action="{FORM_ACTION}" method="POST" enctype="multipart/form-data" data-contact-form>
        <input type="hidden" name="_subject" value="Neue Anfrage über die Website">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_next" value="">
        <input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="form-grid">
          <div class="field">
            <label for="f-name">Name*</label>
            <input class="input" id="f-name" name="Name" type="text" placeholder="Vor- und Nachname" autocomplete="name" required>
          </div>
          <div class="field">
            <label for="f-tel">Telefon*</label>
            <input class="input" id="f-tel" name="Telefon" type="tel" placeholder="0561 …" autocomplete="tel" required>
          </div>
          <div class="field">
            <label for="f-mail">E-Mail*</label>
            <input class="input" id="f-mail" name="email" type="email" placeholder="name@beispiel.de" autocomplete="email" required>
          </div>
          <div class="field">
            <label for="f-service">Gewünschte Leistung*</label>
            <select class="input" id="f-service" name="Leistung" required>
              <option value="" disabled selected>Bitte wählen</option>
              {options}
            </select>
          </div>
          <div class="field field--full">
            <label for="f-msg">Nachricht*</label>
            <textarea class="input" id="f-msg" name="Nachricht" placeholder="Objektart, Fläche, gewünschter Zeitraum …" required></textarea>
          </div>
          <div class="field field--full">
            <span class="label" id="f-files-label">Fotos hochladen (optional)</span>
            <label class="dropzone">
              {icon("upload")}
              <span>JPG oder PNG – mehrere Dateien möglich</span>
              <span class="file-list" data-file-list aria-live="polite"></span>
              <input type="file" name="attachment" accept="image/jpeg,image/png" multiple aria-labelledby="f-files-label">
            </label>
          </div>
          <p class="form-note field--full">Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß <a href="datenschutz.html">Datenschutzerklärung</a> zu.</p>
          <div class="field--full"><button class="btn btn-primary btn-block" type="submit">Anfrage absenden {icon("arrow")}</button></div>
        </div>
      </form>
    </div>

    <div class="aside-stack" data-stagger="120">
      <div class="info-card info-card--dark" data-reveal>
        <h2>Kontaktdaten</h2>
        {contact_list(include_owner=True)}
      </div>
      <div class="info-card" data-reveal>
        <h3>{icon("clock")} Öffnungszeiten</h3>
        <dl class="hours">
          <div><dt>Montag – Freitag</dt><dd>07:30 – 17:00 Uhr</dd></div>
          <div><dt>Samstag</dt><dd>nach Vereinbarung</dd></div>
          <div><dt>Sonntag</dt><dd>geschlossen</dd></div>
        </dl>
      </div>
      <div class="map-card" data-reveal data-map-src="{e(MAPS_EMBED)}">
        <a class="map-open" href="{MAPS_LINK}" target="_blank" rel="noopener">In Maps öffnen {icon("external")}</a>
        <div class="map-consent">
          {icon("pin", "map-pin")}
          <button class="btn btn-ghost btn-sm" type="button" data-map-load>Karte laden</button>
          <p>Beim Laden der Karte werden Daten an Google übertragen. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
        </div>
      </div>
    </div>
  </div>
</section>"""
    return page(r, "kontakt", "Kontakt – Nordbau Projektentwicklung",
                "Beschreiben Sie kurz Ihr Vorhaben und laden Sie gern Fotos hoch. Sie erhalten in der Regel "
                "innerhalb von 24 Stunden eine Rückmeldung.", body)


def build_impressum():
    r = ""
    c = COMPANY
    body = page_hero(
        r, "Rechtliches", "Impressum",
        "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG). Felder mit „Platzhalter“ ergänzen wir, sobald die Daten vorliegen.",
        plain=True,
    ) + f"""

<section class="section section--tight">
  <div class="container prose" data-reveal>
    <h2>Anbieter</h2>
    <p>{e(c['name'])}<br>{e(c['street'])}<br>{e(c['city'])}<br>Deutschland</p>

    <h2>Vertreten durch</h2>
    <p>Inhaber: {e(c['owner'])}</p>

    <h2>Kontakt</h2>
    <p>Telefon: <a href="tel:{c['phone_href']}">{e(c['phone'])}</a><br>E-Mail: <a href="mailto:{c['email']}">{e(c['email'])}</a></p>

    <h2>Steuernummer</h2>
    <p>Steuernummer: {e(c['tax'])}</p>

    <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>{e(c['owner'])}<br>{e(c['street'])}, {e(c['city'])}</p>

    <h2>Streitschlichtung</h2>
    <p>Plattform der EU zur Online-Streitbeilegung (OS): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>. Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

    <h2>Haftung für Inhalte und Links</h2>
    <p>Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für Inhalte externer Links sind ausschließlich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.</p>

    <h2>Urheberrecht</h2>
    <p>Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Verwendete Projektbilder sind teilweise Platzhalterbilder.</p>

    <a class="link-arrow back-link" href="datenschutz.html">Zur Datenschutzerklärung {icon("arrow")}</a>
  </div>
</section>"""
    return page(r, "impressum", "Impressum – Nordbau Projektentwicklung",
                "Impressum der Nordbau Projektentwicklung, Vellmar.", body)


def build_datenschutz():
    r = ""
    c = COMPANY
    body = page_hero(r, "Rechtliches", "Datenschutzerklärung",
                     "Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.", plain=True) + f"""

<section class="section section--tight">
  <div class="container prose" data-reveal>
    <h2>1. Verantwortlicher</h2>
    <p>{e(c['name'])}<br>Inhaber: {e(c['owner'])}<br>{e(c['street'])}<br>{e(c['city'])}<br>
    Telefon: <a href="tel:{c['phone_href']}">{e(c['phone'])}</a><br>E-Mail: <a href="mailto:{c['email']}">{e(c['email'])}</a></p>

    <h2>2. Allgemeines</h2>
    <p>Wir verarbeiten personenbezogene Daten nur, soweit dies für eine funktionsfähige Website sowie für die Bearbeitung Ihrer Anfragen erforderlich ist. Diese Website setzt keine Cookies und verwendet keine Analyse- oder Tracking-Werkzeuge. Die Schriftarten sind lokal eingebunden; beim Seitenaufruf wird keine Verbindung zu Google Fonts hergestellt.</p>

    <h2>3. Hosting und Server-Logfiles</h2>
    <p>Diese Website wird über GitHub Pages bereitgestellt (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf der Seiten verarbeitet der Hoster technisch notwendige Daten, insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Referrer-URL sowie Browser und Betriebssystem. Dies dient der sicheren und stabilen Auslieferung der Website.</p>
    <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der technisch fehlerfreien Darstellung und Sicherheit der Website. Eine Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der Standardvertragsklauseln der EU-Kommission.</p>

    <h2>4. Kontaktformular</h2>
    <p>Wenn Sie uns über das Kontaktformular eine Anfrage senden, verarbeiten wir die von Ihnen eingegebenen Daten (Name, Telefonnummer, E-Mail-Adresse, gewünschte Leistung, Nachricht sowie gegebenenfalls hochgeladene Fotos), um Ihre Anfrage zu bearbeiten und Ihnen ein Angebot zu erstellen.</p>
    <p>Für die Übermittlung der Formulardaten nutzen wir den Dienst FormSubmit (formsubmit.co), der die Angaben per E-Mail an uns weiterleitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung vorvertraglicher Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen). Ihre Daten werden gelöscht, sobald die Anfrage abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

    <h2>5. Kontakt per E-Mail oder Telefon</h2>
    <p>Wenn Sie uns per E-Mail oder Telefon kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihres Anliegens. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.</p>

    <h2>6. Google Maps</h2>
    <p>Auf der Kontaktseite können Sie eine Karte von Google Maps einblenden (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Die Karte wird erst geladen, wenn Sie auf „Karte laden“ klicken. Erst dann werden Daten wie Ihre IP-Adresse an Google übertragen; dabei kann es auch zu einer Übermittlung in die USA kommen.</p>
    <p>Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, die Sie durch den Klick erteilen und jederzeit mit Wirkung für die Zukunft widerrufen können, indem Sie die Seite neu laden. Weitere Informationen: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">https://policies.google.com/privacy</a>.</p>

    <h2>7. Ihre Rechte</h2>
    <p>Sie haben jederzeit das Recht auf:</p>
    <ul>
      <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
      <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
      <li>Löschung (Art. 17 DSGVO)</li>
      <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
      <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
      <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
      <li>Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
    </ul>
    <p>Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel beim Hessischen Beauftragten für Datenschutz und Informationsfreiheit.</p>

    <h2>8. Verschlüsselung</h2>
    <p>Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie am Schloss-Symbol in der Adresszeile Ihres Browsers.</p>

    <p style="margin-top:40px">Stand: Oktober 2026</p>
    <a class="link-arrow back-link" href="impressum.html">Zum Impressum {icon("arrow")}</a>
  </div>
</section>"""
    return page(r, "datenschutz", "Datenschutz – Nordbau Projektentwicklung",
                "Datenschutzerklärung der Nordbau Projektentwicklung, Vellmar.", body)


def build_danke():
    r = ""
    body = page_hero(
        r, "Anfrage gesendet", "Vielen Dank für Ihre Anfrage.",
        "Wir melden uns in der Regel innerhalb von 24 Stunden bei Ihnen.", plain=True,
    ) + f"""

<section class="section section--tight">
  <div class="container">
    <div class="hero-actions" data-reveal>
      <a class="btn btn-primary" href="index.html">Zur Startseite {icon("arrow")}</a>
      <a class="btn btn-ghost" href="referenzen.html">Referenzen ansehen</a>
    </div>
  </div>
</section>"""
    return page(r, "danke", "Vielen Dank – Nordbau Projektentwicklung",
                "Ihre Anfrage ist bei uns eingegangen.", body, noindex=True)


def main():
    out = {
        "index.html": build_home(),
        "referenzen.html": build_referenzen(),
        "bewertungen.html": build_bewertungen(),
        "kontakt.html": build_kontakt(),
        "impressum.html": build_impressum(),
        "datenschutz.html": build_datenschutz(),
        "danke.html": build_danke(),
    }
    for s in SERVICES:
        out[f"leistungen/{s['slug']}.html"] = build_service(s)
    for path, html in out.items():
        target = ROOT / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html, encoding="utf-8")
        print("geschrieben:", path)


if __name__ == "__main__":
    main()
