import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { recordValue } from '../records';
import type {
  Kategorie,
  Struktur,
  Tagesdatensatz,
  Tracker,
} from '../types';

type StatisticsViewProps = {
  structure: Struktur;
  days: Tagesdatensatz[];
};

type CategoryOption = {
  category: Kategorie;
  trackers: Tracker[];
};

type ChartRow = {
  datum: string;
  beschriftung: string;
  [trackerId: string]: string | number;
};

const MAX_SELECTED_TRACKERS = 4;

const lineColors = [
  '#2f8477',
  '#7b61a8',
  '#c4773c',
  '#4f78a8',
];

const numericTypes = new Set([
  'Zahl',
  'Dezimalzahl',
  'Bewertung 0 bis 10',
  'Dauer',
]);

function trackersForCategory(
  structure: Struktur,
  category: Kategorie,
): Tracker[] {
  const trackerIds = new Set(
    category.bereichIds.flatMap((areaId) => {
      const area = structure.bereiche.find(
        (item) => item.id === areaId && item.aktiv,
      );

      if (!area) return [];

      return area.ansichtIds.flatMap((viewId) => {
        const view = structure.ansichten.find(
          (item) => item.id === viewId && item.aktiv,
        );

        return view?.trackerIds ?? [];
      });
    }),
  );

  return structure.tracker
    .filter(
      (tracker) =>
        tracker.aktiv &&
        trackerIds.has(tracker.id) &&
        numericTypes.has(tracker.typ),
    )
    .sort((first, second) => first.position - second.position);
}

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00`));
}

function trackerLabel(tracker: Tracker) {
  return tracker.einheit
    ? `${tracker.name} (${tracker.einheit})`
    : tracker.name;
}

export function StatisticsView({
  structure,
  days,
}: StatisticsViewProps) {
  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      structure.kategorien
        .filter((category) => category.aktiv)
        .sort((first, second) => first.position - second.position)
        .map((category) => ({
          category,
          trackers: trackersForCategory(structure, category),
        }))
        .filter((item) => item.trackers.length > 0),
    [structure],
  );

  const [categoryId, setCategoryId] = useState(
    () => categoryOptions[0]?.category.id ?? '',
  );

  const [selectedAreaId, setSelectedAreaId] = useState('');

  const [sportSeries, setSportSeries] = useState({
    satz1: true,
    satz2: true,
    satz3: false,
    gewicht: false,
  });

  const [selectedTrackerIds, setSelectedTrackerIds] = useState<string[]>(
    () => {
      const firstTracker = categoryOptions[0]?.trackers[0];
      return firstTracker ? [firstTracker.id] : [];
    },
  );

  useEffect(() => {
    const selectedCategoryExists = categoryOptions.some(
      (item) => item.category.id === categoryId,
    );

    if (!selectedCategoryExists) {
      const nextCategory = categoryOptions[0];

      setCategoryId(nextCategory?.category.id ?? '');
      setSelectedTrackerIds(
        nextCategory?.trackers[0]
          ? [nextCategory.trackers[0].id]
          : [],
      );
    }
  }, [categoryId, categoryOptions]);

  const selectedCategory = categoryOptions.find(
    (item) => item.category.id === categoryId,
  );

  const isSportCategory =
    selectedCategory?.category.zweck === 'sport' ||
    selectedCategory?.category.name.trim().toLocaleLowerCase('de-DE') ===
      'sport';


  const sportAreas = useMemo(() => {
    if (!isSportCategory || !selectedCategory) return [];

    return selectedCategory.category.bereichIds
      .flatMap((areaId) => {
        const area = structure.bereiche.find(
          (item) => item.id === areaId && item.aktiv,
        );

        if (!area) return [];

        const trackerIds = area.ansichtIds.flatMap((viewId) => {
          const view = structure.ansichten.find(
            (item) => item.id === viewId && item.aktiv,
          );

          return view?.trackerIds ?? [];
        });

        const trackers = trackerIds.flatMap((trackerId) => {
          const tracker = structure.tracker.find(
            (item) => item.id === trackerId && item.aktiv,
          );

          return tracker ? [tracker] : [];
        });

        return trackers.length > 0 ? [{ area, trackers }] : [];
      })
      .sort((a, b) => a.area.position - b.area.position);
  }, [isSportCategory, selectedCategory, structure]);

  const selectedArea =
    sportAreas.find((item) => item.area.id === selectedAreaId) ??
    sportAreas[0];

  const availableTrackers = isSportCategory
    ? selectedArea?.trackers ?? []
    : selectedCategory?.trackers ?? [];

  useEffect(() => {
    const availableIds = new Set(
      availableTrackers.map((tracker) => tracker.id),
    );

    const stillAvailable = selectedTrackerIds.filter((id) =>
      availableIds.has(id),
    );

    if (stillAvailable.length !== selectedTrackerIds.length) {
      setSelectedTrackerIds(
        stillAvailable.length > 0
          ? stillAvailable
          : availableTrackers[0]
            ? [availableTrackers[0].id]
            : [],
      );
    }
  }, [availableTrackers, selectedTrackerIds]);

  const selectedTrackers = availableTrackers.filter((tracker) =>
    selectedTrackerIds.includes(tracker.id),
  );

  const [period, setPeriod] = useState<7 | 30 | 90 | 'all'>(30);

  const filteredDays = useMemo(() => {
    if (period === 'all') return days;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - (period - 1));
    cutoff.setHours(0, 0, 0, 0);

    return days.filter((record) => {
      const recordDate = new Date(`${record.datum}T12:00:00`);
      return recordDate >= cutoff && recordDate <= today;
    });
  }, [days, period]);

  const chartData = useMemo<ChartRow[]>(() => {
    if (selectedTrackers.length === 0) return [];

    return [...filteredDays]
      .sort((first, second) =>
        first.datum.localeCompare(second.datum),
      )
      .flatMap((record) => {
        const row: ChartRow = {
          datum: record.datum,
          beschriftung: formatChartDate(record.datum),
        };

        let hasNumericValue = false;

        if (isSportCategory) {
          const tracker = selectedTrackers[0];
          const messwerte = record.messwerte ?? {};

          const addSportValue = (
            enabled: boolean,
            sourceKey: string,
            targetKey: string,
          ) => {
            if (!enabled) return;

            const rawValue = messwerte[sourceKey];

            if (
              rawValue === undefined ||
              rawValue === null ||
              rawValue === ''
            ) {
              return;
            }

            const numeric = Number(rawValue);

            if (!Number.isFinite(numeric)) return;

            row[targetKey] = numeric;
            hasNumericValue = true;
          };

          addSportValue(
            sportSeries.satz1,
            `${tracker.id}::satz-1`,
            'satz1',
          );
          addSportValue(
            sportSeries.satz2,
            `${tracker.id}::satz-2`,
            'satz2',
          );
          addSportValue(
            sportSeries.satz3,
            `${tracker.id}::satz-3`,
            'satz3',
          );
          addSportValue(
            sportSeries.gewicht,
            `${tracker.id}::gewicht`,
            'gewicht',
          );
        } else {
          selectedTrackers.forEach((tracker) => {
            const value = recordValue(record, tracker);

            if (
              typeof value === 'number' &&
              Number.isFinite(value)
            ) {
              row[tracker.id] = value;
              hasNumericValue = true;
            }
          });
        }

        return hasNumericValue ? [row] : [];
      });
  }, [
    filteredDays,
    selectedTrackers,
    isSportCategory,
    sportSeries,
  ]);

  const toggleTracker = (trackerId: string) => {
    if (isSportCategory) {
      setSelectedTrackerIds([trackerId]);
      return;
    }

    setSelectedTrackerIds((current) => {
      if (current.includes(trackerId)) {
        return current.filter((id) => id !== trackerId);
      }

      if (current.length >= MAX_SELECTED_TRACKERS) {
        return current;
      }

      return [...current, trackerId];
    });
  };

  if (categoryOptions.length === 0) {
    return (
      <p className="hinweis">
        Für das Diagramm sind noch keine aktiven Zahlen-,
        Bewertungs- oder Dauer-Tracker vorhanden.
      </p>
    );
  }

  return (
    <div className="statistics-view">
      <div className="statistics-controls">
        <div className="statistics-period">
          <span className="field-label">Zeitraum</span>

          <div className="statistics-period__buttons">
            {([
              [7, '7 Tage'],
              [30, '30 Tage'],
              [90, '90 Tage'],
              ['all', 'Gesamt'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  period === value
                    ? 'button button-primary statistics-period__button'
                    : 'button statistics-period__button'
                }
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">Kategorie</span>

          <select
            value={categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              const nextCategory = categoryOptions.find(
                (item) => item.category.id === nextCategoryId,
              );

              setCategoryId(nextCategoryId);
        setSelectedAreaId('');
        setSelectedTrackerIds([]);
            }}
          >
            {categoryOptions.map(({ category }) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      {isSportCategory && sportAreas.length > 0 ? (
        <label className="field">
          <span className="field__label">Trainingsbereich</span>
          <select
            value={selectedArea?.area.id ?? ''}
            onChange={(event) => {
              setSelectedAreaId(event.target.value);
              setSelectedTrackerIds([]);
            }}
          >
            {sportAreas.map(({ area }) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      </div>

      {isSportCategory ? (
        <fieldset className="statistics-sport-series">
          <legend>Anzeigen</legend>

          <div className="statistics-sport-series__options">
            <label>
              <input
                type="checkbox"
                checked={sportSeries.satz1}
                onChange={(event) =>
                  setSportSeries((current) => ({
                    ...current,
                    satz1: event.target.checked,
                  }))
                }
              />
              <span>Satz 1</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={sportSeries.satz2}
                onChange={(event) =>
                  setSportSeries((current) => ({
                    ...current,
                    satz2: event.target.checked,
                  }))
                }
              />
              <span>Satz 2</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={sportSeries.satz3}
                onChange={(event) =>
                  setSportSeries((current) => ({
                    ...current,
                    satz3: event.target.checked,
                  }))
                }
              />
              <span>Satz 3</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={sportSeries.gewicht}
                onChange={(event) =>
                  setSportSeries((current) => ({
                    ...current,
                    gewicht: event.target.checked,
                  }))
                }
              />
              <span>Gewicht</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      <fieldset className="statistics-tracker-picker">
        <legend>{isSportCategory ? 'Tracker' : 'Tracker auswählen'}</legend>

        <p>
          {isSportCategory
            ? 'Wähle einen Tracker für die Sport-Statistik.'
            : `Bis zu ${MAX_SELECTED_TRACKERS} Tracker können gleichzeitig verglichen werden.`}
        </p>

        <div className="statistics-tracker-options">
          {selectedCategory?.trackers.map((tracker) => {
            const checked = selectedTrackerIds.includes(tracker.id);
            const selectionLimitReached =
              selectedTrackerIds.length >= MAX_SELECTED_TRACKERS;

            return (
              <label
                className="statistics-tracker-option"
                key={tracker.id}
              >
                <input
                  type={isSportCategory ? 'radio' : 'checkbox'}
                  name={
                    isSportCategory
                      ? 'sport-statistics-tracker'
                      : undefined
                  }
                  checked={checked}
                  disabled={
                    !isSportCategory &&
                    !checked &&
                    selectionLimitReached
                  }
                  onChange={() => toggleTracker(tracker.id)}
                />

                <span>{trackerLabel(tracker)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <section className="statistics-chart-card">
        <div className="statistics-chart-heading">
          <div>
            <h2>Trackervergleich</h2>
            <p>{selectedCategory?.category.name}</p>
          </div>

          <span>
            {isSportCategory
              ? selectedTrackers[0]?.name ?? 'Kein Tracker'
              : `${selectedTrackers.length} von ${MAX_SELECTED_TRACKERS}`}
          </span>
        </div>

        {selectedTrackers.length === 0 ? (
          <p className="hinweis">
            Wähle mindestens einen Tracker für das Diagramm aus.
          </p>
        ) : chartData.length > 0 ? (
          <div className="statistics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="4 4" />

                <XAxis
                  dataKey="beschriftung"
                  minTickGap={24}
                />

                <YAxis
                  domain={['auto', 'auto']}
                  allowDecimals
                />

                <Tooltip
                  labelFormatter={(_, items) =>
                    items?.[0]?.payload?.datum ?? ''
                  }
                />

                <Legend />

                {isSportCategory && sportSeries.satz1 ? (
              <Line
                type="monotone"
                dataKey="satz1"
                name="Satz 1"
                stroke={lineColors[0 % lineColors.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ) : null}

            {isSportCategory && sportSeries.satz2 ? (
              <Line
                type="monotone"
                dataKey="satz2"
                name="Satz 2"
                stroke={lineColors[1 % lineColors.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ) : null}

            {isSportCategory && sportSeries.satz3 ? (
              <Line
                type="monotone"
                dataKey="satz3"
                name="Satz 3"
                stroke={lineColors[2 % lineColors.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ) : null}

            {isSportCategory && sportSeries.gewicht ? (
              <Line
                type="monotone"
                dataKey="gewicht"
                name="Gewicht"
                stroke={lineColors[3 % lineColors.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ) : null}

            {!isSportCategory
              ? selectedTrackers.map((tracker, index) => (
                  <Line
                    key={tracker.id}
                    type="monotone"
                    dataKey={tracker.id}
                    name={trackerLabel(tracker)}
                    stroke={lineColors[index % lineColors.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                ))
              : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="hinweis">
            Für die ausgewählten Tracker wurden noch keine
            Zahlenwerte gespeichert.
          </p>
        )}
      </section>
    </div>
  );
}
