/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CellCoord, OneGridColumn } from '../types/types';

export function buildRectSelection(
	anchorCell: CellCoord,
	rowIndex: number,
	colIndex: number,
	displayRows: any[],
	effectiveColumns: OneGridColumn[],
	getRowKey: (r: any) => string | number | undefined,
) {
	const { rowIndex: ar, colIndex: ac } = anchorCell;
	const rStart = Math.min(ar, rowIndex);
	const rEnd = Math.max(ar, rowIndex);
	const cStart = Math.min(ac, colIndex);
	const cEnd = Math.max(ac, colIndex);

	const nextSel = new Set<string>();
	for (let r = rStart; r <= rEnd; r++) {
		const rRow = displayRows[r];
		const rk = getRowKey(rRow);
		for (let c = cStart; c <= cEnd; c++) {
			const cCol = effectiveColumns[c];
			if (!cCol) continue;
			nextSel.add(`${rk}::${cCol.field}`);
		}
	}

	return {
		selectedCells: nextSel,
		rect: { rStart, rEnd, cStart, cEnd },
	};
}
