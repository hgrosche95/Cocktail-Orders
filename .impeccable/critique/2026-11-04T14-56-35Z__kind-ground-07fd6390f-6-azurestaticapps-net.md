---
target: Cocktail Orders App (live), mobil zuerst
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "url:https://kind-ground-07fd6390f.6.azurestaticapps.net/"
timestamp: 2026-11-04T14-56-35Z
slug: kind-ground-07fd6390f-6-azurestaticapps-net
---
Method: dual-agent (A: Design-Review, B: Detector + Browser). Bestellseite mobil zuerst bewertet (390 px, iframe, kein echtes Geraet).

## Design Health: 20/40 (Acceptable)
1 Status 2 | 2 Reale Welt 3 | 3 Kontrolle 1 | 4 Konsistenz 2 | 5 Fehlervermeidung 2 | 6 Wiedererkennen 2 | 7 Effizienz 2 | 8 Aesthetik 3 | 9 Fehlerbehebung 1 | 10 Hilfe 2

## Spezifitaet
Buehne hochspezifisch (Skyline, Hochfahren, Rheinturm), Karte generisch (dunkle Karten, Pills, Text). CLI-Detector src + index.html: 0 Findings. URL-Scan: dark-glow (echt, kleinflaechig, src/index.css:253), low-contrast auf #ff9a5c (wahrscheinlich False Positive, Verlaufs-Endstopp). Overlay nicht verfuegbar.

## Priority Issues
- [P1] Mobile Karte verliert Bestellziel: 7.000 px Seite, erste Karte y=920, Bestellformular y~6.550-6.800, keine Sticky-Aktion, + scrollt ans Ende (src/App.tsx:135). Fix: Sticky-Bottom-Bar, Header auf ~120 px, Filter einzeilig sticky, erste Karte y<400. /impeccable layout, /impeccable adapt
- [P1] Karte ohne Bildsprache: Kategorie nur 7-9-px-Punkt, Filmzeile 13 px 4,27:1, Aperitivos = CTA-Orange, Vorschlaege finden ist lauteste Flaeche. Fix: Glas-Silhouetten aus Rezeptdaten, Kategoriekante, Filmzeile aufwerten, Orange nur fuer Bestellen. /impeccable colorize, /impeccable delight
- [P1] Status und Bestellmoment unzuverlaessig: kein WS-Reconnect (src/App.tsx:92-108), Fehler/409 stumm (src/App.tsx:169-181), zwei Bestellwege, kein Storno, Fertig-Banner schwach. Fix: Reconnect + visibilitychange, Sende-/Erfolgszustand, Undo, ein Bestellweg, Fertig-Moment. /impeccable harden, /impeccable delight
- [P2] Kleine Ziele, schwache Signale: Sterne 24x28 und 1,54:1, Chips 31 px, Spaeter 32 px, Hilfe 34 px, Placeholder 2,89:1, Input-Rahmen 1,73:1. Fix: 44 px, mind. 3:1 fuer UI, 4,5:1 fuer Text. /impeccable polish
- [P2] Text-Patzer: aus "TODO" live beim Bramble (shared/cocktails.json:394), lang=en und Titel cocktail-orders (index.html), Kunde statt Gast, Im Glas doppelt belegt. /impeccable clarify

## Personas
Casey: Abschicken y~6.800, Zurueck oben links, Chips scrollen weg, kein Fertig-Signal nach Sperre. Jordan: Kunde/Barkeeper-Tabs beim Namensfeld, + vs. Kartentipp unklar. Sam: kein role=dialog/Fokus im Hilfe-Modal, Notification ohne aria-live, Chips ohne aria-pressed, Fokusring fehlt teils.

## Nicht geprueft
Live nicht gesehen, nur Quellcode: Wartepanel, Fertig-Banner, gefuellte Bestellung, eingeloggte Theke, Lade-/Fehlerzustaende. Kein echtes Telefon.

## Korrektur 2026-11-04
Die Quellcode-Befunde stammen vom veralteten lokalen Branch design/rooftop (cacca08). Auf aktuellem main gibt es WebSocket-Reconnect und Storno bereits; beide Befunde im Bestellmoment-P1 sind damit hinfaellig, Heuristik 1 und 3 waeren neu zu bewerten. Zeilenangaben gelten fuer den alten Stand.
