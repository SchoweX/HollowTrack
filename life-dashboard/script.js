/*
 * LifeOS – JavaScript-Grundgerüst
 *
 * Die App enthält bewusst noch keine Daten und keine Eingabefelder.
 * Tracking-Felder werden später aus dieser Konfiguration erzeugt.
 * Dadurch müssen sie nicht fest im HTML oder in einzelnen Funktionen
 * eingebaut werden.
 */

/**
 * Zentrale Liste für eigene Tracking-Felder.
 *
 * Diese Liste bleibt zum Start leer. Später können die Einstellungen
 * hier gespeicherte Felddefinitionen eintragen, ändern oder deaktivieren.
 *
 * Beispiel für eine spätere Felddefinition:
 * {
 *   id: "energie",
 *   name: "Energie",
 *   typ: "bewertung",
 *   aktiv: true,
 *   position: 1,
 *   optionen: []
 * }
 */
const trackingFelder = [];

/**
 * Mögliche Eingabetypen für später angelegte Tracking-Felder.
 * Die Auswahl ist nur vorbereitet und wird noch nicht angezeigt.
 */
const eingabetypen = [
  "zahl",
  "text",
  "ja-nein",
  "bewertung",
  "auswahlliste",
  "datum",
  "uhrzeit",
  "dauer",
  "mehrfachauswahl",
];

/**
 * Startpunkt der App.
 *
 * Aktuell wird absichtlich nichts automatisch eingefügt:
 * Es gibt weder Beispieldaten noch ein Tagesformular.
 */
function starteLifeOS() {
  // Die leere Feldliste ist die Grundlage für spätere Erweiterungen.
  console.info("LifeOS ist bereit für die weitere Entwicklung.");
}

// Die App startet erst, wenn das HTML vollständig geladen wurde.
document.addEventListener("DOMContentLoaded", starteLifeOS);
