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
	renderCell?: (params: OneGridRenderParams) => React.ReactNode;
	editor?: OneGridEditorConfig;
	align?: 'left' | 'center' | 'right';
	filterable?: boolean;
	filterOptions?: { value: any; label: string }[];
	children?: OneGridColumn[];

	/** 트리 그리드용 옵션 */
	isTreeColumn?: boolean; // 이 컬럼을 트리 표현 컬럼으로 사용 (indent + expand icon)
	treeIndent?: number; // level 당 들여쓰기(px), 기본 16
}

export interface OneGridOptions {
	rowHeight?: number;
	editable?: boolean;
	showRowNumber?: boolean;
	headerAlign?: 'left' | 'center' | 'right';
	scroll?: {
		x?: 'auto' | 'hidden' | 'scroll';
		y?: 'auto' | 'hidden' | 'scroll';
	};
	enableColumnReorder?: boolean;
	enableColumnResize?: boolean;
	enableHeaderFilter?: boolean;
	showCheckBox?: boolean;
	pagination?: OneGridPaginationOptions;
}

export interface OneGridProps {
	columns: OneGridColumn[];
	rows: any[];
	//rowKeyField?: string;
	height?: number | string;
	width?: number | string;
	options?: OneGridOptions;
	onRowsChange?: (nextRows: any[]) => void;

	// 서버/클라이언트 공통 페이징 정보
	/** 전체 건수 (server 모드일 때 서버 total, 없으면 rows.length 사용) */
	totalCount?: number;
	/** 현재 페이지 (default = 1). 안 넘기면 내부에서 관리 */
	currentPage?: number;
	/** 페이지당 행 수. 안 넘기면 내부에서 관리 */
	pageSize?: number;
	onPageChange?: (page: number, pageSize: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
}

export interface OneGridHandle {
	setRows: (next: any[]) => void;
	getRows: () => any[];
	getActiveCell: () => { rowKey: string | number; colField: string } | null;
	startEditAt: (rowKey: string | number, colField: string) => void;

	// 행 추가/삭제 + 선택삭제
	addRow: (
		position?: 'first' | 'last' | 'index',
		options?: {
			index?: number; // position === 'index' 일 때 기준 display index
			row?: any; // 기본값 {} 사용하고 싶으면 생략
		},
	) => void;
	removeRow: (
		position?: 'first' | 'last' | 'index',
		options?: {
			index?: number; // position === 'index' 일 때 기준 display index
		},
	) => void;
	removeSelectedRows: () => void; // 셀선택/체크박스 기준 삭제
	resetGrid: (rows?: any[]) => void; // 전체 리셋(없으면 빈 배열, 있으면 그 데이터로)

	// 상태 조회
	getChangedRows: () => any[];
	getInsertedRows: () => any[];
	getUpdatedRows: () => any[];
	getDeletedRows: () => any[];

	// 선택 관련 조회
	getCheckedRows: () => any[];
	getSelectedRows: () => any[];
	getFocusedRows: () => any[];

	// 페이징 정보
	getPageInfo: () => {
		currentPage: number;
		pageSize: number;
		totalCount: number;
		pageCount: number;
	};

	// 페이지 이동 (버튼, 외부 제어용)
	gotoPage: (page: number) => void;
}

/** 내부에서 쓰는 셀 좌표 */
export type CellCoord = {
	rowKey: string | number;
	colField: string;
	rowIndex: number;
	colIndex: number;
};

//페이징 옵션
export interface OneGridPaginationOptions {
	/** 페이징 모드
	 *  - 'none'  : 기존처럼 전체 스크롤
	 *  - 'page'  : 아래 버튼 페이징
	 *  - 'scroll': 스크롤 페이징 (무한 스크롤 느낌)
	 */
	mode?: 'none' | 'page' | 'scroll';

	/** 페이징 타입
	 *  - 'client' : rows 전체를 받아서 그리드 내부에서 잘라서 사용 (프론트 페이징)
	 *  - 'server' : 서버에서 이미 잘라서 내려주는 모드 (totalCount, currentPage 등은 서버 기준)
	 */
	type?: 'client' | 'server';

	/** 기본 페이지 사이즈 (client 모드일 때 초기값) */
	defaultPageSize?: number;

	/** 페이지 사이즈 선택 옵션 */
	pageSizeOptions?: number[];
}
