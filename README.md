# Matura-Korrekturplattform

Kleine Node-App fuer Deutsch-Maturaufsaetze:

- `.docx` oder `.pdf` hochladen und Aufsatztext extrahieren
- Aufgabenstellung und Textsorte aus den Matura-Aufgaben 2026 auswaehlen
- strenge KI-Korrektur mit Fehlerzaehlung
- sprachliche Teilnote nach der hinterlegten Excel-Skala berechnen
- Gesamtbewertung mit Gewichtung Inhalt 40%, Aufbau 20%, Stil 20%, sprachliche Korrektheit 20%
- Kommentar und Fehlerliste als `.docx` exportieren

## Hinterlegte Korrekturkriterien

- Inhalt: Gesamtidee, gedankliche Auseinandersetzung mit dem gewaehlten Thema, gedankliche Originalitaet, Umfang des Wissens, interne Stimmigkeit, Richtigkeit von Tatsachen
- Aufbau: innere und aeussere Gliederung, logische Abfolge der Denkschritte, textsortengemaesse Textstruktur
- Sprachlicher Ausdruck: Richtigkeit der Sprachmittel (Wortschatz, Syntax, Kohaesion), Angemessenheit der Sprachmittel, stilistische bzw. rhetorische Eigenstaendigkeit, Rezipientenfuehrung
- Sprachliche Korrektheit: Orthografie, Interpunktion, Grammatik

## Start

```bash
npm install
npm start
```

Danach laeuft die App standardmaessig unter:

[http://127.0.0.1:3031](http://127.0.0.1:3031)

## KI-Konfiguration

Die Korrektur nutzt die OpenAI Responses API. Lokal brauchst du:

```bash
export OPENAI_API_KEY="..."
export OPENAI_MODEL="gpt-5.4"
npm start
```

`OPENAI_MODEL` ist optional. Ohne `OPENAI_API_KEY` zeigt die App den fertig zusammengesetzten Korrekturprompt an, fuehrt aber keine KI-Bewertung aus.

## GitHub/Deployment

Das Projekt ist bewusst als eigenstaendiges Repository vorbereitet:

- `package.json` mit Start- und Testskripten
- keine lokalen Desktop-/Download-Dateien im Projekt
- `render.yaml` fuer ein einfaches Render-Webservice-Deployment
- Healthcheck unter `/healthz`

Beim Deployment muss mindestens `OPENAI_API_KEY` als Environment Variable gesetzt werden.
