import type { Struktur, Tagesdatensatz } from './types';

export type HollowTrackBackup = {
  version: number;
  app: 'HollowTrack';
  exportiertAm: string;
  struktur: Struktur;
  tage: Tagesdatensatz[];
};

export function createBackup(
  struktur: Struktur,
  tage: Tagesdatensatz[],
  exportiertAm = new Date().toISOString(),
): HollowTrackBackup {
  return {
    version: 2,
    app: 'HollowTrack',
    exportiertAm,
    struktur,
    tage,
  };
}

export function serializeBackup(backup: HollowTrackBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): unknown {
  return JSON.parse(text);
}

export type BackupImportPreview = {
  struktur: unknown;
  tage: Tagesdatensatz[];
};

export function prepareBackupImport(data: unknown): BackupImportPreview {
  if (!data || typeof data !== 'object') {
    throw new Error('Ungültige Sicherungsdatei.');
  }

  const record = data as Record<string, unknown>;

  if (!Array.isArray(record.tage)) {
    throw new Error('Keine Tagesdaten gefunden.');
  }

  return {
    struktur: record.struktur ?? null,
    tage: record.tage as Tagesdatensatz[],
  };
}
