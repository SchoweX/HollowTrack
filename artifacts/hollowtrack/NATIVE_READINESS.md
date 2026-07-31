# HollowTrack – Native Readiness

Stand: 31.07.2026

## Status

Die technische Vorbereitung der bestehenden React/TypeScript-Anwendung für einen späteren nativen App-Übergang ist abgeschlossen.

## Verifiziert

- Produktions-Build erfolgreich
- Tagesdaten-Speicherpfad praktisch getestet
- Daten bleiben nach vollständigem Neuladen erhalten
- Persistenz-Orchestrierung aus App.tsx ausgelagert
- Struktur- und Tageslogik teilweise in Services ausgelagert
- Import-/Backup-Logik von UI-Code getrennt
- Navigation hinter eigener App-Navigationsschnittstelle gekapselt
- wouter auf Web-Router begrenzt
- Browser-Dateizugriffe hinter Datei-Plattform abstrahiert
- Browser-Storage hinter Storage-Abstraktion gekapselt
- Browser-Dialoge hinter Plattformabstraktion gekapselt
- document/window-Zugriffe aus App.tsx entfernt
- Runtime-Konfiguration zentralisiert

## Abschlussprüfung

Build:
PASS

Unerlaubte direkte Web-Abhängigkeiten außerhalb definierter Web-/Plattformgrenzen:
KEINE

## Bewusst Web-spezifisch verbleibend

- main.tsx
- components/WebAppRouter.tsx
- components/JsonFilePicker.tsx
- hooks/use-mobile.tsx
- storage.ts
- filePlatform.ts
- platform.ts
- appPlatform.ts
- runtimeConfig.ts

Diese Dateien bilden bzw. unterstützen die Web-Plattformgrenze und müssen bei einer späteren nativen Umsetzung durch passende native Adapter oder Einstiegspunkte ersetzt werden.

## Architekturentscheidung

Weiteres Refactoring rein zur Verkleinerung von App.tsx ist für die Native-Readiness nicht erforderlich.

Fachlogik, die keine Browserabhängigkeit besitzt, darf vorerst in App.tsx verbleiben, sofern sie stabil funktioniert.

Priorität ab diesem Stand:
Produktentwicklung und Funktionen vor zusätzlichem Architektur-Refactoring.
