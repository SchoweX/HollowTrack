import type {
  Formularwert,
  Struktur,
  Tagesdatensatz,
} from './types';

import { clone, valueExists } from './utils';
import { emptyRecord, getAllTrackers } from './records';

export function saveDayRecord(
  current: Tagesdatensatz[],
  structure: Struktur,
  date: string,
  values: Record<string, Formularwert>,
  notes: string,
  now = new Date().toISOString(),
): Tagesdatensatz[] {
  const previous = current.find((item) => item.datum === date);
  const next = previous ? clone(previous) : emptyRecord(date);

  getAllTrackers(structure)
    .filter((item) => item.aktiv)
    .forEach((item) => {
      const value = values[item.id];
      const target =
        item.datentyp === 'Ereignis'
          ? next.ereignisse
          : next.messwerte;

      if (valueExists(value)) {
        target[item.id] = [
          'Zahl',
          'Dezimalzahl',
          'Bewertung 0 bis 10',
          'Dauer',
        ].includes(item.typ)
          ? Number(value)
          : value;
      } else {
        delete target[item.id];
      }
    });

  next.notizen = notes.trim();
  next.geaendertAm = now;

  return previous
    ? current.map((item) => item.datum === date ? next : item)
    : [...current, next];
}
