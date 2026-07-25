/*
 * Einfacher statischer Webserver für HollowTrack.
 *
 * Der Server liefert ausschließlich die Dateien aus diesem Ordner aus.
 * Der Port wird von Replit über die Umgebungsvariable PORT vorgegeben.
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 5000);
const APP_ORDNER = __dirname;

const DATEITYPEN = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function dateiAusliefern(antwort, dateipfad) {
  fs.readFile(dateipfad, (fehler, inhalt) => {
    if (fehler) {
      antwort.writeHead(fehler.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      antwort.end(fehler.code === "ENOENT" ? "Datei nicht gefunden" : "Interner Serverfehler");
      return;
    }

    const dateityp = DATEITYPEN[path.extname(dateipfad)] || "application/octet-stream";
    antwort.writeHead(200, {
      "Content-Type": dateityp,
      "Cache-Control": "no-cache",
    });
    antwort.end(inhalt);
  });
}

const server = http.createServer((anfrage, antwort) => {
  const angeforderterPfad = url.parse(anfrage.url || "/").pathname || "/";
  const relativerPfad = angeforderterPfad === "/" ? "index.html" : angeforderterPfad.slice(1);
  const dateipfad = path.resolve(APP_ORDNER, relativerPfad);

  // Verhindert, dass Anfragen aus dem App-Ordner heraus auf Dateien zugreifen.
  if (!dateipfad.startsWith(`${APP_ORDNER}${path.sep}`)) {
    antwort.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    antwort.end("Zugriff verweigert");
    return;
  }

  dateiAusliefern(antwort, dateipfad);
});

server.listen(PORT, HOST, () => {
  console.info(`HollowTrack läuft auf http://${HOST}:${PORT}`);
});