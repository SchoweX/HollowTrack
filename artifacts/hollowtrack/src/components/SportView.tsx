import { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';

import type { Struktur } from '../types';

type SportViewProps = {
  structure: Struktur;
  date: string;
  initialValues?: Record<string, string | number>;
  initialLevel?: 1 | 2 | 3;
  onSave: (
    values: Record<string, string>,
    level: 1 | 2 | 3,
  ) => void;
};

export function SportView({
  structure,
  date,
  initialValues = {},
  initialLevel = 2,
  onSave,
}: SportViewProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(initialLevel);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialValues).map(([trackerId, value]) => [
        trackerId,
        String(value),
      ]),
    ),
  );
  const [selectedAreaId, setSelectedAreaId] = useState('');

  const sportAreas = useMemo(() => {
    const sportCategory = structure.kategorien.find(
      (category) =>
        category.aktiv &&
        category.name.trim().toLocaleLowerCase('de-DE') === 'sport',
    );

    if (!sportCategory) {
      return [];
    }

    return sportCategory.bereichIds
      .map((areaId) =>
        structure.bereiche.find(
          (area) => area.id === areaId && area.aktiv,
        ),
      )
      .filter(
        (
          area,
        ): area is NonNullable<typeof area> => Boolean(area),
      )
      .map((area) => {
        const trackerIds = new Set(
          area.ansichtIds.flatMap((viewId) => {
            const view = structure.ansichten.find(
              (item) => item.id === viewId && item.aktiv,
            );

            return view?.trackerIds ?? [];
          }),
        );

        const trackers = structure.tracker
          .filter(
            (tracker) =>
              tracker.aktiv && trackerIds.has(tracker.id),
          )
          .sort((first, second) => first.position - second.position);

        return {
          area,
          trackers,
        };
      });
  }, [structure]);

  const selectedSportArea =
    sportAreas.find(({ area }) => area.id === selectedAreaId) ?? sportAreas[0];

  const hasSportTrackers = sportAreas.length > 0;

  return (
    <section className="module module-wide">
      <div className="module-heading">
        <div className="module-eyebrow">
          <Dumbbell size={15} />
          Sport
        </div>

        <h1 className="module-title">Training erfassen</h1>

        <p className="module-description">
          Wähle deine Trainingsstufe und trage anschließend die Werte
          deiner eigenen Übungs-Tracker ein.
        </p>
      </div>

          <label className="field sport-area-selector">
            <span className="field-label">Trainingsart</span>
            <select
              className="field-input"
              value={selectedSportArea?.area.id ?? ''}
              onChange={(event) => setSelectedAreaId(event.target.value)}
            >
              {sportAreas.map(({ area }) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>

      <div className="sport-level-selector">
        <span className="form-status">Trainingsstufe</span>

        <div className="verwaltung-actions">
          {([1, 2, 3] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={
                level === item
                  ? 'button button-primary'
                  : 'button'
              }
              aria-pressed={level === item}
              onClick={() => setLevel(item)}
            >
              Stufe {item}
            </button>
          ))}
        </div>
      </div>

      {hasSportTrackers ? (
        <div className="tracker-view">
          {selectedSportArea ? (
            <div className="verwaltungsliste">
              {selectedSportArea.trackers.map((tracker) => {
                const usesSets = tracker.erfassungsart === 'saetze';
                const setCount = level === 3 ? 3 : 2;

                return (
                  <div key={tracker.id} className="sport-tracker">
                    <span className="field-label sport-tracker__name">
                      {tracker.name}
                    </span>
                      {tracker.trainingsgewicht !== undefined ? (
                        <span className="sport-tracker__weight">
                          Trainingsgewicht: {tracker.trainingsgewicht} kg
                        </span>
                      ) : null}


                    {usesSets ? (
                      <div className="sport-tracker__sets">
                        {Array.from({ length: setCount }, (_, index) => {
                          const setNumber = index + 1;
                          const setKey = `${tracker.id}::satz-${setNumber}`;

                          return (
                            <label key={setKey} className="sport-set-row">
                              <span className="sport-set-row__label">
                                {setNumber}. Satz:
                              </span>

                              <input
                                className="field-input sport-set-row__input"
                                type="number"
                                inputMode="decimal"
                                value={values[setKey] ?? ''}
                                placeholder={
                                  tracker.einheit
                                    ? `Wert in ${tracker.einheit}`
                                    : 'Wert'
                                }
                                onChange={(event) =>
                                  setValues((current) => ({
                                    ...current,
                                    [setKey]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        className="field-input"
                        type="number"
                        inputMode="decimal"
                        value={values[tracker.id] ?? ''}
                        placeholder={
                          tracker.einheit
                            ? `Wert in ${tracker.einheit}`
                            : 'Wert'
                        }
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [tracker.id]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="verwaltung-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => onSave(values, level)}
            >
              Training speichern
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Dumbbell size={30} />

          <p>
            Lege in den Einstellungen zuerst eine Kategorie
            „Sport“, eigene Bereiche und darin deine
            Übungs-Tracker an.
          </p>
        </div>
      )}

      <p className="form-status">Datum: {date}</p>
    </section>
  );
}
