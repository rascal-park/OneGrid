/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export function nextSortState(
  prev: SortState | null,
  field: string
): SortState | null {
  if (!prev || prev.field !== field) {
    return { field, direction: 'asc' };
  }
  if (prev.direction === 'asc') {
    return { field, direction: 'desc' };
  }
  return null;
}

export function applySort(
  rows: any[],
  sortState: SortState | null
): any[] {
  if (!sortState) return rows;
  const { field, direction } = sortState;
  if (field === '__rowNum__') return rows;

  const sorted = [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return -1;
    if (bv == null) return 1;
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}
