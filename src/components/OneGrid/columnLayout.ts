import type { OneGridColumn } from '../../types/types';
// rowNumber용 가상 컬럼
export function injectRowNumberColumn(columns: OneGridColumn[], showRowNumber: boolean): OneGridColumn[] {
	if (!showRowNumber) return columns;

	const rowNumColumn: OneGridColumn = {
		field: '__rowNum__',
		headerName: '#',
		width: 50,
		sortable: false,
		hidden: false,
		formatter: {
			render: ({ rowIndex }) => rowIndex + 1,
		},
	};

	return [rowNumColumn, ...columns];
}

// hidden === true 인 컬럼 제외
export function filterHiddenColumns(cols: OneGridColumn[]): OneGridColumn[] {
	return cols.filter(c => !c.hidden);
}

// flex 계산을 위해 "width 없는 첫번째 컬럼" 인덱스 구하기
export function getFirstFlexIndex(effectiveCols: OneGridColumn[]): number {
	const idx = effectiveCols.findIndex(c => c.width == null && !c.hidden);
	return idx;
}

// 각 셀에 적용할 스타일 계산
export function getCellStyle(
	col: OneGridColumn,
	colIdx: number,
	isLastCol: boolean,
	firstFlexIndex: number,
): React.CSSProperties {
	const isFirstFlex = colIdx === firstFlexIndex;

	const base: React.CSSProperties = {
		padding: '0 8px',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		borderRight: isLastCol ? 'none' : `1px solid #333`,
		minWidth: 0,
	};

	if (col.field === '__rowNum__') {
		const w = col.width ?? 50;
		return {
			...base,
			flex: '0 0 auto',
			width: w,
		};
	}

	// 고정폭
	if (col.width != null) {
		return {
			...base,
			flex: '0 0 auto',
			width: col.width,
		};
	}

	// 첫 번째 flex 대상
	if (isFirstFlex) {
		return {
			...base,
			flex: '1 1 auto',
		};
	}

	// 나머지 auto 컬럼
	return {
		...base,
		flex: '0 1 auto',
	};
}
