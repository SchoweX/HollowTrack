import type {
  ImportKonflikt,
  ImportVorschau,
  Struktur,
  Tagesdatensatz,
} from './types';

import { mergeRecords } from './records';
import { mergeStructure } from './structureService';

export type AppliedImport = {
  structure: Struktur;
  days: Tagesdatensatz[];
};

export function applyImport(
  currentStructure: Struktur,
  currentDays: Tagesdatensatz[],
  preview: ImportVorschau,
  decisions: Record<string, ImportKonflikt>,
): AppliedImport {
  const structure = preview.struktur
    ? mergeStructure(currentStructure, preview.struktur)
    : currentStructure;

  const days = [...currentDays];

  preview.tage.forEach((incoming) => {
    const index = days.findIndex(
      (item) => item.datum === incoming.datum,
    );

    if (index < 0) {
      days.push(incoming);
      return;
    }

    const decision = decisions[incoming.datum];

    if (decision === 'uebernehmen') {
      days[index] = incoming;
    } else if (decision === 'zusammenfuehren') {
      days[index] = mergeRecords(days[index], incoming);
    }
  });

  return {
    structure,
    days,
  };
}

export function mergeNewDaysOnly(
  currentDays: Tagesdatensatz[],
  incomingDays: Tagesdatensatz[],
): Tagesdatensatz[] {
  return [
    ...currentDays,
    ...incomingDays.filter(
      (incoming) =>
        !currentDays.some(
          (existing) => existing.datum === incoming.datum,
        ),
    ),
  ];
}
