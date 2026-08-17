import { useEffect, useMemo, useState } from 'react';
import { Dumbbell, Pause, Play, Square } from 'lucide-react';

import type { Struktur } from '../types';

const TRAININGSARTEN = [
  {
    name: 'Hypertrophie',
    ziel: 'Muskelaufbau',
    intensitaet: 'Moderat bis hoch',
    wiederholungen: 'ca. 6–15',
    pause: 'ca. 1–3 Minuten',
    versagen: 'meist 0–3 Wiederholungen im Tank',
  },
  {
    name: 'Maximalkraft',
    ziel: 'Maximale Kraftentwicklung',
    intensitaet: 'Sehr hoch',
    wiederholungen: 'ca. 1–5',
    pause: 'ca. 2–5 Minuten',
    versagen: 'meist 1–3 Wiederholungen im Tank',
  },
  {
    name: 'Kraftausdauer',
    ziel: 'Kraft über längere Belastungen halten',
    intensitaet: 'Leicht bis moderat',
    wiederholungen: 'ca. 15–30+',
    pause: 'ca. 30–90 Sekunden',
    versagen: 'meist 1–3 Wiederholungen im Tank',
  },
  {
    name: 'Techniktraining',
    ziel: 'Bewegungsqualität und Technik verbessern',
    intensitaet: 'Leicht bis moderat',
    wiederholungen: 'meist 3–8 saubere Wiederholungen',
    pause: 'ca. 1–3 Minuten',
    versagen: 'deutlich vor Muskelversagen stoppen',
  },
  {
    name: 'Deload',
    ziel: 'Erholung bei Erhalt der Bewegungsmuster',
    intensitaet: 'Deutlich reduziert',
    wiederholungen: 'individuell, mit reduziertem Volumen',
    pause: 'komfortabel',
    versagen: 'weit vom Muskelversagen entfernt',
  },
  {
    name: 'Reha',
    ziel: 'Kontrollierter Belastungsaufbau',
    intensitaet: 'Leicht und beschwerdeorientiert',
    wiederholungen: 'individuell nach Übung',
    pause: 'ausreichend für saubere Ausführung',
    versagen: 'kein erzwungenes Muskelversagen',
  },
  {
    name: 'Mobility',
    ziel: 'Beweglichkeit und kontrollierter Bewegungsumfang',
    intensitaet: 'Leicht bis moderat',
    wiederholungen: 'Wiederholungen oder Haltezeiten',
    pause: 'nach Bedarf',
    versagen: 'nicht relevant',
  },
  {
    name: 'Ausdauer',
    ziel: 'Herz-Kreislauf-Leistung und Belastbarkeit',
    intensitaet: 'Je nach Einheit',
    wiederholungen: 'Zeit, Strecke oder Intervalle',
    pause: 'abhängig von der Trainingsform',
    versagen: 'nicht als primäres Ziel',
  },
  {
    name: 'Zirkeltraining',
    ziel: 'Kraft und Kondition kombiniert trainieren',
    intensitaet: 'Moderat bis hoch',
    wiederholungen: 'ca. 8–20 oder zeitbasiert',
    pause: 'kurz zwischen Übungen',
    versagen: 'meist knapp vor Muskelversagen stoppen',
  },
  {
    name: 'HIIT',
    ziel: 'Hohe konditionelle Belastung in Intervallen',
    intensitaet: 'Sehr hoch',
    wiederholungen: 'kurze intensive Intervalle',
    pause: 'Intervallpausen',
    versagen: 'Leistungsabfall begrenzt die Einheit',
  },
 ] as const;

const AUTOMATISCHE_PAUSEN: Record<string, number> = {
  Hypertrophie: 120,
  Maximalkraft: 180,
  Kraftausdauer: 60,
  Techniktraining: 120,
};

const MANUELLE_PAUSEN = [30, 45, 60, 90, 120, 180, 240, 300];

type SportViewProps = {
  structure: Struktur;
  date: string;
  initialValues?: Record<string, string | number>;
  previousValues?: Record<string, string | number>;
  previousStagnationCounts?: Record<string, number>;
  initialLevel?: 1 | 2 | 3;
  initialTrainingsart?: string;
  onSave: (
    values: Record<string, string>,
    level: 1 | 2 | 3,
  trainingsart: string,
  ) => void;
};

export function SportView({
  structure,
  date,
  initialValues = {},
  previousValues = {},
  previousStagnationCounts = {},
  initialLevel = 2,
  initialTrainingsart = '',
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
  const [trainingsart, setTrainingsart] = useState(initialTrainingsart);
  const [manualPauseSeconds, setManualPauseSeconds] = useState<number | ''>('');
  const [pauseEndAt, setPauseEndAt] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);

  const automaticPauseSeconds = trainingsart
    ? AUTOMATISCHE_PAUSEN[trainingsart]
    : undefined;

  const pauseSeconds =
    automaticPauseSeconds ??
    (typeof manualPauseSeconds === 'number'
      ? manualPauseSeconds
      : 0);

  const formatPause = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return `${minutes}:${String(rest).padStart(2, '0')}`;
  };

  const startPauseTimer = () => {
    if (!pauseSeconds) return;

    const secondsToRun =
      timerPaused && timerRemaining > 0
        ? timerRemaining
        : pauseSeconds;

    setTimerRemaining(secondsToRun);
    setTimerDone(false);
    setTimerPaused(false);
    setPauseEndAt(Date.now() + secondsToRun * 1000);
  };

  const pausePauseTimer = () => {
    if (pauseEndAt === null) return;

    const remaining = Math.max(
      0,
      Math.ceil((pauseEndAt - Date.now()) / 1000),
    );

    setTimerRemaining(remaining);
    setPauseEndAt(null);
    setTimerPaused(remaining > 0);

    if (remaining === 0) {
      setTimerDone(true);
    }
  };

  const stopPauseTimer = () => {
    setPauseEndAt(null);
    setTimerRemaining(pauseSeconds);
    setTimerPaused(false);
    setTimerDone(false);
  };

  useEffect(() => {
    if (pauseEndAt === null) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((pauseEndAt - Date.now()) / 1000),
      );

      setTimerRemaining(remaining);

      if (remaining === 0) {
        setPauseEndAt(null);
        setTimerPaused(false);
        setTimerDone(true);
      }
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(interval);
  }, [pauseEndAt]);

  useEffect(() => {
    setPauseEndAt(null);
    setTimerRemaining(0);
    setTimerDone(false);
    setTimerPaused(false);

    if (
      trainingsart &&
      AUTOMATISCHE_PAUSEN[trainingsart] !== undefined
    ) {
      setManualPauseSeconds('');
    }
  }, [trainingsart]);

  const comparisonClass = (
    currentValue: string | undefined,
    previousValue: string | number | undefined,
    previousStagnationCount = 0,
  ) => {
    if (
      currentValue === undefined ||
      currentValue.trim() === '' ||
      previousValue === undefined
    ) {
      return '';
    }

    const current = Number(currentValue);
    const previous = Number(previousValue);

    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return '';
    }

    if (current === previous) {
      return previousStagnationCount >= 3
        ? 'sport-value--same'
        : 'sport-value--better';
    }
    if (current > previous) return 'sport-value--better';
    return 'sport-value--worse';
  };

  useEffect(() => {
    setValues(
      Object.fromEntries(
        Object.entries(initialValues).map(([trackerId, value]) => [
          trackerId,
          String(value),
        ]),
      ),
    );
    setLevel(initialLevel);
    setSelectedAreaId('');
    setTrainingsart(initialTrainingsart);
  }, [date, initialValues, initialLevel, initialTrainingsart]);

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
        const trackerIds = new Set(area.trackerIds);

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
            <span className="field-label">Trainingsbereich</span>
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
      <label className="field sport-training-type-selector">
        <span className="field-label">Trainingsart</span>
        <select
          className="field-input"
          value={trainingsart}
          onChange={(event) => setTrainingsart(event.target.value)}
        >
          <option value="">Trainingsart wählen</option>
          {TRAININGSARTEN.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      {trainingsart ? (() => {
        const info = TRAININGSARTEN.find((item) => item.name === trainingsart);
        return info ? (
          <div className="sport-training-info">
            <strong>{info.name}</strong>
            <div>Ziel: {info.ziel}</div>
            <div>Intensität: {info.intensitaet}</div>
            <div>Wiederholungen: {info.wiederholungen}</div>
            <div>Pause: {info.pause}</div>
            <div>Muskelversagen: {info.versagen}</div>
          </div>
        ) : null;
      })() : null}



      {trainingsart ? (
        <div className="sport-pause-panel">
          {automaticPauseSeconds !== undefined ? (
            <div className="sport-pause-setting">
              <span>Pausenzeit</span>
              <strong>{formatPause(automaticPauseSeconds)}</strong>
              <span className="sport-pause-setting__hint">
                automatisch
              </span>
            </div>
          ) : (
            <label className="field sport-pause-selector">
              <span className="field-label">Pausenzeit</span>
              <select
                className="field-input"
                value={manualPauseSeconds}
                onChange={(event) =>
                  setManualPauseSeconds(
                    event.target.value
                      ? Number(event.target.value)
                      : '',
                  )
                }
              >
                <option value="">Pausenzeit wählen</option>
                {MANUELLE_PAUSEN.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {formatPause(seconds)} min
                  </option>
                ))}
              </select>
            </label>
          )}


        </div>
      ) : null}

      {pauseSeconds > 0 ? (
        <div
          className={`sport-pause-floating ${
            pauseEndAt !== null
              ? 'sport-pause-floating--running'
              : timerDone
                ? 'sport-pause-floating--done'
                : ''
          }`}
        >
          <span>
            {timerDone
              ? 'Pause beendet'
              : timerPaused
                ? 'Pausiert'
                : 'Pause'}
          </span>

          <strong>
            {formatPause(
              pauseEndAt !== null || timerPaused
                ? timerRemaining
                : pauseSeconds,
            )}
          </strong>

          <div className="sport-pause-floating__controls">
            <button
              type="button"
              className="sport-pause-floating__control"
              onClick={
                pauseEndAt !== null
                  ? pausePauseTimer
                  : startPauseTimer
              }
              aria-label={
                pauseEndAt !== null
                  ? 'Pausentimer pausieren'
                  : 'Pausentimer starten'
              }
              title={
                pauseEndAt !== null
                  ? 'Pause'
                  : 'Start'
              }
            >
              {pauseEndAt !== null ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>

            <button
              type="button"
              className="sport-pause-floating__control"
              onClick={stopPauseTimer}
              aria-label="Pausentimer stoppen"
              title="Stop"
            >
              <Square size={17} />
            </button>
          </div>
        </div>
      ) : null}

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
                      {tracker.trainingsgewichtAktiv === true ||
              tracker.trainingsgewicht !== undefined ? (
                <label className="sport-weight-row">
                  <span className="sport-weight-row__label">
                    Trainingsgewicht
                  </span>
                  <div className="sport-weight-row__input-wrap">
                    <input
                      className={`field-input sport-weight-row__input ${comparisonClass(
                        values[`${tracker.id}::gewicht`],
                        previousValues[`${tracker.id}::gewicht`],
                      )}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={values[`${tracker.id}::gewicht`] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [`${tracker.id}::gewicht`]: event.target.value,
                        }))
                      }
                      placeholder="kg"
                    />
                    <span className="sport-weight-row__unit">kg</span>
                  </div>
                </label>
              ) : null}


                    {usesSets ? (
                      <div className="sport-tracker__sets">
                        {Array.from({ length: setCount }, (_, index) => {
                          const setNumber = index + 1;
                          const setKey = `${tracker.id}::satz-${setNumber}`;

                          return (
                            <div key={setKey} className="sport-set-row">
                              <span className="sport-set-row__label">
                                {setNumber}. Satz:
                              </span>

                              <input
                                className={`field-input sport-set-row__input ${comparisonClass(
                          values[setKey],
                          previousValues[setKey],
                        )}`}
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
                      {previousValues[setKey] !== undefined ? (
                        <span className="sport-previous-value">
                          letztes Mal: {previousValues[setKey]}
                        </span>
                      ) : null}
                            

                    </div>
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
              onClick={() => onSave(values, level, trainingsart)}
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
