/*
 * LifeOS – Verwaltung der Tracker-Struktur
 *
 * Die Datei ist in vier verständliche Bereiche geteilt:
 * 1. Datenmodell und Standardstruktur
 * 2. Lokale Speicherung
 * 3. Darstellung der Struktur
 * 4. Aktionen und Verwaltung
 *
 * Es gibt bewusst noch keine Messwerte und keine vollständigen
 * Tracking-Formulare. Die Struktur ist aber bereits für spätere
 * Erweiterungen vorbereitet.
 */

const SPEICHER_SCHLUESSEL = "lifeos-tracker-struktur";

/**
 * Die Standardstruktur wird nur beim allerersten Start verwendet.
 * Tracker werden absichtlich nicht automatisch angelegt.
 */
const STANDARD_STRUKTUR = {
  oberordner: [
    {
      id: "oberordner-koerper-gesundheit",
      name: "Körper & Gesundheit",
      aktiv: true,
      position: 1,
      unterordner: [
        { id: "unterordner-schlaf", name: "Schlaf", aktiv: true, position: 1, tracker: [] },
        { id: "unterordner-wohlbefinden", name: "Wohlbefinden", aktiv: true, position: 2, tracker: [] },
        { id: "unterordner-training", name: "Training & Aktivität", aktiv: true, position: 3, tracker: [] },
        { id: "unterordner-ernaehrung", name: "Ernährung", aktiv: true, position: 4, tracker: [] },
        { id: "unterordner-hunger", name: "Hunger & Sättigung", aktiv: true, position: 5, tracker: [] },
        { id: "unterordner-koerperwerte", name: "Körperwerte", aktiv: true, position: 6, tracker: [] },
      ],
    },
    {
      id: "oberordner-garten",
      name: "Garten",
      aktiv: true,
      position: 2,
      unterordner: [
        { id: "unterordner-wetter", name: "Wetter & Umwelt", aktiv: true, position: 1, tracker: [] },
        { id: "unterordner-pflanzen", name: "Pflanzen", aktiv: true, position: 2, tracker: [] },
        { id: "unterordner-pflege", name: "Pflege", aktiv: true, position: 3, tracker: [] },
        { id: "unterordner-arbeiten", name: "Arbeiten & Kosten", aktiv: true, position: 4, tracker: [] },
      ],
    },
  ],
};

/**
 * Diese Liste enthält die später möglichen Eingabetypen für Tracker.
 * Sie wird in dieser Ausbaustufe noch nicht für ein Tagesformular benutzt.
 */
const EINGABETYPEN = [
  "Zahl",
  "Text",
  "Ja oder Nein",
  "Bewertung von 0 bis 10",
  "Auswahlliste",
  "Datum",
  "Uhrzeit",
  "Dauer",
  "Mehrfachauswahl",
];

let trackerStruktur;

/* ------------------------------
 * 1. Lokale Speicherlogik
 * ------------------------------ */

function strukturKopieren(struktur) {
  return JSON.parse(JSON.stringify(struktur));
}

function strukturLaden() {
  const gespeicherteStruktur = localStorage.getItem(SPEICHER_SCHLUESSEL);

  if (!gespeicherteStruktur) {
    return strukturKopieren(STANDARD_STRUKTUR);
  }

  try {
    const struktur = JSON.parse(gespeicherteStruktur);
    return struktur && Array.isArray(struktur.oberordner)
      ? struktur
      : strukturKopieren(STANDARD_STRUKTUR);
  } catch (fehler) {
    console.warn("Die gespeicherte LifeOS-Struktur konnte nicht gelesen werden.", fehler);
    return strukturKopieren(STANDARD_STRUKTUR);
  }
}

function strukturSpeichern() {
  localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(trackerStruktur));
}

function neueId() {
  return `lifeos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortierteElemente(elemente) {
  return [...elemente].sort((a, b) => (a.position || 0) - (b.position || 0));
}

function naechstePosition(elemente) {
  return elemente.length
    ? Math.max(...elemente.map((element) => element.position || 0)) + 1
    : 1;
}

/* ------------------------------
 * 2. Darstellung der Tracker-Ansicht
 * ------------------------------ */

function sichereTextdarstellung(text) {
  // textContent wird später verwendet; diese Funktion hält die Absicht fest.
  return String(text);
}

function trackerAnsichtZeichnen() {
  const container = document.querySelector("#tracker-view");
  const status = document.querySelector("#tracker-status");

  if (!container || !status) {
    return;
  }

  container.replaceChildren();
  const oberordner = sortierteElemente(trackerStruktur.oberordner);
  status.textContent = `${oberordner.length} Oberordner`;

  if (!oberordner.length) {
    const leer = document.createElement("p");
    leer.className = "tracker-leer";
    leer.textContent = "Noch keine Oberordner vorhanden.";
    container.append(leer);
    return;
  }

  oberordner.forEach((oberordnerElement) => {
    container.append(oberordnerDarstellen(oberordnerElement));
  });
}

function oberordnerDarstellen(oberordner) {
  const wrapper = document.createElement("section");
  wrapper.className = "tracker-oberordner";
  if (!oberordner.aktiv) {
    wrapper.classList.add("element--deaktiviert");
  }

  const details = document.createElement("details");
  details.open = true;

  const kopf = document.createElement("summary");
  kopf.className = "tracker-oberordner__kopf";

  const titel = document.createElement("span");
  titel.className = "tracker-oberordner__titel";
  titel.textContent = sichereTextdarstellung(oberordner.name);
  kopf.append(titel);
  details.append(kopf);

  const inhalt = document.createElement("div");
  inhalt.className = "tracker-oberordner__inhalt";
  const unterordner = sortierteElemente(oberordner.unterordner || []);

  if (!unterordner.length) {
    const leer = document.createElement("p");
    leer.className = "tracker-leer";
    leer.textContent = "Noch keine Unterordner vorhanden.";
    inhalt.append(leer);
  } else {
    unterordner.forEach((unterordnerElement) => {
      inhalt.append(unterordnerDarstellen(unterordnerElement));
    });
  }

  details.append(inhalt);
  wrapper.append(details);
  return wrapper;
}

function unterordnerDarstellen(unterordner) {
  const details = document.createElement("details");
  details.className = "tracker-unterordner";
  details.open = true;

  if (!unterordner.aktiv) {
    details.classList.add("element--deaktiviert");
  }

  const kopf = document.createElement("summary");
  kopf.className = "tracker-unterordner__kopf";
  const titel = document.createElement("span");
  titel.className = "tracker-unterordner__titel";
  titel.textContent = sichereTextdarstellung(unterordner.name);
  kopf.append(titel);
  details.append(kopf);

  const inhalt = document.createElement("div");
  inhalt.className = "tracker-unterordner__inhalt";
  const tracker = sortierteElemente(unterordner.tracker || []);

  if (!tracker.length) {
    const leer = document.createElement("p");
    leer.className = "tracker-leer";
    leer.textContent = "Noch keine Tracker vorhanden.";
    inhalt.append(leer);
  } else {
    tracker.forEach((trackerElement) => {
      const eintrag = document.createElement("div");
      eintrag.className = "tracker-eintrag";
      if (!trackerElement.aktiv) {
        eintrag.classList.add("element--deaktiviert");
      }
      eintrag.textContent = sichereTextdarstellung(trackerElement.name);
      inhalt.append(eintrag);
    });
  }

  details.append(inhalt);
  return details;
}

/* ------------------------------
 * 3. Darstellung der Einstellungen
 * ------------------------------ */

function verwaltungZeichnen() {
  const container = document.querySelector("#verwaltungsliste");

  if (!container) {
    return;
  }

  container.replaceChildren();
  const oberordner = sortierteElemente(trackerStruktur.oberordner);

  if (!oberordner.length) {
    const leer = document.createElement("p");
    leer.className = "verwaltung-leer";
    leer.textContent = "Noch keine Elemente vorhanden.";
    container.append(leer);
    return;
  }

  oberordner.forEach((oberordnerElement) => {
    container.append(verwaltungseintragErstellen(
      oberordnerElement,
      "Oberordner",
      "oberordner",
      oberordnerElement.aktiv,
    ));

    sortierteElemente(oberordnerElement.unterordner || []).forEach((unterordner) => {
      container.append(verwaltungseintragErstellen(
        unterordner,
        `Unterordner in „${oberordnerElement.name}“`,
        "unterordner",
        unterordner.aktiv,
      ));

      sortierteElemente(unterordner.tracker || []).forEach((tracker) => {
        container.append(verwaltungseintragErstellen(
          tracker,
          `Tracker in „${unterordner.name}“`,
          "tracker",
          tracker.aktiv,
        ));
      });
    });
  });
}

function verwaltungseintragErstellen(element, typ, aktionstyp, aktiv) {
  const eintrag = document.createElement("article");
  eintrag.className = "verwaltungseintrag";
  if (!aktiv) {
    eintrag.classList.add("element--deaktiviert");
  }

  const kopf = document.createElement("div");
  kopf.className = "verwaltungseintrag__kopf";

  const titelgruppe = document.createElement("div");
  const titel = document.createElement("h3");
  titel.className = "verwaltungseintrag__titel";
  titel.textContent = sichereTextdarstellung(element.name);
  const typText = document.createElement("span");
  typText.className = "verwaltungseintrag__typ";
  typText.textContent = aktiv ? typ : `${typ} – deaktiviert`;
  titelgruppe.append(titel, typText);
  kopf.append(titelgruppe);
  eintrag.append(kopf);

  const aktionen = document.createElement("div");
  aktionen.className = "verwaltungseintrag__aktionen";
  aktionen.append(
    aktionsButton(aktiv ? "Deaktivieren" : "Aktivieren", "status-aendern", aktionstyp, element.id),
    aktionsButton("Umbenennen", "umbenennen", aktionstyp, element.id),
    aktionsButton("Löschen", "loeschen", aktionstyp, element.id, true),
  );
  eintrag.append(aktionen);
  return eintrag;
}

function aktionsButton(text, aktion, typ, id, istLoeschbutton = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "aktions-button";
  if (istLoeschbutton) {
    button.classList.add("aktions-button--loeschen");
  }
  button.dataset.aktion = aktion;
  button.dataset.typ = typ;
  button.dataset.id = id;
  button.textContent = text;
  return button;
}

function alleAnsichtenZeichnen() {
  trackerAnsichtZeichnen();
  verwaltungZeichnen();
}

/* ------------------------------
 * 4. Bearbeitungsaktionen
 * ------------------------------ */

function namenAbfragen(alterName = "") {
  const aufforderung = alterName
    ? `Neuer Name für „${alterName}“:`
    : "Name des neuen Elements:";
  const name = window.prompt(aufforderung, alterName);
  const bereinigterName = name ? name.trim() : "";

  if (!bereinigterName) {
    return null;
  }

  return bereinigterName;
}

function oberordnerFinden(id) {
  return trackerStruktur.oberordner.find((oberordner) => oberordner.id === id);
}

function unterordnerFinden(id) {
  for (const oberordner of trackerStruktur.oberordner) {
    const unterordner = (oberordner.unterordner || []).find((element) => element.id === id);
    if (unterordner) {
      return { unterordner, oberordner };
    }
  }
  return null;
}

function trackerFinden(id) {
  for (const oberordner of trackerStruktur.oberordner) {
    for (const unterordner of oberordner.unterordner || []) {
      const tracker = (unterordner.tracker || []).find((element) => element.id === id);
      if (tracker) {
        return { tracker, unterordner, oberordner };
      }
    }
  }
  return null;
}

function oberordnerErstellen() {
  const name = namenAbfragen();
  if (!name) {
    return;
  }

  trackerStruktur.oberordner.push({
    id: neueId(),
    name,
    aktiv: true,
    position: naechstePosition(trackerStruktur.oberordner),
    unterordner: [],
  });
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function auswahlAbfragen(frage, elemente) {
  const liste = sortierteElemente(elemente);
  const beschriftungen = liste.map((element, index) => `${index + 1}: ${element.name}`).join("\n");
  const eingabe = window.prompt(`${frage}\n\n${beschriftungen}`);
  const nummer = Number.parseInt(eingabe, 10);

  if (!Number.isInteger(nummer) || nummer < 1 || nummer > liste.length) {
    return null;
  }

  return liste[nummer - 1];
}

function unterordnerErstellen() {
  const oberordner = auswahlAbfragen(
    "Bitte wähle einen Oberordner aus:",
    trackerStruktur.oberordner.filter((element) => element.aktiv),
  );
  if (!oberordner) {
    return;
  }

  const name = namenAbfragen();
  if (!name) {
    return;
  }

  oberordner.unterordner.push({
    id: neueId(),
    name,
    aktiv: true,
    position: naechstePosition(oberordner.unterordner),
    tracker: [],
  });
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function trackerErstellen() {
  const auswahl = [];
  trackerStruktur.oberordner.forEach((oberordner) => {
    (oberordner.unterordner || [])
      .filter((unterordner) => unterordner.aktiv && oberordner.aktiv)
      .forEach((unterordner) => auswahl.push({
        ...unterordner,
        anzeige: `${unterordner.name} (in „${oberordner.name}“)`,
        oberordnerId: oberordner.id,
      }));
  });

  const unterordner = auswahlAbfragen(
    "Bitte wähle einen Unterordner aus:",
    auswahl.map((element) => ({ ...element, name: element.anzeige })),
  );
  if (!unterordner) {
    return;
  }

  const name = namenAbfragen();
  if (!name) {
    return;
  }

  const ziel = unterordnerFinden(unterordner.id);
  if (!ziel) {
    return;
  }

  ziel.unterordner.tracker = ziel.unterordner.tracker || [];
  ziel.unterordner.tracker.push({
    id: neueId(),
    name,
    aktiv: true,
    position: naechstePosition(ziel.unterordner.tracker),
    typ: EINGABETYPEN[1],
  });
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function elementStatusAendern(typ, id) {
  const gefunden = typ === "oberordner"
    ? oberordnerFinden(id)
    : typ === "unterordner"
      ? unterordnerFinden(id)?.unterordner
      : trackerFinden(id)?.tracker;

  if (!gefunden) {
    return;
  }

  gefunden.aktiv = !gefunden.aktiv;
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function elementUmbenennen(typ, id) {
  const gefunden = typ === "oberordner"
    ? oberordnerFinden(id)
    : typ === "unterordner"
      ? unterordnerFinden(id)?.unterordner
      : trackerFinden(id)?.tracker;

  if (!gefunden) {
    return;
  }

  const name = namenAbfragen(gefunden.name);
  if (!name) {
    return;
  }

  gefunden.name = name;
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function elementLoeschen(typ, id) {
  let element;
  let loeschfunktion;
  let warnung;

  if (typ === "oberordner") {
    element = oberordnerFinden(id);
    loeschfunktion = () => {
      trackerStruktur.oberordner = trackerStruktur.oberordner.filter(
        (oberordner) => oberordner.id !== id,
      );
    };
    warnung = `Möchtest du den Oberordner „${element?.name}“ wirklich löschen? Alle darin enthaltenen Unterordner und Tracker werden ebenfalls gelöscht.`;
  } else if (typ === "unterordner") {
    const gefunden = unterordnerFinden(id);
    element = gefunden?.unterordner;
    loeschfunktion = () => {
      gefunden.oberordner.unterordner = gefunden.oberordner.unterordner.filter(
        (unterordner) => unterordner.id !== id,
      );
    };
    warnung = `Möchtest du den Unterordner „${element?.name}“ wirklich löschen? Enthaltene Tracker werden ebenfalls gelöscht.`;
  } else {
    const gefunden = trackerFinden(id);
    element = gefunden?.tracker;
    loeschfunktion = () => {
      gefunden.unterordner.tracker = gefunden.unterordner.tracker.filter(
        (tracker) => tracker.id !== id,
      );
    };
    warnung = `Möchtest du den Tracker „${element?.name}“ wirklich löschen?`;
  }

  if (!element || !window.confirm(warnung)) {
    return;
  }

  loeschfunktion();
  strukturSpeichern();
  alleAnsichtenZeichnen();
}

function verwaltungsaktionAusfuehren(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { aktion, typ, id } = button.dataset;

  if (aktion === "status-aendern") {
    elementStatusAendern(typ, id);
  } else if (aktion === "umbenennen") {
    elementUmbenennen(typ, id);
  } else if (aktion === "loeschen") {
    elementLoeschen(typ, id);
  }
}

function neueElementAktion(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const aktionen = {
    "oberordner-erstellen": oberordnerErstellen,
    "unterordner-erstellen": unterordnerErstellen,
    "tracker-erstellen": trackerErstellen,
  };
  aktionen[button.dataset.aktion]?.();
}

function navigationAktualisieren() {
  const links = document.querySelectorAll(".main-navigation__link");
  const bereiche = document.querySelectorAll("main section[id]");

  const beobachter = new IntersectionObserver((eintraege) => {
    eintraege.forEach((eintrag) => {
      if (!eintrag.isIntersecting) {
        return;
      }

      links.forEach((link) => {
        link.classList.toggle(
          "main-navigation__link--active",
          link.getAttribute("href") === `#${eintrag.target.id}`,
        );
      });
    });
  }, { threshold: 0.2 });

  bereiche.forEach((bereich) => beobachter.observe(bereich));
}

function starteLifeOS() {
  trackerStruktur = strukturLaden();
  strukturSpeichern();
  alleAnsichtenZeichnen();
  document.querySelector("#verwaltungsliste")?.addEventListener("click", verwaltungsaktionAusfuehren);
  document.querySelector(".verwaltung-aktionen")?.addEventListener("click", neueElementAktion);
  navigationAktualisieren();
}

document.addEventListener("DOMContentLoaded", starteLifeOS);
