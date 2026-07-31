import type {
  Ansicht,
  Bereich,
  Eingabetyp,
  ExterneAnbindung,
  Kategorie,
  Struktur,
  Tracker,
  TrackerDatentyp,
} from './types';

import { clone, newId, slug } from './utils';

const externalDefaults: ExterneAnbindung[] = [
  { id: 'android-health-connect', name: 'Android Health Connect', aktiv: false },
  { id: 'apple-health', name: 'Apple Health', aktiv: false },
  { id: 'fitbit', name: 'Fitbit', aktiv: false },
  { id: 'garmin', name: 'Garmin', aktiv: false },
];

import {
  clone,
  formatDate,
  formatDateTime,
  formatNumber,
  localDate,
  newId,
  slug,
  sorted,
  valueExists,
} from './utils';
import { categoryIcon, categoryIconMap } from './categoryIcons';

function makeTracker(id: string, name: string, typ: Eingabetyp, datentyp: TrackerDatentyp, position: number, einheit?: string, optionen?: string[]): Tracker {
  return {
    id: `tracker-${id}`, name, icon: 'Activity', farbe: '#1e6b65', aktiv: true, schnellnotiz: false, position, typ, datentyp,
    einheit, optionen, schnelltracking: false, analyseAktiv: true, lueckenassistent: false, datenquelle: 'manuell',
    benachrichtigung: { aktiv: false },
  };
}

type DefaultArea = { name: string; trackers: Tracker[] };
const defaultAreas: { category: string; areas: DefaultArea[] }[] = [
  {
    category: 'Körper & Gesundheit',
    areas: [
      { name: 'Schlaf', trackers: [makeTracker('schlafdauer', 'Schlafdauer', 'Dezimalzahl', 'Messwert', 1, 'Stunden'), makeTracker('bettzeit-beginn', 'Beginn der Bettzeit', 'Uhrzeit', 'Messwert', 2), makeTracker('bettzeit-ende', 'Ende der Bettzeit', 'Uhrzeit', 'Messwert', 3), makeTracker('schlafqualitaet', 'subjektive Schlafqualität', 'Bewertung 0 bis 10', 'Messwert', 4), makeTracker('mirtazapin', 'Mirtazapin', 'Ja/Nein', 'Ereignis', 5)] },
      { name: 'Wohlbefinden', trackers: [makeTracker('energie', 'Energie', 'Bewertung 0 bis 10', 'Messwert', 1), makeTracker('konzentration', 'Konzentration', 'Bewertung 0 bis 10', 'Messwert', 2), makeTracker('stimmung', 'Stimmung', 'Bewertung 0 bis 10', 'Messwert', 3)] },
      { name: 'Training & Aktivität', trackers: [makeTracker('training-durchgefuehrt', 'Training durchgeführt', 'Ja/Nein', 'Ereignis', 1), makeTracker('trainingsart', 'Trainingsart', 'Text', 'Ereignis', 2), makeTracker('trainingsstufe', 'Trainingsstufe', 'Auswahlliste', 'Ereignis', 3, undefined, ['keine', 'Stufe 1', 'Stufe 2', 'Stufe 3']), makeTracker('fahrradkilometer', 'Fahrradkilometer', 'Dezimalzahl', 'Messwert', 4, 'km')] },
      { name: 'Ernährung', trackers: [makeTracker('bulletproof-coffee', 'Bulletproof Coffee', 'Zahl', 'Ereignis', 1, 'Portionen'), makeTracker('wildbeer-smoothie', 'Wildbeer-Protein-Smoothie', 'Ja/Nein', 'Ereignis', 2), makeTracker('hauptgericht', 'Hauptgericht', 'Auswahlliste', 'Ereignis', 3, undefined, ['keines', 'Gericht A', 'Gericht B', 'Gericht C', 'Gericht D']), makeTracker('anteil-hauptgericht', 'Anteil Hauptgericht', 'Dezimalzahl', 'Messwert', 4, 'Portionen'), makeTracker('zusaetzliche-lebensmittel', 'zusätzliche Lebensmittel', 'Mehrzeiliger Text', 'Ereignis', 5), makeTracker('zusaetzliche-kohlenhydrate', 'geschätzte zusätzliche Kohlenhydrate', 'Dezimalzahl', 'Messwert', 6, 'g')] },
      { name: 'Hunger & Sättigung', trackers: [makeTracker('hunger-nach-essen', 'körperlicher Hunger nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 1), makeTracker('suessappetit-nach-essen', 'Süßappetit nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 2), makeTracker('saettigung-direkt', 'Sättigung direkt nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 3), makeTracker('spaeterer-hunger', 'späterer Hunger', 'Bewertung 0 bis 10', 'Messwert', 4)] },
      { name: 'Körperwerte', trackers: [] },
    ],
  },
  { category: 'Garten', areas: [{ name: 'Wetter & Umwelt', trackers: [] }, { name: 'Pflanzen', trackers: [] }, { name: 'Pflege', trackers: [] }, { name: 'Arbeiten & Kosten', trackers: [] }] },
];

export function initialStructure(): Struktur {
  const kategorien: Kategorie[] = [];
  const bereiche: Bereich[] = [];
  const ansichten: Ansicht[] = [];
  const tracker: Tracker[] = [];
  defaultAreas.forEach((category, categoryIndex) => {
    const categoryId = `kategorie-${slug(category.category)}`;
    const categoryAreaIds: string[] = [];
    category.areas.forEach((area, areaIndex) => {
      const areaId = `bereich-${slug(area.name)}`;
      const viewId = `ansicht-${slug(area.name)}-tagesuebersicht`;
      categoryAreaIds.push(areaId);
      bereiche.push({ id: areaId, name: area.name, aktiv: true, position: areaIndex + 1, ansichtIds: [viewId] });
      ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: area.trackers.map((item) => item.id) });
      tracker.push(...area.trackers);
    });
    kategorien.push({ id: categoryId, name: category.category, icon: categoryIndex ? 'Leaf' : 'ShieldCheck', aktiv: true, position: categoryIndex + 1, bereichIds: categoryAreaIds });
  });
  return { version: 2, kategorien, bereiche, ansichten, tracker, diaetModi: [], externeAnbindungen: clone(externalDefaults) };
}

export function migrateLegacy(legacy: { oberordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; unterordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; tracker?: Tracker[] }> }> }): Struktur {
  const result: Struktur = { version: 2, kategorien: [], bereiche: [], ansichten: [], tracker: [], diaetModi: [], externeAnbindungen: clone(externalDefaults) };
  (legacy.oberordner || []).forEach((folder, folderIndex) => {
    const categoryId = folder.id || newId('kategorie');
    const category: Kategorie = { id: categoryId, name: folder.name, icon: 'FolderOpen', aktiv: folder.aktiv !== false, position: folder.position || folderIndex + 1, bereichIds: [] };
    (folder.unterordner || []).forEach((subfolder, subIndex) => {
      const areaId = subfolder.id || newId('bereich');
      const viewId = `${areaId}-tagesuebersicht`;
      category.bereichIds.push(areaId);
      result.bereiche.push({ id: areaId, name: subfolder.name, aktiv: subfolder.aktiv !== false, position: subfolder.position || subIndex + 1, ansichtIds: [viewId] });
      const ids: string[] = [];
      (subfolder.tracker || []).forEach((oldItem, trackerIndex) => {
        const existing = result.tracker.find((item) => item.id === oldItem.id);
        if (existing) ids.push(existing.id);
        else {
          result.tracker.push({
            ...makeTracker(oldItem.id.replace(/^tracker-/, ''), oldItem.name, oldItem.typ, oldItem.datentyp, oldItem.position || trackerIndex + 1, oldItem.einheit, oldItem.optionen),
            ...oldItem,
            icon: oldItem.icon || 'Activity', farbe: oldItem.farbe || '#1e6b65', schnellnotiz: oldItem.schnellnotiz || false,
            schnelltracking: oldItem.schnelltracking || false, analyseAktiv: oldItem.analyseAktiv !== false, lueckenassistent: oldItem.lueckenassistent || false, datenquelle: oldItem.datenquelle || 'manuell',
          });
          ids.push(oldItem.id);
        }
      });
      result.ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: ids });
    });
    result.kategorien.push(category);
  });
  return result;
}

export function mergeStructure(current: Struktur, incoming: Struktur): Struktur {
  const result = clone(current);
  incoming.kategorien.forEach((category) => {
    let targetCategory = result.kategorien.find((item) => item.id === category.id);
    if (!targetCategory) { result.kategorien.push(clone(category)); return; }
    category.bereichIds.forEach((areaId) => { if (!targetCategory!.bereichIds.includes(areaId)) targetCategory!.bereichIds.push(areaId); });
  });
  incoming.bereiche.forEach((area) => {
    if (!result.bereiche.some((item) => item.id === area.id)) result.bereiche.push(clone(area));
    else {
      const target = result.bereiche.find((item) => item.id === area.id)!;
      area.ansichtIds.forEach((id) => { if (!target.ansichtIds.includes(id)) target.ansichtIds.push(id); });
    }
  });
  incoming.ansichten.forEach((view) => {
    if (!result.ansichten.some((item) => item.id === view.id)) result.ansichten.push(clone(view));
    else {
      const target = result.ansichten.find((item) => item.id === view.id)!;
      view.trackerIds.forEach((id) => { if (!target.trackerIds.includes(id)) target.trackerIds.push(id); });
    }
  });
  incoming.tracker.forEach((item) => { if (!result.tracker.some((currentItem) => currentItem.id === item.id)) result.tracker.push(clone(item)); });
  result.diaetModi = result.diaetModi || [];
  result.externeAnbindungen = result.externeAnbindungen?.length ? result.externeAnbindungen : clone(externalDefaults);
  return result;
}

export function normalizeStructure(saved: unknown): Struktur {
  const base = initialStructure();
  if (saved && typeof saved === 'object' && Array.isArray((saved as Struktur).kategorien)) return mergeStructure(base, saved as Struktur);
  if (saved && typeof saved === 'object' && Array.isArray((saved as { oberordner?: unknown }).oberordner)) return mergeStructure(base, migrateLegacy(saved as { oberordner: Array<{ id: string; name: string; aktiv: boolean; position: number; unterordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; tracker?: Tracker[] }> }> }));
  return base;
}
