import { useState } from 'react';
import type { ImportKonflikt, ImportVorschau, Sicherungsinfo } from '../types';

export function useImportExportState(initialBackupInfo: () => Sicherungsinfo) {
  const [backupInfo, setBackupInfo] = useState<Sicherungsinfo>(initialBackupInfo);
  const [importPreview, setImportPreview] = useState<ImportVorschau | null>(null);
  const [importDecisions, setImportDecisions] = useState<Record<string, ImportKonflikt>>({});
  const [importMessage, setImportMessage] = useState('');

  return {
    backupInfo,
    setBackupInfo,
    importPreview,
    setImportPreview,
    importDecisions,
    setImportDecisions,
    importMessage,
    setImportMessage,
  };
}
