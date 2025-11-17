import type { OneGridColumn } from '../../types/types';
// rowNumber용 가상 컬럼
export function injectRowNumberColumn(columns: OneGridColumn[], showRowNumber: boolean): OneGridColumn[] {
	if (!showRowNumber) return columns;

	const rowNumColumn: OneGridColumn = {
		field: '__rowNum__',
		headerName: 'No',
		width: 50,
		sortable: false,
		align: 'center',
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
export function getFlexCount(effectiveCols: OneGridColumn[]): number {
	return effectiveCols.filter(
		c => c.width == null && !c.hidden && c.field !== '__rowNum__' && c.field !== '__rowCheck__',
	).length;
}

// 각 셀에 적용할 스타일 계산
export function getCellStyle(
	col: OneGridColumn,
	colIdx: number,
	isLastCol: boolean,
	flexCount: number, // firstFlexIndex 대신 flexCount 사용
): React.CSSProperties {
	const base: React.CSSProperties = {
		padding: '0 8px',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		borderRight: isLastCol ? 'none' : `1px solid #333`,
		minWidth: 0,
	};

	// 행 번호 컬럼은 항상 고정 폭
	if (col.field === '__rowNum__') {
		const w = col.width ?? 50;
		return {
			...base,
			flex: '0 0 auto',
			width: w,
		};
	}

	// 체크박스 컬럼도 항상 고정 폭
	if (col.field === '__rowCheck__') {
		const w = col.width ?? 32;
		return {
			...base,
			flex: '0 0 auto',
			width: w,
		};
	}

	// width 지정된 컬럼은 고정 폭
	if (col.width != null) {
		return {
			...base,
			flex: '0 0 auto',
			width: col.width,
		};
	}

	// width 없는 컬럼들 → 전부 flex로 남는 폭 나눠먹기
	if (flexCount > 0) {
		return {
			...base,
			flex: '1 1 0', // basis 0으로 두면 균등 분배
		};
	}

	// fallback
	return {
		...base,
		flex: '0 1 auto',
	};
}
