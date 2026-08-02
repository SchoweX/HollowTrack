import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
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
  const [trackerId, setTrackerId] = useState(
    () => categoryOptions[0]?.trackers[0]?.id ?? '',
  );

  useEffect(() => {
    const categoryStillExists = categoryOptions.some(
      (item) => item.category.id === categoryId,
    );

    if (!categoryStillExists) {
      const nextCategory = categoryOptions[0];

      setCategoryId(nextCategory?.category.id ?? '');
      setTrackerId(nextCategory?.trackers[0]?.id ?? '');
    }
  }, [categoryId, categoryOptions]);

  const selectedCategory = categoryOptions.find(
    (item) => item.category.id === categoryId,
  );

  useEffect(() => {
    const trackerStillExists = selectedCategory?.trackers.some(
      (tracker) => tracker.id === trackerId,
    );

    if (!trackerStillExists) {
      setTrackerId(selectedCategory?.trackers[0]?.id ?? '');
    }
  }, [selectedCategory, trackerId]);

  const selectedTracker = selectedCategory?.trackers.find(
    (tracker) => tracker.id === trackerId,
  );

  const chartData = useMemo(() => {
    if (!selectedTracker) return [];

    return [...days]
      .sort((first, second) =>
        first.datum.localeCompare(second.datum),
      )
      .flatMap((record) => {
        const value = recordValue(record, selectedTracker);

        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return [];
        }

        return [
          {
            datum: record.datum,
            beschriftung: formatChartDate(record.datum),
            wert: value,
          },
        ];
      });
  }, [days, selectedTracker]);

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
              setTrackerId(nextCategory?.trackers[0]?.id ?? '');
            }}
          >
            {categoryOptions.map(({ category }) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Tracker</span>
          <select
            value={trackerId}
            onChange={(event) => setTrackerId(event.target.value)}
          >
            {selectedCategory?.trackers.map((tracker) => (
              <option key={tracker.id} value={tracker.id}>
                {tracker.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="statistics-chart-card">
        <div className="statistics-chart-heading">
          <div>
            <h2>{selectedTracker?.name}</h2>
            <p>
              {selectedCategory?.category.name}
              {selectedTracker?.einheit
                ? ` · ${selectedTracker.einheit}`
                : ''}
            </p>
          </div>

          <span>
            {chartData.length}{' '}
            {chartData.length === 1 ? 'Eintrag' : 'Einträge'}
          </span>
        </div>

        {chartData.length > 0 ? (
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
                  formatter={(value) => [
                    value,
                    selectedTracker?.name ?? 'Wert',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="wert"
                  stroke="currentColor"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="hinweis">
            Für diesen Tracker wurden noch keine Zahlenwerte
            gespeichert.
          </p>
        )}
      </section>
    </div>
  );
}
