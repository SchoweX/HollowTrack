import { useState } from 'react';
import { Check, CircleOff, Pencil, Trash2 } from 'lucide-react';

import { categoryIcon } from '../categoryIcons';

type AdminItemProps = {
  item: any;
  structure: any;
  toggleStatus: (type: any, id: string) => void;
  openEditTracker: (tracker: any) => void;
  openEditStructureItem: (item: any) => void;
  openRename: (type: any, id: string, name: string) => void;
  setDeleteTarget: (target: any) => void;
  cycleCategoryIcon: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  openMoveArea: (id: string) => void;
};

export function AdminItem({
  item,
  structure,
  toggleStatus,
  openEditTracker,
  openEditStructureItem,
  openRename,
  setDeleteTarget,
  cycleCategoryIcon,
  moveCategory,
  openMoveArea,
}: AdminItemProps) {
  const [open, setOpen] = useState(false);

  const CategoryIcon =
    item.type === 'kategorie'
      ? categoryIcon(
          structure.kategorien.find(
            (category: any) => category.id === item.id,
          )?.icon || 'FolderOpen',
        )
      : null;

  return (
    <article
      className={`verwaltungseintrag verwaltungseintrag--${item.type} ${item.className} ${
        item.active ? '' : 'element--deaktiviert'
      }`}
    >
      <div
        className="verwaltungseintrag__kopf"
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <h3 className="verwaltungseintrag__titel">
            {CategoryIcon ? <CategoryIcon size={16} /> : null}
            {item.name}
          </h3>
          <span className="verwaltungseintrag__typ">
            {item.active ? item.label : `${item.label} · deaktiviert`}
          </span>
        </div>
      </div>

      {open ? (
        <div className="verwaltungseintrag__aktionen">
          <button
            className="aktions-button"
            type="button"
            onClick={() => toggleStatus(item.type, item.id)}
          >
            {item.active ? <CircleOff size={14} /> : <Check size={14} />}
            {item.active ? 'Deaktivieren' : 'Aktivieren'}
          </button>

          {item.type === 'kategorie' ? (
            <>
              <button
                className="aktions-button"
                type="button"
                onClick={() => cycleCategoryIcon(item.id)}
              >
                Icon wechseln
              </button>
              <button
                className="aktions-button"
                type="button"
                onClick={() => moveCategory(item.id, -1)}
              >
                Nach oben
              </button>
              <button
                className="aktions-button"
                type="button"
                onClick={() => moveCategory(item.id, 1)}
              >
                Nach unten
              </button>
            </>
          ) : null}

          {item.type === 'bereich' ? (
            <button
              className="aktions-button"
              type="button"
              onClick={() => openMoveArea(item.id)}
            >
              Verschieben
            </button>
          ) : null}

        <button
          className="aktions-button"
          type="button"
          onClick={() => openEditStructureItem(item)}
        >
          <Pencil size={14} />
          Bearbeiten
        </button>

          <button
            className="aktions-button aktions-button--loeschen"
            type="button"
            onClick={() =>
              setDeleteTarget({
                type: item.type,
                id: item.id,
                name: item.name,
              })
            }
          >
            <Trash2 size={14} />
            Löschen
          </button>
        </div>
      ) : null}
    </article>
  );
}
