import { FolderOpen, Settings, Zap } from 'lucide-react';
import { categoryIcon } from '../categoryIcons';
import type { Bereich, Kategorie, Struktur, Tracker } from '../types';

type TodaySettingsTreeProps = {
  structure: Struktur;
  onEditCategory: (category: Kategorie) => void;
  onEditArea: (area: Bereich) => void;
  onEditTracker: (tracker: Tracker) => void;
  onCreateCategory: () => void;
  onCreateArea: (category: Kategorie) => void;
  onCreateTracker: (area: Bereich) => void;
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

const buttonStyle = {
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

export function TodaySettingsTree({
  structure,
  onEditCategory,
  onEditArea,
  onEditTracker,
  onCreateCategory,
  onCreateArea,
  onCreateTracker,
}: TodaySettingsTreeProps) {
  return (
    <div>
      {byPosition(structure.kategorien).map((category) => {
        const CategoryIcon = categoryIcon(category.icon);

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
                style={buttonStyle}
                aria-label={`${category.name} einstellen`}
                onClick={() => onEditCategory(category)}
              >
                <Settings size={15} />
              </button>
            </div>

            {areas.map((area) => {
              const trackerIds = new Set(
                area.ansichtIds.flatMap((viewId) => {
                  const view = structure.ansichten.find(
                    (item) => item.id === viewId,
                  );
                  return view?.trackerIds ?? [];
                }),
              );

              const trackers = structure.tracker.filter((tracker) =>
                trackerIds.has(tracker.id),
              );

              return (
                <div key={area.id}>
                  <div style={rowStyle(16)}>
                    <FolderOpen size={15} />
                    <span>{area.name}</span>
                    <button
                      type="button"
                      style={buttonStyle}
                      aria-label={`${area.name} einstellen`}
                      onClick={() => onEditArea(area)}
                    >
                      <Settings size={14} />
                    </button>
                  </div>

                  {trackers.map((tracker) => (
                    <div key={tracker.id} style={rowStyle(32)}>
                      <Zap size={14} />
                      <span>{tracker.name}</span>
                      <button
                        type="button"
                        style={buttonStyle}
                        aria-label={`${tracker.name} einstellen`}
                        onClick={() => onEditTracker(tracker)}
                      >
                        <Settings size={13} />
                      </button>
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
