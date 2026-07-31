import type { Tagesdatensatz } from './types';
import { formatDate } from './utils';
import { browserDialogs } from './platform';

type HistoryActionsOptions = {
  setSuccess: (value: string) => void;
  setSelectedDate: (value: string) => void;
  setDetailRecord: (value: Tagesdatensatz | null) => void;
  setDays: (updater: (current: Tagesdatensatz[]) => Tagesdatensatz[]) => void;
  goHome: () => void;
  showSuccess: (message: string) => void;
};

export function createHistoryActions({
  setSuccess,
  setSelectedDate,
  setDetailRecord,
  setDays,
  goHome,
  showSuccess,
}: HistoryActionsOptions) {
  const resetDay = () => {
    setSuccess('');
  };

  const selectHistoryDay = (record: Tagesdatensatz) => {
    setSelectedDate(record.datum);
    setDetailRecord(null);
    goHome();
  };

  const deleteHistoryDay = (record: Tagesdatensatz) => {
    if (
      !browserDialogs.confirm(
        `Möchtest du den Eintrag vom ${formatDate(record.datum)} wirklich endgültig löschen?`,
      )
    )
      return;

    setDays((current) => current.filter((item) => item.id !== record.id));
    setDetailRecord(null);
    showSuccess('Tagesdatensatz wurde gelöscht.');
  };

  return {
    resetDay,
    selectHistoryDay,
    deleteHistoryDay,
  };
}
