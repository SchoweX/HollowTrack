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

  useEffect(() => {
    const availableIds = new Set(
      selectedCategory?.trackers.map((tracker) => tracker.id) ?? [],
    );

    const stillAvailable = selectedTrackerIds.filter((id) =>
      availableIds.has(id),
    );

    if (stillAvailable.length !== selectedTrackerIds.length) {
      setSelectedTrackerIds(
        stillAvailable.length > 0
          ? stillAvailable
          : selectedCategory?.trackers[0]
            ? [selectedCategory.trackers[0].id]
            : [],
      );
    }
  }, [selectedCategory, selectedTrackerIds]);

  const selectedTrackers =
    selectedCategory?.trackers.filter((tracker) =>
      selectedTrackerIds.includes(tracker.id),
    ) ?? [];

  const chartData = useMemo<ChartRow[]>(() => {
    if (selectedTrackers.length === 0) return [];

    return [...days]
      .sort((first, second) =>
        first.datum.localeCompare(second.datum),
      )
      .flatMap((record) => {
        const row: ChartRow = {
          datum: record.datum,
          beschriftung: formatChartDate(record.datum),
        };

        let hasNumericValue = false;

        selectedTrackers.forEach((tracker) => {
          const value = recordValue(record, tracker);

          if (typeof value === 'number' && Number.isFinite(value)) {
            row[tracker.id] = value;
            hasNumericValue = true;
          }
        });

        return hasNumericValue ? [row] : [];
      });
  }, [days, selectedTrackers]);

  const toggleTracker = (trackerId: string) => {
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
              setSelectedTrackerIds(
                nextCategory?.trackers[0]
                  ? [nextCategory.trackers[0].id]
                  : [],
              );
            }}
          >
            {categoryOptions.map(({ category }) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="statistics-tracker-picker">
        <legend>Tracker auswählen</legend>

        <p>
          Bis zu {MAX_SELECTED_TRACKERS} Tracker können gleichzeitig
          verglichen werden.
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
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selectionLimitReached}
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
            {selectedTrackers.length} von {MAX_SELECTED_TRACKERS}
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

                {selectedTrackers.map((tracker, index) => (
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
                ))}
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
