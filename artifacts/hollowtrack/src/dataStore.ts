import type { Sicherungsinfo, Struktur, Tagesdatensatz } from './types';
import { browserStorage, readJson, writeJson } from './storage';

export const STORAGE_STRUKTUR = 'hollowtrack-tracker-struktur';
export const STORAGE_TAGE = 'hollowtrack-tagesdaten';
export const STORAGE_SICHERUNG = 'hollowtrack-sicherungsinfo';

export function loadStructureData(): unknown {
  return readJson<unknown>(browserStorage, STORAGE_STRUKTUR, null);
}

export function loadDaysData(): Tagesdatensatz[] {
  const saved = readJson<unknown>(browserStorage, STORAGE_TAGE, []);
  return Array.isArray(saved) ? saved as Tagesdatensatz[] : [];
}

export function loadBackupInfoData(): Sicherungsinfo {
  return readJson<Sicherungsinfo>(browserStorage, STORAGE_SICHERUNG, {});
}

export function saveStructureData(structure: Struktur): void {
  writeJson(browserStorage, STORAGE_STRUKTUR, structure);
}

export function saveDaysData(days: Tagesdatensatz[]): void {
  writeJson(browserStorage, STORAGE_TAGE, days);
}

export function saveBackupInfoData(info: Sicherungsinfo): void {
  writeJson(browserStorage, STORAGE_SICHERUNG, info);
}
