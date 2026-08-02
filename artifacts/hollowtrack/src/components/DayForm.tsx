import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Folder,
  FolderOpen,
  RotateCcw,
  Save,
} from 'lucide-react';

import type {
  Formularwert,
  Struktur,
  Tagesdatensatz,
} from '../types';
import { getAllTrackers, recordValue } from '../records';
import { valueExists } from '../utils';
import { browserDialogs } from '../platform';
import { InputField } from './InputField';

type DayFormProps = {
  structure: Struktur;
  date: string;
  days: Tagesdatensatz[];
  onSave: (
    date: string,
    values: Record<string, Formularwert>,
    categoryNotes: Record<string, string>,
  ) => void;
  onReset: () => void;
  success: string;
};

export function DayForm({
  structure,
  date,
  days,
  onSave,
  onReset,
  success,
}: DayFormProps) {
  const record = days.find((item) => item.datum === date);

  const [values, setValues] = useState<Record<string, Formularwert>>({});
  const [categoryNotes, setCategoryNotes] = useState<
    Record<string, string>
  >({});
  const folderTreeRef = useRef<HTMLDivElement>(null);

  const setAllFoldersOpen = (open: boolean) => {
    if (open) {
      folderTreeRef.current
        ?.querySelectorAll<HTMLDetailsElement>('details')
        .forEach((folder) => {
          folder.open = true;
        });

      return;
    }

    folderTreeRef.current
      ?.querySelectorAll<HTMLDetailsElement>('details.today-area')
      .forEach((area) => {
        area.open = false;
      });

    folderTreeRef.current
      ?.querySelectorAll<HTMLDetailsElement>('details.today-category')
      .forEach((category) => {
        category.open = true;
      });
  };

  const categories = structure.kategorien
    .filter((category) => category.aktiv)
    .map((category) => {
      const areas = category.bereichIds
        .map((areaId) =>
          structure.bereiche.find((area) => area.id === areaId),
        )
        .filter(
          (area): area is NonNullable<typeof area> =>
            Boolean(area?.aktiv),
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

          const trackers = structure.tracker.filter(
            (tracker) => tracker.aktiv && trackerIds.has(tracker.id),
          );

          return {
            area,
            trackers,
          };
        })
        .filter((group) => group.trackers.length > 0);

      return {
        category,
        areas,
      };
    })
    .filter((group) => group.areas.length > 0);

  useEffect(() => {
    const next: Record<string, Formularwert> = {};

    getAllTrackers(structure).forEach((tracker) => {
      const value = recordValue(record, tracker);

      if (valueExists(value)) {
        next[tracker.id] = value;
      }
    });

    setValues(next);
    setCategoryNotes(
      record?.kategorieNotizen ??
        (record?.notizen && categories[0]
          ? { [categories[0].category.id]: record.notizen }
          : {}),
    );
  }, [date, record?.id, record?.geaendertAm, structure]);

  const resetForm = () => {
    const confirmed = browserDialogs.confirm(
      'Möchtest du alle ungespeicherten Eingaben für diesen Tag wirklich zurücksetzen?',
    );

    if (!confirmed) {
      return;
    }

    if (record) {
      const next: Record<string, Formularwert> = {};

      getAllTrackers(structure).forEach((tracker) => {
        const value = recordValue(record, tracker);

        if (valueExists(value)) {
          next[tracker.id] = value;
        }
      });

      setValues(next);
      setCategoryNotes(
      record.kategorieNotizen ??
        (record.notizen && categories[0]
          ? { [categories[0].category.id]: record.notizen }
          : {}),
    );
    } else {
      setValues({});
      setCategoryNotes({});
    }

    onReset();
  };

  const hasData =
    Object.values(values).some((value) => valueExists(value)) ||
    Object.values(categoryNotes).some(
      (text) => text.trim().length > 0,
    );

  return (
    <div className="day-form">
      <div className="form-actions form-actions--top">
        <span className="form-status">
          {record ? 'Vorhandener Tagesdatensatz' : 'Neuer Tagesdatensatz'}
        </span>

        {success ? (
          <span className="save-success" role="status">
            <Check size={14} />
            {success}
          </span>
        ) : null}

        <button
          className="button button--quiet"
          type="button"
          onClick={resetForm}
        >
          <RotateCcw size={14} />
          Eingaben zurücksetzen
        </button>
      </div>

      <div className="today-folder-actions">
        <button
          className="button button--quiet"
          type="button"
          onClick={() => setAllFoldersOpen(true)}
        >
          Alle öffnen
        </button>

        <button
          className="button button--quiet"
          type="button"
          onClick={() => setAllFoldersOpen(false)}
        >
          Alle schließen
        </button>
      </div>

      <div className="today-folder-tree" ref={folderTreeRef}>
        {categories.map(({ category, areas }) => (
          <details
            className="form-group today-category"
            key={category.id}
            open
          >
            <summary className="form-group__summary">
              <Folder size={17} />
              <span>{category.name}</span>
              <ChevronDown size={15} />
            </summary>

            <div className="today-category__content">
              {areas.map(({ area, trackers }) => (
                <details
                  className="form-group today-area"
                  key={area.id}
                  open
                >
                  <summary className="form-group__summary">
                    <FolderOpen size={16} />
                    <span>{area.name}</span>
                    <ChevronDown size={15} />
                  </summary>

                  <div className="today-area__trackers">
                    {trackers.map((tracker) => (
                      <div
                        className="field today-tracker-field"
                        key={tracker.id}
                      >
                        <InputField
                          item={tracker}
                          value={values[tracker.id]}
                          onChange={(value) =>
                            setValues((current) => ({
                              ...current,
                              [tracker.id]: value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </details>
              ))}

              <label className="category-self-assessment">
                <span className="category-self-assessment__label">
                  Selbsteinschätzung
                </span>

                <textarea
                  value={categoryNotes[category.id] ?? ''}
                  onChange={(event) =>
                    setCategoryNotes((current) => ({
                      ...current,
                      [category.id]: event.target.value,
                    }))
                  }
                  rows={6}
                  placeholder={`Persönlicher Eintrag zu ${category.name}`}
                />
              </label>
            </div>
          </details>
        ))}
      </div>



      <div className="form-actions">
        <button
          className="button button--primary"
          type="button"
          style={{
            position: 'relative',
            zIndex: 9999,
            pointerEvents: 'auto',
            opacity: 1,
          }}
          onClick={() => onSave(date, values, categoryNotes)}
        >
          <Save size={14} />
          {record || hasData ? 'Änderungen speichern' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}
