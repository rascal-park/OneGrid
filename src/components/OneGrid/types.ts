/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export type OneGridEditorType = 'text' | 'number' | 'custom';

export interface CellFormatter {
  hidden?: boolean; // 이 셀 자체를 안보이게 할 수도 있게 확장 가능 (보통은 column.hidden으로 처리함)
  render(params: FormatterParams): React.ReactNode;
}

export interface FormatterParams {
  value: any;
  row: any;
  rowIndex: number;
  colIndex: number;
  column: OneGridColumn;
}

// 에디터 설정
export interface CellEditorConfig {
  type: OneGridEditorType;
  renderCustomEditor?: (params: EditorParams) => React.ReactNode;
}

// Editor 렌더러에 전달되는 파라미터
export interface EditorParams {
  value: any;
  row: any;
  rowIndex: number;
  colIndex: number;
  column: OneGridColumn;
  onChange: (nextValue: any) => void;
  onCommit: () => void;
  onCancel: () => void;
  onTabNav: (shift: boolean) => void;
}

// 컬럼 정의
export interface OneGridColumn {
  field: string;
  headerName: string;
  width?: number;
  sortable?: boolean;
  hidden?: boolean; // 전체 컬럼 자체를 숨길지 여부

  // 실제 값 대신 화면에 어떻게 보여줄지
  // (색 뱃지, 포맷팅, 날짜 포맷 등)
  formatter?: CellFormatter;

  // 편집방법 정의
  editor?: CellEditorConfig;
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

// 외부에서 ref로 사용할 수 있는 핸들
export interface OneGridHandle {
  setRows: (next: any[]) => void;
  getRows: () => any[];
  getActiveCell: () =>
    | {
        rowKey: string | number;
        colField: string;
      }
    | null;
  startEditAt: (rowKey: string | number, colField: string) => void;
}

// 내부적으로 좌표 관리할 때 쓰는 셀 좌표
export interface CellCoord {
  rowKey: string | number;
  colField: string;
  rowIndex: number;
  colIndex: number;
}
