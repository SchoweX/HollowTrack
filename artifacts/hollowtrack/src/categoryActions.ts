import type { Struktur } from './types';
import { clone, sorted } from './utils';

type SetStructure = (updater: (current: Struktur) => Struktur) => void;

export function createCategoryActions(setStructure: SetStructure) {
  const moveCategory = (id: string, direction: -1 | 1) => {
    setStructure((current) => {
      const next = clone(current);
      const ordered = sorted(next.kategorien);
      const index = ordered.findIndex((category) => category.id === id);
      const swapIndex = index + direction;

      if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
        return next;
      }

      const currentPosition = ordered[index].position;
      ordered[index].position = ordered[swapIndex].position;
      ordered[swapIndex].position = currentPosition;

      return next;
    });
  };

  return { moveCategory };
}
