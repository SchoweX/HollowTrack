import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FolderOpen,
  Palette,
  Pencil,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { categoryIcon } from '../categoryIcons';
import type { Bereich, Kategorie, Struktur, Tracker } from '../types';

export type TodaySettingsTreeProps = {
  structure: Struktur;
  onEditCategory: (category: Kategorie) => void;
  onCycleCategoryIcon: (category: Kategorie) => void;
  onMoveCategory: (category: Kategorie, direction: -1 | 1) => void;
  onToggleCategory: (category: Kategorie) => void;
  onDeleteCategory: (category: Kategorie) => void;
  onEditArea: (area: Bereich) => void;
  onMoveArea: (area: Bereich) => void;
  onSortArea: (
    category: Kategorie,
    area: Bereich,
    direction: -1 | 1,
  ) => void;
  onToggleArea: (area: Bereich) => void;
  onDeleteArea: (area: Bereich) => void;
  onEditTracker: (tracker: Tracker) => void;
  onSortTracker: (
    area: Bereich,
    tracker: Tracker,
    direction: -1 | 1,
  ) => void;
  onToggleTracker: (tracker: Tracker) => void;
  onDeleteTracker: (tracker: Tracker) => void;
  onCreateCategory: () => void;
  onCreateArea: (category: Kategorie) => void;
  onCreateTracker: (area: Bereich) => void;
  categoryPurpose?: 'heute' | 'sport' | 'ernaehrung';
};

function byPosition<T extends { position: number }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position);
}

const rowStyle = (indent: number) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '30px',
  paddingLeft: `${indent}px`,
  fontSize: '14px',
});

const iconButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  padding: 0,
  margin: 0,
  border: 0,
  background: 'transparent',
  color: 'inherit',
};

const actionButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  minHeight: '28px',
  padding: '3px 7px',
  border: '1px solid currentColor',
  borderRadius: '7px',
  background: 'transparent',
  color: 'inherit',
  fontSize: '12px',
};

export function TodaySettingsTree({
  structure,
  onEditCategory,
  onCycleCategoryIcon,
  onMoveCategory,
  onToggleCategory,
  onDeleteCategory,
  onEditArea,
  onMoveArea,
  onSortArea,
  onToggleArea,
  onDeleteArea,
  onEditTracker,
  onSortTracker,
  onToggleTracker,
  onDeleteTracker,
  onCreateCategory,
  onCreateArea,
  onCreateTracker,
  categoryPurpose = 'heute',
}: TodaySettingsTreeProps) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [openAreaId, setOpenAreaId] = useState<string | null>(null);
  const [openTrackerId, setOpenTrackerId] = useState<string | null>(null);
  const categories = byPosition(structure.kategorien).filter((category) => {
    const purpose =
      category.zweck ??
      (category.name.trim().toLowerCase() === 'sport' ? 'sport' : 'heute');

    return purpose === categoryPurpose;
  });

  return (
    <div>
      {categories.map((category, categoryIndex) => {
        const CategoryIcon = categoryIcon(category.icon);
        const categoryMenuOpen = openCategoryId === category.id;

        const areas = byPosition(
          category.bereichIds
            .map((id) => structure.bereiche.find((area) => area.id === id))
            .filter((area): area is Bereich => Boolean(area)),
        );

        return (
          <div key={category.id}>
            <div style={rowStyle(0)}>
              <CategoryIcon size={16} />
              <span>{category.name}</span>

              <button
                type="button"
                style={iconButtonStyle}
                aria-label={`${category.name} einstellen`}
                aria-expanded={categoryMenuOpen}
                onClick={() =>
                  setOpenCategoryId(categoryMenuOpen ? null : category.id)
                }
              >
                <Settings size={15} />
              </button>
            </div>

            {categoryMenuOpen ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  padding: '3px 0 8px 22px',
                }}
              >
                <button
                  type="button"
                  style={actionButtonStyle}
                  onClick={() => {
                    onEditCategory(category);
                    setOpenCategoryId(null);
                  }}
                >
                  <Pencil size={13} />
                  Name
                </button>

                <button
                  type="button"
                  style={actionButtonStyle}
                  onClick={() => onCycleCategoryIcon(category)}
                >
                  <Palette size={13} />
                  Icon
                </button>

                <button
                  type="button"
                  style={actionButtonStyle}
                  disabled={categoryIndex === 0}
                  onClick={() => onMoveCategory(category, -1)}
                >
                  <ArrowUp size={13} />
                  Hoch
                </button>

                <button
                  type="button"
                  style={actionButtonStyle}
                  disabled={categoryIndex === categories.length - 1}
                  onClick={() => onMoveCategory(category, 1)}
                >
                  <ArrowDown size={13} />
                  Runter
                </button>

                <button
                  type="button"
                  style={actionButtonStyle}
                  onClick={() => onToggleCategory(category)}
                >
                  {category.aktiv ? <EyeOff size={13} /> : <Eye size={13} />}
                  {category.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                </button>

                <button
                  type="button"
                  style={actionButtonStyle}
                  onClick={() => {
                    onDeleteCategory(category);
                    setOpenCategoryId(null);
                  }}
                >
                  <Trash2 size={13} />
                  Löschen
                </button>
              </div>
            ) : null}

            {areas.map((area) => {
              const trackerIds = new Set(
                area.ansichtIds.flatMap((viewId) => {
                  const view = structure.ansichten.find(
                    (item) => item.id === viewId,
                  );

                  return view?.trackerIds ?? [];
                }),
              );

              const trackers = byPosition(
                structure.tracker.filter((tracker) =>
                  trackerIds.has(tracker.id),
                ),
              );

              return (
                <div key={area.id}>
                  <div style={rowStyle(16)}>
                    <FolderOpen size={15} />
                    <span>{area.name}</span>

                    <button
                      type="button"
                      style={iconButtonStyle}
                      aria-label={`${area.name} einstellen`}
                      aria-expanded={openAreaId === area.id}
                      onClick={() =>
                        setOpenAreaId(openAreaId === area.id ? null : area.id)
                      }
                    >
                      <Settings size={14} />
                    </button>
                  </div>

                  {openAreaId === area.id ? (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        padding: '3px 0 8px 38px',
                      }}
                    >
                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => {
                          onEditArea(area);
                          setOpenAreaId(null);
                        }}
                      >
                        <Pencil size={13} />
                        Name
                      </button>

                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => {
                          onMoveArea(area);
                          setOpenAreaId(null);
                        }}
                      >
                        <FolderOpen size={13} />
                        Verschieben
                      </button>

          <button
            type="button"
            style={actionButtonStyle}
            disabled={
              areas.findIndex((item) => item.id === area.id) === 0
            }
            onClick={() => onSortArea(category, area, -1)}
          >
            ↑ Hoch
          </button>

          <button
            type="button"
            style={actionButtonStyle}
            disabled={
              areas.findIndex((item) => item.id === area.id) ===
              areas.length - 1
            }
            onClick={() => onSortArea(category, area, 1)}
          >
            ↓ Runter
          </button>

                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => onToggleArea(area)}
                      >
                        {area.aktiv ? <EyeOff size={13} /> : <Eye size={13} />}
                        {area.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                      </button>

                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => {
                          onDeleteArea(area);
                          setOpenAreaId(null);
                        }}
                      >
                        <Trash2 size={13} />
                        Löschen
                      </button>
                    </div>
                  ) : null}

                  {trackers.map((tracker) => (
                    <div key={tracker.id}>
                      <div style={rowStyle(32)}>
                        <Zap size={14} />
                        <span>{tracker.name}</span>

                        <button
                          type="button"
                          style={iconButtonStyle}
                          aria-label={`${tracker.name} einstellen`}
                          aria-expanded={openTrackerId === tracker.id}
                          onClick={() =>
                            setOpenTrackerId(
                              openTrackerId === tracker.id
                                ? null
                                : tracker.id,
                            )
                          }
                        >
                          <Settings size={13} />
                        </button>
                      </div>

                      {openTrackerId === tracker.id ? (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            padding: '3px 0 8px 54px',
                          }}
                        >
                          <button
                            type="button"
                            style={actionButtonStyle}
                            onClick={() => {
                              onEditTracker(tracker);
                              setOpenTrackerId(null);
                            }}
                          >
                            <Pencil size={13} />
                            Bearbeiten
                          </button>

          <button
            type="button"
            style={actionButtonStyle}
            disabled={
              trackers.findIndex(
                (item) => item.id === tracker.id,
              ) === 0
            }
            onClick={() => onSortTracker(area, tracker, -1)}
          >
            ↑ Hoch
          </button>

          <button
            type="button"
            style={actionButtonStyle}
            disabled={
              trackers.findIndex(
                (item) => item.id === tracker.id,
              ) === trackers.length - 1
            }
            onClick={() => onSortTracker(area, tracker, 1)}
          >
            ↓ Runter
          </button>

                          <button
                            type="button"
                            style={actionButtonStyle}
                            onClick={() => onToggleTracker(tracker)}
                          >
                            {tracker.aktiv ? (
                              <EyeOff size={13} />
                            ) : (
                              <Eye size={13} />
                            )}
                            {tracker.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                          </button>

                          <button
                            type="button"
                            style={actionButtonStyle}
                            onClick={() => {
                              onDeleteTracker(tracker);
                              setOpenTrackerId(null);
                            }}
                          >
                            <Trash2 size={13} />
                            Löschen
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <button
                    type="button"
                    style={{
                      ...rowStyle(32),
                      border: 0,
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    onClick={() => onCreateTracker(area)}
                  >
                    + Tracker hinzufügen
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              style={{
                ...rowStyle(16),
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
              }}
              onClick={() => onCreateArea(category)}
            >
              + Bereich hinzufügen
            </button>
          </div>
        );
      })}

      <button
        type="button"
        style={{
          ...rowStyle(0),
          border: 0,
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
        }}
        onClick={onCreateCategory}
      >
        + Kategorie hinzufügen
      </button>
    </div>
  );
}
