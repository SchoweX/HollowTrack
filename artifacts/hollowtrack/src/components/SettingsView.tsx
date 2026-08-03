import { useState, type ReactNode } from 'react';
import { Settings, Dumbbell, Utensils, CalendarDays } from 'lucide-react';
import {
  TodaySettingsTree,
  type TodaySettingsTreeProps,
} from './TodaySettingsTree';

type SettingsSection = 'root' | 'today' | 'sport' | 'ernaehrung';

type SettingsViewProps = TodaySettingsTreeProps & {
  backupPanel: ReactNode;
};

export function SettingsView({
  backupPanel,
  ...props
}: SettingsViewProps) {
  const [section, setSection] = useState<SettingsSection>('root');

  if (section === 'today') {
    return (
      <div className="settings-subpage">
        <button className="button" type="button" onClick={() => setSection('root')}>
          Zurück zu Einstellungen
        </button>
        <h2>Heute-Einstellungen</h2>
        <TodaySettingsTree {...props} categoryPurpose="heute" />
      </div>
    );
  }

  if (section === 'sport') {
    return (
      <div className="settings-subpage">
        <button className="button" type="button" onClick={() => setSection('root')}>
          Zurück zu Einstellungen
        </button>
        <h2>Sport-Einstellungen</h2>
        <TodaySettingsTree {...props} categoryPurpose="sport" />
      </div>
    );
  }

  if (section === 'ernaehrung') {
    return (
      <div className="settings-subpage">
        <button className="button" type="button" onClick={() => setSection('root')}>
          Zurück zu Einstellungen
        </button>
        <h2>Ernährungseinstellungen</h2>
        <p>
          Hier verwalten wir künftig Ernährungsziele, Bereiche und
          Ernährungstracker.
        </p>
      </div>
    );
  }

  return (
    <div className="settings-overview">
      <div className="settings-overview__heading">
        <Settings size={20} />
        <div>
          <h2>Einstellungen</h2>
          <p>Wähle den Bereich aus, den du verwalten möchtest.</p>
        </div>
      </div>

      <div className="settings-overview__actions">
        <button className="button button--primary settings-overview__button" type="button" onClick={() => setSection('today')}>
          <CalendarDays size={18} />
          Heute-Einstellungen
        </button>

        <button className="button settings-overview__button" type="button" onClick={() => setSection('sport')}>
          <Dumbbell size={18} />
          Sport-Einstellungen
        </button>

        <button className="button settings-overview__button" type="button" onClick={() => setSection('ernaehrung')}>
          <Utensils size={18} />
          Ernährungseinstellungen
        </button>
      </div>

      <div className="settings-overview__backup">
        {backupPanel}
      </div>
    </div>
  );
}
