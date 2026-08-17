import type { ElementTyp, Struktur } from './types';
import { clone } from './utils';
import { categoryIconMap } from './categoryIcons';

export function toggleStructureStatus(
  current: Struktur,
  type: ElementTyp,
  id: string,
): Struktur {
  const next = clone(current);

  const list =
    type === 'kategorie'
      ? next.kategorien
      : type === 'bereich'
        ? next.bereiche
        : next.tracker;

  const target = list.find((item) => item.id === id);

  if (target) {
    target.aktiv = !target.aktiv;
  }

  return next;
}

export function cycleStructureCategoryIcon(
  current: Struktur,
  id: string,
): Struktur {
  const next = clone(current);
  const icons = Object.keys(categoryIconMap);
  const target = next.kategorien.find((category) => category.id === id);

  if (target) {
    target.icon = icons[(icons.indexOf(target.icon) + 1) % icons.length];
  }

  return next;
}

export function deleteStructureElement(
  current: Struktur,
  type: ElementTyp,
  id: string,
): Struktur {
  const next = clone(current);

  if (type === 'kategorie') {
    const category = next.kategorien.find((item) => item.id === id);
    const areas = next.bereiche.filter((area) =>
      category?.bereichIds.includes(area.id),
    );
    const trackerIds = areas.flatMap((area) => area.trackerIds);

    next.kategorien = next.kategorien.filter((item) => item.id !== id);
    next.bereiche = next.bereiche.filter(
      (item) => !category?.bereichIds.includes(item.id),
    );
    next.tracker = next.tracker.filter(
      (item) => !trackerIds.includes(item.id),
    );
  } else if (type === 'bereich') {
    const area = next.bereiche.find((item) => item.id === id);

    next.kategorien.forEach((item) => {
      item.bereichIds = item.bereichIds.filter((areaId) => areaId !== id);
    });

    next.bereiche = next.bereiche.filter((item) => item.id !== id);
    next.tracker = next.tracker.filter(
      (item) => !area?.trackerIds.includes(item.id),
    );
  } else {
    next.bereiche.forEach((item) => {
      item.trackerIds = item.trackerIds.filter(
        (trackerId) => trackerId !== id,
      );
    });

    next.tracker = next.tracker.filter((item) => item.id !== id);
  }

  return next;
}
