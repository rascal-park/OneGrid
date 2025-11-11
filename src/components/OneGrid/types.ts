import React from 'react';

/** 에디터 타입 */
export type OneGridEditorType =
	| 'text' // 텍스트 입력
	| 'number' // 숫자 입력 (step 가능)
	| 'date' // 달력
	| 'dropdown' // 싱글/멀티 드롭다운
	| 'combo' // 콤보박스 (입력 + 후보 목록)
	| 'custom'; // 사용자 지정 에디터

/** 렌더러 타입 */
export type OneGridRendererType =
	| 'text' // 텍스트 출력
	| 'image' // 이미지 출력 (값은 텍스트)
	| 'icon' // 아이콘 + 텍스트
	| 'checkbox' // 체크박스 (checkValue/unCheckValue)
	| 'button' // 버튼
	| 'dropdown' // 드롭다운 리스트 값 출력
	| 'custom'; // 사용자 지정 렌더러

export interface OneGridRenderParams {
	value: any;
	row: any;
	rowIndex: number;
	colIndex: number;
	column: OneGridColumn;
}

/** 렌더러 설정 */
export interface OneGridRendererConfig {
	type: OneGridRendererType;
	props?: Record<string, any>;
	renderCustom?: (params: OneGridRenderParams) => React.ReactNode;
}

/** 포매터 설정 (값 -> 표시용 값) */
export interface OneGridFormatterConfig {
	format?: (value: any, row: any, rowIndex: number, colIndex: number) => any;
	render?: (params: OneGridRenderParams & { formattedValue: any }) => React.ReactNode;
}

/** 에디터 설정 */
export interface OneGridEditorConfig {
	type: OneGridEditorType;

	// dropdown / combo 에서 사용할 옵션
	options?: { value: any; label: string }[];

	// dropdown 에디터가 멀티인지 여부 (true면 <select multiple>)
	multiple?: boolean;

	// 숫자 에디터용 옵션 (step/min/max)
	step?: number;
	min?: number;
	max?: number;

	// custom editor
	renderCustomEditor?: (params: {
		value: any;
		row: any;
		rowIndex: number;
		colIndex: number;
		column: OneGridColumn;
		onChange: (nextValue: any) => void;
		onCommit: () => void;
		onCancel: () => void;
	}) => React.ReactNode;
}

/** column 정의 */
export interface OneGridColumn {
	field: string;
	headerName: string;
	width?: number;
	sortable?: boolean;
	hidden?: boolean;

	renderer?: OneGridRendererConfig;
	formatter?: OneGridFormatterConfig;

	// (구버전 호환)
	renderCell?: (params: OneGridRenderParams) => React.ReactNode;

	editor?: OneGridEditorConfig;
}

export interface OneGridOptions {
	rowHeight?: number;
	editable?: boolean;
	showRowNumber?: boolean;
}

export interface OneGridProps {
	columns: OneGridColumn[];
	rows: any[];
	rowKeyField?: string;
	height?: number | string;
	options?: OneGridOptions;
	onRowsChange?: (nextRows: any[]) => void;
}

export interface OneGridHandle {
	setRows: (next: any[]) => void;
	getRows: () => any[];
	getActiveCell: () => { rowKey: string | number; colField: string } | null;
	startEditAt: (rowKey: string | number, colField: string) => void;
}

/** 내부에서 쓰는 셀 좌표 */
export type CellCoord = {
	rowKey: string | number;
	colField: string;
	rowIndex: number;
	colIndex: number;
};
