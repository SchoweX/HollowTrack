import type {
  Ansicht,
  Formularwert,
  Struktur,
  Tagesdatensatz,
  Tracker,
} from './types';
import { formatNumber, newId, valueExists } from './utils';

export function emptyRecord(date: string): Tagesdatensatz { const now = new Date().toISOString(); return { id: newId('tag'), datum: date, messwerte: {}, ereignisse: {}, notizen: '', kategorieNotizen: {}, erstelltAm: now, geaendertAm: now }; }
export function getAllTrackers(structure: Struktur): Tracker[] { return structure.tracker; }
export function getViewTrackers(structure: Struktur, view: Ansicht): Tracker[] { return view.trackerIds.map((id) => structure.tracker.find((item) => item.id === id)).filter((item): item is Tracker => Boolean(item)); }
export function recordValue(record: Tagesdatensatz | undefined, item: Tracker): Formularwert {
  if (!record) return undefined;

  const sets = ([1, 2, 3] as const)
    .map((setNumber) => {
      const value = record.messwerte[`${item.id}::satz-${setNumber}`];
      return valueExists(value) ? `Satz ${setNumber}: ${String(value)}` : null;
    })
    .filter((value): value is string => value !== null);

  if (sets.length > 0) {
    return sets;
  }

  if (item.datentyp === 'Ereignis') {
    return record.ereignisse?.[item.id];
  }

  return record.messwerte[item.id];
}

export function summaryFor(record: Tagesdatensatz, structure: Struktur): string {
  const all = getAllTrackers(structure);
  const find = (part: string) => all.find((item) => item.name.toLowerCase().includes(part));
  const pieces: string[] = [];
  const sleep = record.messwerte[find('schlafdauer')?.id || '']; const energy = record.messwerte[find('energie')?.id || '']; const mood = record.messwerte[find('stimmung')?.id || ''];
  const training = record.ereignisse[find('training durchgeführt')?.id || '']; const trainingType = record.ereignisse[find('trainingsart')?.id || '']; const level = record.ereignisse[find('trainingsstufe')?.id || '']; const bike = record.messwerte[find('fahrradkilometer')?.id || '']; const meal = record.ereignisse[find('hauptgericht')?.id || ''];
  if (valueExists(sleep)) pieces.push(`${formatNumber(sleep)} Stunden Schlaf`); if (valueExists(energy)) pieces.push(`Energie ${formatNumber(energy)}/10`); if (valueExists(mood)) pieces.push(`Stimmung ${formatNumber(mood)}/10`);
  if (training === true) pieces.push(`${valueExists(trainingType) ? trainingType : 'Training'}${valueExists(level) && level !== 'keine' ? ` ${level}` : ''}`); if (valueExists(bike)) pieces.push(`${formatNumber(bike)} km Fahrrad`); if (valueExists(meal) && meal !== 'keines') pieces.push(String(meal));
  return pieces.length ? `${pieces.join(', ')}.` : 'Für diesen Tag sind noch keine Werte eingetragen.';
}
export function mergeRecords(existing: Tagesdatensatz, incoming: Tagesdatensatz): Tagesdatensatz {
  return { ...existing, messwerte: { ...existing.messwerte, ...incoming.messwerte }, ereignisse: { ...existing.ereignisse, ...incoming.ereignisse }, notizen: [existing.notizen, incoming.notizen].filter(Boolean).join('\n\n'), kategorieNotizen: { ...(existing.kategorieNotizen ?? {}), ...(incoming.kategorieNotizen ?? {}) }, geaendertAm: new Date().toISOString() };
}
