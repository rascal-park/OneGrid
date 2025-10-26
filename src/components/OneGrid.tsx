import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';

/** 에디터 관련 타입들 */
export type OneGridEditorType = 'text' | 'number' | 'custom';

export interface EditorParams {
  value: any;
  row: any;
  rowIndex: number;
  colIndex: number;
  column: OneGridColumn;
  onChange: (nextValue: any) => void;
  onCommit: () => void;
  onCancel: () => void;
}

/** column 정의 */
export interface OneGridColumn {
  field: string;
  headerName: string;
  width?: number;

  renderCell?: (params: {
    value: any;
    row: any;
    rowIndex: number;
    colIndex: number;
    column: OneGridColumn;
  }) => React.ReactNode;

  editor?: {
    type: OneGridEditorType;
    renderCustomEditor?: (params: EditorParams) => React.ReactNode;
  };
}

export interface OneGridOptions {
  rowHeight?: number;
  editable?: boolean;
}

export interface OneGridProps {
  columns: OneGridColumn[];
  rows: any[];
  rowKeyField?: string; // 기본값 'id'
  height?: number | string;
  options?: OneGridOptions;
  onRowsChange?: (nextRows: any[]) => void;
}

/** 외부에서 ref.current로 부를 수 있는 메서드들 */
export interface OneGridHandle {
  setRows: (next: any[]) => void;
  getRows: () => any[];
  getActiveCell: () =>
    | { rowKey: string | number; colField: string }
    | null;
  startEditAt: (rowKey: string | number, colField: string) => void;
}

// style constants
const headerBg = '#2a2a2a';
const bodyBgA = '#1e1e1e';
const bodyBgB = '#252525';
const border = '#444';

const OneGrid = forwardRef<OneGridHandle, OneGridProps>(
  (
    {
      columns,
      rows,
      rowKeyField = 'id',
      height = 300,
      options,
      onRowsChange,
    },
    ref
  ) => {
    const rowHeight = options?.rowHeight ?? 32;
    const editableGrid = options?.editable ?? true;

    // 내부 상태: rows를 외부 onRowsChange 없이도 편집 가능하게 하려면
    // 로컬 state로도 들고 있어야 함 (controlled/ uncontrolled 둘 다 지원하려면)
    const [internalRows, setInternalRows] = useState(rows);

    // rows prop이 바뀌면 내부도 동기화해주자 (간단 동기화)
    useEffect(() => {
      setInternalRows(rows);
    }, [rows]);

    // 현재 활성 셀/편집 셀
    type CellCoord = {
      rowKey: string | number;
      colField: string;
      rowIndex: number;
      colIndex: number;
    };

    const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
    const [editCell, setEditCell] = useState<CellCoord | null>(null);

    // draft 값
    const [draft, setDraft] = useState<string>('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // 편집 시작 시 input focus
    useEffect(() => {
      if (editCell && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [editCell]);

    // 남은 폭 차지할 flex target
    const flexTargetIndex = (() => {
      const flexibleIdxs = columns
        .map((c, i) => (c.width == null ? i : null))
        .filter((i): i is number => i !== null);
      return flexibleIdxs.length
        ? flexibleIdxs[flexibleIdxs.length - 1]
        : -1;
    })();

    function getCellStyle(
      col: OneGridColumn,
      colIdx: number,
      isLastCol: boolean
    ): React.CSSProperties {
      const isFlexTarget = colIdx === flexTargetIndex;
      const base: React.CSSProperties = {
        padding: '0 8px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        borderRight: isLastCol ? 'none' : `1px solid #333`,
        minWidth: 0,
      };

      if (col.width != null) {
        return {
          ...base,
          flex: '0 0 auto',
          width: col.width,
        };
      }

      if (isFlexTarget) {
        return {
          ...base,
          flex: '1 1 auto',
        };
      }

      return {
        ...base,
        flex: '0 0 auto',
      };
    }

    // 셀 클릭 (active만 변경)
    function handleCellClick(rowIndex: number, colIndex: number) {
      const row = internalRows[rowIndex];
      const col = columns[colIndex];
      const rowKey = row?.[rowKeyField];
      if (rowKey === undefined) return;

      setActiveCell({
        rowKey,
        colField: col.field,
        rowIndex,
        colIndex,
      });
    }

    // 더블클릭 => 에디터 활성화
    function handleCellDoubleClick(rowIndex: number, colIndex: number) {
      if (!editableGrid) return;

      const row = internalRows[rowIndex];
      const col = columns[colIndex];
      const rowKey = row?.[rowKeyField];
      if (rowKey === undefined) return;

      // 이 컬럼이 편집 가능하지 않으면 스킵 (editor 없는 경우)
      if (!col.editor) return;

      const currentVal = row?.[col.field] ?? '';
      setActiveCell({
        rowKey,
        colField: col.field,
        rowIndex,
        colIndex,
      });
      setEditCell({
        rowKey,
        colField: col.field,
        rowIndex,
        colIndex,
      });
      setDraft(String(currentVal));
    }

    // 키 입력으로 편집 시작 (문자나 Enter)
    function handleCellKeyDown(
      e: React.KeyboardEvent<HTMLDivElement>,
      rowIndex: number,
      colIndex: number
    ) {
      if (!editableGrid) return;

      const row = internalRows[rowIndex];
      const col = columns[colIndex];
      const rowKey = row?.[rowKeyField];
      if (rowKey === undefined) return;

      if (!col.editor) return;

      // 이미 편집 중이면 여기서 건들 필요 없음
      if (
        editCell &&
        editCell.rowKey === rowKey &&
        editCell.colField === col.field
      ) {
        return;
      }

      if (e.key.length === 1 || e.key === 'Enter') {
        const currentVal = row?.[col.field] ?? '';
        const nextDraft =
          e.key.length === 1 ? e.key : String(currentVal);

        setActiveCell({
          rowKey,
          colField: col.field,
          rowIndex,
          colIndex,
        });
        setEditCell({
          rowKey,
          colField: col.field,
          rowIndex,
          colIndex,
        });
        setDraft(nextDraft);
      }
    }

    function commitEdit() {
      if (!editCell) return;
      const { rowKey, colField, rowIndex } = editCell;

      const updated = [...internalRows];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [colField]: draft,
      };

      setInternalRows(updated);
      onRowsChange?.(updated);

      // 편집 종료
      setEditCell(null);
    }

    function cancelEdit() {
      setEditCell(null);
    }

    function handleInputKeyDown(
      e: React.KeyboardEvent<HTMLInputElement>
    ) {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    }

    /** 에디터 렌더링 (셀 안) */
    function renderEditor(
      col: OneGridColumn,
      cellDraft: string,
      onChange: (v: string) => void,
      onCommit: () => void,
      onCancel: () => void
    ) {
      if (!col.editor) return null;

      if (col.editor.type === 'text') {
        return (
          <input
            ref={inputRef}
            value={cellDraft}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={handleInputKeyDown}
            style={{
              width: '100%',
              height: rowHeight - 6,
              lineHeight: `${rowHeight - 6}px`,
              fontSize: 12,
              backgroundColor: '#000',
              color: '#fff',
              border: '1px solid #888',
              borderRadius: 3,
              padding: '0 6px',
              outline: 'none',
            }}
          />
        );
      }

      if (col.editor.type === 'number') {
        return (
          <input
            ref={inputRef}
            type="number"
            value={cellDraft}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={handleInputKeyDown}
            style={{
              width: '100%',
              height: rowHeight - 6,
              lineHeight: `${rowHeight - 6}px`,
              fontSize: 12,
              backgroundColor: '#000',
              color: '#fff',
              border: '1px solid #888',
              borderRadius: 3,
              padding: '0 6px',
              outline: 'none',
            }}
          />
        );
      }

      if (col.editor.type === 'custom' && col.editor.renderCustomEditor) {
        // 고급 커스텀 에디터 (셀렉트 드롭다운 등)
        return col.editor.renderCustomEditor({
          value: cellDraft,
          row: internalRows[editCell!.rowIndex],
          rowIndex: editCell!.rowIndex,
          colIndex: editCell!.colIndex,
          column: col,
          onChange: (v) => setDraft(String(v)),
          onCommit: commitEdit,
          onCancel: cancelEdit,
        });
      }

      return null;
    }

    /** ref API: 부모에서 gridRef.current로 제어 */
    useImperativeHandle(ref, () => ({
      setRows(next) {
        setInternalRows(next);
        onRowsChange?.(next);
      },
      getRows() {
        return internalRows;
      },
      getActiveCell() {
        if (!activeCell) return null;
        return {
          rowKey: activeCell.rowKey,
          colField: activeCell.colField,
        };
      },
      startEditAt(rowKey, colField) {
        if (!editableGrid) return;
        // rowKey/colField로 rowIndex/colIndex 찾아서 editCell 세팅
        const rowIndex = internalRows.findIndex(
          (r) => r?.[rowKeyField] === rowKey
        );
        const colIndex = columns.findIndex(
          (c) => c.field === colField
        );
        if (rowIndex < 0 || colIndex < 0) return;
        const col = columns[colIndex];
        if (!col.editor) return;
        const currentVal = internalRows[rowIndex]?.[col.field] ?? '';

        setActiveCell({
          rowKey,
          colField,
          rowIndex,
          colIndex,
        });
        setEditCell({
          rowKey,
          colField,
          rowIndex,
          colIndex,
        });
        setDraft(String(currentVal));
      },
    }));

    // ====================
    // 렌더
    // ====================
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${border}`,
          backgroundColor: bodyBgA,
          color: '#fff',
          fontSize: 12,
          height,
          overflow: 'hidden',
          borderRadius: 4,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            backgroundColor: headerBg,
            borderBottom: `1px solid ${border}`,
            height: rowHeight,
            lineHeight: `${rowHeight}px`,
            fontWeight: 600,
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          {columns.map((col, colIdx) => {
            const isLastCol = colIdx === columns.length - 1;
            const cellStyle = getCellStyle(col, colIdx, isLastCol);

            return (
              <div
                key={col.field}
                style={{
                  ...cellStyle,
                  borderRight: isLastCol
                    ? 'none'
                    : `1px solid ${border}`,
                  backgroundColor: headerBg,
                  fontWeight: 600,
                }}
              >
                {col.headerName}
              </div>
            );
          })}
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
          }}
        >
          {internalRows.map((row, rowIndex) => {
            const rowKey = row?.[rowKeyField];
            const zebraBg = rowIndex % 2 === 0 ? bodyBgA : bodyBgB;

            return (
              <div
                key={rowKey ?? rowIndex}
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #333',
                  backgroundColor: zebraBg,
                  height: rowHeight,
                  lineHeight: `${rowHeight}px`,
                }}
              >
                {columns.map((col, colIndex) => {
                  const isLastCol =
                    colIndex === columns.length - 1;

                  const cellStyle = getCellStyle(
                    col,
                    colIndex,
                    isLastCol
                  );

                  const isActive =
                    activeCell &&
                    activeCell.rowKey === rowKey &&
                    activeCell.colField === col.field;

                  const isEditing =
                    editCell &&
                    editCell.rowKey === rowKey &&
                    editCell.colField === col.field;

                  const rawVal = row[col.field];
                  const displayNode = col.renderCell
                    ? col.renderCell({
                        value: rawVal,
                        row,
                        rowIndex,
                        colIndex,
                        column: col,
                      })
                    : String(rawVal ?? '');

                  return (
                    <div
                      key={col.field}
                      style={{
                        ...cellStyle,
                        borderRight: isLastCol
                          ? 'none'
                          : '1px solid #333',
                        backgroundColor: isActive
                          ? '#3a3a3a'
                          : zebraBg,
                        outline: isActive
                          ? '1px solid #888'
                          : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                      }}
                      onClick={() =>
                        handleCellClick(rowIndex, colIndex)
                      }
                      onDoubleClick={() =>
                        handleCellDoubleClick(rowIndex, colIndex)
                      }
                      onKeyDown={(e) =>
                        handleCellKeyDown(
                          e,
                          rowIndex,
                          colIndex
                        )
                      }
                      tabIndex={0}
                    >
                      {isEditing
                        ? renderEditor(
                            col,
                            draft,
                            (v) => setDraft(v),
                            commitEdit,
                            cancelEdit
                          )
                        : (
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: 12,
                              lineHeight: `${rowHeight}px`,
                              color: '#fff',
                            }}
                          >
                            {displayNode}
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default OneGrid;
