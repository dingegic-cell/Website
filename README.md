# Nordbau Projektentwicklung – Website

Neue Website im dunklen, „cinematic“ Design mit Scroll-Effekten. Die Inhalte stammen eins zu eins von der bisherigen Seite.

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite |
| `leistungen/*.html` | Je eine Seite pro Leistung (6 Stück) |
| `referenzen.html` | Projektgalerie |
| `bewertungen.html` | Kundenstimmen |
| `kontakt.html` | Kontaktformular, Öffnungszeiten, Karte |
| `impressum.html`, `datenschutz.html` | Rechtliches |
| `danke.html` | Bestätigung nach dem Absenden des Formulars |

## Texte ändern

Alle Texte stehen in **`_src/build.py`**. Nach einer Änderung im Hauptordner ausführen:

```bash
python3 _src/build.py
```

Danach sind alle HTML-Seiten neu erzeugt. Design: `assets/css/style.css`, Effekte: `assets/js/main.js`.

## Online stellen (GitHub Pages, kostenlos)

1. Im Repository auf **Settings → Pages** gehen.
2. Bei **Source** „Deploy from a branch“ wählen, dann den Branch auswählen und den Ordner `/ (root)`.
3. Speichern – nach 1–2 Minuten ist die Seite unter `https://<benutzername>.github.io/Website/` erreichbar.

Eigene Domain (z. B. `nordbau-projektentwicklung.com`): unter **Settings → Pages → Custom domain** eintragen und beim Domain-Anbieter die DNS-Einträge von GitHub hinterlegen.

## Kontaktformular

Das Formular wird über [FormSubmit](https://formsubmit.co) an `info@nordbau-projekt.de` geschickt. Bei der **allerersten** Anfrage kommt eine Bestätigungs-Mail von FormSubmit – dort einmal auf „Activate“ klicken, danach kommen alle Anfragen (inkl. Fotos) direkt per E-Mail an.

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.

## Lizenzen

Schriften Outfit und Figtree: SIL Open Font License (siehe `assets/fonts/`). Icons im Stil von Lucide (ISC/MIT).
