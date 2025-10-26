import React, { useState, useRef, useEffect } from 'react';

export interface OneGridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  renderCell?: (value: any, rowData: any, rowIndex: number) => React.ReactNode;
}

export interface OneGridOptions {
  rowHeight?: number;
  editable?: boolean;
}

export interface OneGridProps {
  columns: OneGridColumn[];
  rows: any[];
  height?: number | string;
  options?: OneGridOptions;
  onRowsChange?: (nextRows: any[]) => void;
}

const headerBg = '#2a2a2a';
const bodyBgA = '#1e1e1e';
const bodyBgB = '#252525';
const border = '#444';

const OneGrid: React.FC<OneGridProps> = ({
  columns,
  rows,
  height = 300,
  options,
  onRowsChange
}) => {
  const rowHeight = options?.rowHeight ?? 32;
  const editableGrid = options?.editable ?? true;

  // 현재 선택된 셀
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);

  // 현재 편집 중인 셀
  const [editCell, setEditCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);

  // 에디터 값
  const [draft, setDraft] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // 편집 시작하면 input에 포커스
  useEffect(() => {
    if (editCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editCell]);

  // 어떤 컬럼이 "남은 가로폭 먹는 대상"인지 계산
  const flexTargetIndex = (() => {
    const flexibleIdxs = columns
      .map((c, i) => (c.width == null ? i : null))
      .filter((i): i is number => i !== null);
    return flexibleIdxs.length ? flexibleIdxs[flexibleIdxs.length - 1] : -1;
  })();

  function getCellStyle(col: OneGridColumn, colIdx: number, isLast: boolean): React.CSSProperties {
    const isFlexTarget = colIdx === flexTargetIndex;

    const base: React.CSSProperties = {
      padding: '0 8px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      borderRight: isLast ? 'none' : `1px solid #333`,
      minWidth: 0
    };

    if (col.width != null) {
      // 고정폭
      return {
        ...base,
        flex: '0 0 auto',
        width: col.width
      };
    }

    if (isFlexTarget) {
      // 마지막 유연 컬럼 -> 남은 가로 다 먹기
      return {
        ...base,
        flex: '1 1 auto'
      };
    }

    // 유연한데 마지막 flex 대상은 아님 -> 내용만큼
    return {
      ...base,
      flex: '0 0 auto'
    };
  }

  // 셀 클릭
  function handleCellClick(rowIdx: number, colIdx: number) {
    setActiveCell({ rowIdx, colIdx });
  }

  // 더블클릭 -> 편집 모드 진입
  function handleCellDoubleClick(rowIdx: number, colIdx: number) {
    if (!editableGrid) return;
    const col = columns[colIdx];
    if (col.editable === false) return;

    const currentVal = rows[rowIdx]?.[col.field] ?? '';
    setActiveCell({ rowIdx, colIdx });
    setEditCell({ rowIdx, colIdx });
    setDraft(String(currentVal));
  }

  // 키보드로 바로 입력하면 편집 시작
  function handleCellKeyDown(
    e: React.KeyboardEvent<HTMLDivElement>,
    rowIdx: number,
    colIdx: number
  ) {
    if (!editableGrid) return;
    const col = columns[colIdx];
    if (col.editable === false) return;

    // 이미 편집 중이면 여기서 처리 안 함
    if (editCell && editCell.rowIdx === rowIdx && editCell.colIdx === colIdx) {
      return;
    }

    // 일반 문자 키나 Enter로 편집 시작
    if (e.key.length === 1 || e.key === 'Enter') {
      const currentVal = rows[rowIdx]?.[col.field] ?? '';
      const nextDraft = e.key.length === 1 ? e.key : String(currentVal);

      setActiveCell({ rowIdx, colIdx });
      setEditCell({ rowIdx, colIdx });
      setDraft(nextDraft);
    }
  }

  // 편집 input에서 키 처리 (엔터로 확정, ESC로 취소)
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!editCell) return;
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  function commitEdit() {
    if (!editCell) return;
    const { rowIdx, colIdx } = editCell;
    const col = columns[colIdx];
    const field = col.field;

    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], [field]: draft };

    // 외부에 전달할 수 있으면 전달
    onRowsChange?.(updated);

    setEditCell(null);
  }

  function cancelEdit() {
    setEditCell(null);
  }

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
        borderRadius: 4
      }}
    >
      {/* header */}
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
          zIndex: 2
        }}
      >
        {columns.map((col, colIdx) => {
          const isLast = colIdx === columns.length - 1;
          const cellStyle = getCellStyle(col, colIdx, isLast);

          return (
            <div
              key={col.field}
              style={{
                ...cellStyle,
                borderRight: isLast ? 'none' : `1px solid ${border}`,
                backgroundColor: headerBg,
                fontWeight: 600
              }}
              title={col.headerName}
            >
              {col.headerName}
            </div>
          );
        })}
      </div>

      {/* body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto'
        }}
      >
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'flex',
              borderBottom: '1px solid #333',
              backgroundColor: rowIdx % 2 === 0 ? bodyBgA : bodyBgB,
              height: rowHeight,
              lineHeight: `${rowHeight}px`
            }}
          >
            {columns.map((col, colIdx) => {
              const isLast = colIdx === columns.length - 1;

              const isEditing =
                editCell &&
                editCell.rowIdx === rowIdx &&
                editCell.colIdx === colIdx;

              const isActive =
                activeCell &&
                activeCell.rowIdx === rowIdx &&
                activeCell.colIdx === colIdx;

              const cellStyle = getCellStyle(col, colIdx, isLast);

              const rawVal = row[col.field];
              const displayNode = col.renderCell
                ? col.renderCell(rawVal, row, rowIdx)
                : String(rawVal ?? '');

              return (
                <div
                  key={col.field}
                  style={{
                    ...cellStyle,
                    borderRight: isLast ? 'none' : '1px solid #333',
                    backgroundColor: isActive
                      ? '#3a3a3a'
                      : rowIdx % 2 === 0
                      ? bodyBgA
                      : bodyBgB,
                    outline: isActive
                      ? '1px solid #888'
                      : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
                  onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                  tabIndex={0}
                >
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={commitEdit}
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
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                        lineHeight: `${rowHeight}px`,
                        color: '#fff'
                      }}
                    >
                      {displayNode}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OneGrid;
