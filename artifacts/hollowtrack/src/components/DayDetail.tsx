import { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';

import type {
  Formularwert,
  Struktur,
  Tagesdatensatz,
  Tracker,
} from '../types';
import { formatDate, valueExists } from '../utils';
import { recordValue } from '../records';

type DayDetailProps = {
  record: Tagesdatensatz;
  structure: Struktur;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatTrackerValue(value: Formularwert) {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  if (Array.isArray(value)) return value.join(', ');

  return String(value);
}

function getCategoryTrackers(
  structure: Struktur,
  categoryId: string,
): Tracker[] {
  const category = structure.kategorien.find(
    (item) => item.id === categoryId,
  );

  if (!category) return [];

  const trackerIds = new Set(
    category.bereichIds.flatMap((areaId) => {
      const area = structure.bereiche.find((item) => item.id === areaId);

      return (
        area?.ansichtIds.flatMap((viewId) => {
          const view = structure.ansichten.find(
            (item) => item.id === viewId,
          );

          return view?.trackerIds ?? [];
        }) ?? []
      );
    }),
  );

  return structure.tracker.filter(
    (tracker) => trackerIds.has(tracker.id) && tracker.aktiv,
  );
}

export function DayDetail({
  record,
  structure,
  onClose,
  onEdit,
  onDelete,
}: DayDetailProps) {
  const [selectedSection, setSelectedSection] = useState<
    'heute' | 'sport' | 'ernaehrung' | null
  >(null);

  const sectionLabel =
    selectedSection === 'sport'
      ? 'Sport'
      : selectedSection === 'ernaehrung'
        ? 'Ernährung'
        : selectedSection === 'heute'
          ? 'Heute'
          : null;

  const activeCategories = [...structure.kategorien]
    .filter((category) => category.aktiv)
    .sort((a, b) => a.position - b.position);

  const selectedCategories = activeCategories.filter((category) => {
    const name = category.name.trim().toLocaleLowerCase('de-DE');
    const isSport = name === 'sport';
    const isNutrition = name === 'ernährung' || name === 'ernaehrung';

    if (selectedSection === 'sport') return isSport;
    if (selectedSection === 'ernaehrung') return isNutrition;
    if (selectedSection === 'heute') return !isSport && !isNutrition;

    return false;
  });

  const categorySections = selectedCategories
    .map((category, categoryIndex) => {
      const entries = getCategoryTrackers(structure, category.id)
        .map((tracker) => ({
          tracker,
          value: recordValue(record, tracker),
        }))
        .filter(({ value }) => valueExists(value));

      const assessment =
        record.kategorieNotizen?.[category.id] ??
        (categoryIndex === 0 ? record.notizen : '');

      return {
        category,
        entries,
        assessment,
      };
    })
    .filter(
      ({ entries, assessment }) =>
        entries.length > 0 || assessment.trim().length > 0,
    );

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="detail-title">
              {formatDate(record.datum)}
            </h2>

            <p className="modal__description">
              {sectionLabel ?? 'Wähle einen Bereich für diesen Tag.'}
            </p>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Tagesansicht schließen"
          >
            <X size={17} />
          </button>
        </div>

        <div className="detail-category-list">
          {selectedSection === null ? (
            <div className="detail-section-picker">
              <button
                className="button button--primary"
                type="button"
                onClick={() => setSelectedSection('heute')}
              >
                Heute
              </button>

              <button
                className="button button--primary"
                type="button"
                onClick={() => setSelectedSection('sport')}
              >
                Sport
              </button>

              <button
                className="button button--primary"
                type="button"
                onClick={() => setSelectedSection('ernaehrung')}
              >
                Ernährung
              </button>
            </div>
          ) : categorySections.length > 0 ? (
            categorySections.map(({ category, entries, assessment }) => (
              <section
                className="detail-category"
                key={category.id}
              >
                <h3 className="detail-category__title">
                  {category.name}
                </h3>

                {entries.length > 0 ? (
                  <div className="detail-list">
                    {entries.map(({ tracker, value }) => (
                      <div
                        className="detail-row"
                        key={tracker.id}
                      >
                        <span>{tracker.name}</span>

                        <strong>
                          {formatTrackerValue(value)}
                          {tracker.einheit ? ` ${tracker.einheit}` : ''}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="hinweis">
                    Für diese Kategorie wurden keine Trackerwerte gespeichert.
                  </p>
                )}

                {assessment.trim() ? (
                  <div className="detail-notes">
                    <strong>Selbsteinschätzung</strong>
                    <p>{assessment}</p>
                  </div>
                ) : (
                  <p className="hinweis">
                    Keine Selbsteinschätzung gespeichert.
                  </p>
                )}
              </section>
            ))
          ) : (
            <p className="hinweis">
              Für diesen Bereich sind an diesem Tag keine Einträge gespeichert.
            </p>
          )}
        </div>

        <div className="modal__actions detail-actions">
          {selectedSection !== null ? (
            <button
              className="button button--quiet"
              type="button"
              onClick={() => setSelectedSection(null)}
            >
              Zurück
            </button>
          ) : null}

          <button
            className="button button--quiet"
            type="button"
            onClick={onClose}
          >
            Schließen
          </button>

          {selectedSection !== null ? (
            <>
              <button
                className="button button--danger"
                type="button"
                onClick={onDelete}
              >
                <Trash2 size={14} />
                Eintrag löschen
              </button>

              <button
                className="button button--primary"
                type="button"
                onClick={onEdit}
              >
                <Pencil size={14} />
                Tag bearbeiten
              </button>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
