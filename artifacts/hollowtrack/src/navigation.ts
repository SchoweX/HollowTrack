import type { PageId } from './types';

export const pageIds: PageId[] = [
  'heute',
  'tracker',
  'verlauf',
  'statistik',
  'sport',
  'ernaehrung',
  'einstellungen',
];

export function pageFromPath(path: string): PageId {
  const candidate = path.replace(/^\/+|\/+$/g, '');

  return pageIds.includes(candidate as PageId)
    ? (candidate as PageId)
    : 'heute';
}

export function pathForPage(page: PageId): string {
  return page === 'heute' ? '/' : `/${page}`;
}
