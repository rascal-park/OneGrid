/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OneGridColumn } from './types';

export function copySelectionToClipboard(
	selectionRect: {
		rStart: number;
		rEnd: number;
		cStart: number;
		cEnd: number;
	} | null,
	displayRows: any[],
	effectiveColumns: OneGridColumn[],
) {
	if (!selectionRect) return;

	const { rStart, rEnd, cStart, cEnd } = selectionRect;
	const lines: string[] = [];

	for (let r = rStart; r <= rEnd; r++) {
		const row = displayRows[r];
		const rowVals: string[] = [];
		for (let c = cStart; c <= cEnd; c++) {
			const col = effectiveColumns[c];
			const isRowNum = col.field === '__rowNum__';
			const cellVal = isRowNum ? String(r + 1) : row?.[col.field] ?? '';
			rowVals.push(String(cellVal));
		}
		lines.push(rowVals.join('\t'));
	}

	const tsv = lines.join('\n');
	navigator.clipboard.writeText(tsv).catch(() => {
		/* ignore clipboard errors */
	});
}

export async function pasteFromClipboard(
	activeCell: {
		rowIndex: number;
		colIndex: number;
		rowKey: string | number;
		colField: string;
	} | null,
	displayRows: any[],
	effectiveColumns: OneGridColumn[],
	internalRows: any[],
	getRowKey: (r: any) => string | number | undefined,
): Promise<any[] | null> {
	if (!activeCell) return null;

	try {
		const text = await navigator.clipboard.readText();
		if (!text) return null;

		const rowsToPaste = text
			.replace(/\r/g, '')
			.split('\n')
			.map(line => line.split('\t'));

		const updated = [...internalRows];

		const baseRow = activeCell.rowIndex;
		const baseCol = activeCell.colIndex;

		for (let rOff = 0; rOff < rowsToPaste.length; rOff++) {
			const destRowIndex = baseRow + rOff;
			if (destRowIndex >= displayRows.length) break;

			const targetRowKey = getRowKey(displayRows[destRowIndex]);
			const realRowIndex = internalRows.findIndex(rw => getRowKey(rw) === targetRowKey);
			if (realRowIndex < 0) continue;

			const rowCopy = { ...updated[realRowIndex] };
			const colsThisLine = rowsToPaste[rOff];

			for (let cOff = 0; cOff < colsThisLine.length; cOff++) {
				const destColIndex = baseCol + cOff;
				if (destColIndex >= effectiveColumns.length) break;

				const col = effectiveColumns[destColIndex];
				if (!col || col.field === '__rowNum__') continue;

				rowCopy[col.field] = colsThisLine[cOff];
			}

			updated[realRowIndex] = rowCopy;
		}

		return updated;
	} catch {
		return null;
	}
}
