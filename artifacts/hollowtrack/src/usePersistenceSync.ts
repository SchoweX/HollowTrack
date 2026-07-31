import { useEffect, useState } from 'react';

type PersistenceSyncOptions<TStructure, TDays, TBackupInfo> = {
  structure: TStructure;
  days: TDays;
  backupInfo: TBackupInfo;
  saveStructure: (structure: TStructure) => void;
  saveDays: (days: TDays) => void;
  saveBackupInfo: (backupInfo: TBackupInfo) => void;
};

export function usePersistenceSync<TStructure, TDays, TBackupInfo>({
  structure,
  days,
  backupInfo,
  saveStructure,
  saveDays,
  saveBackupInfo,
}: PersistenceSyncOptions<TStructure, TDays, TBackupInfo>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    saveStructure(structure);
    setReady(true);
  }, [structure, saveStructure]);

  useEffect(() => {
    saveDays(days);
  }, [days, saveDays]);

  useEffect(() => {
    saveBackupInfo(backupInfo);
  }, [backupInfo, saveBackupInfo]);

  return { ready };
}
