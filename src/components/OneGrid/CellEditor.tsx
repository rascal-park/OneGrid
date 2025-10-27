/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect } from 'react';
import type { OneGridColumn } from './types';

interface CellEditorProps {
  column: OneGridColumn;
  draft: string;
  rowHeight: number;
  onChangeDraft: (next: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onTabNav: (shift: boolean) => void;
}

const CellEditor: React.FC<CellEditorProps> = ({
  column,
  draft,
  rowHeight,
  onChangeDraft,
  onCommit,
  onCancel,
  onTabNav,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  if (!column.editor || column.field === '__rowNum__') {
    return null;
  }

  // 커스텀 에디터 훅: 나중에 발전시키자
  if (
    column.editor.type === 'custom' &&
    column.editor.renderCustomEditor
  ) {
    // 여기선 단순화: 지금은 text/number만 우선 지원.
    // custom은 이후 확장.
  }

  const inputType =
    column.editor.type === 'number' ? 'number' : 'text';

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onCommit();
    } else if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onCommit();
      onTabNav(e.shiftKey);
    }
  }

  return (
    <input
      ref={inputRef}
      type={inputType}
      value={draft}
      onChange={(e) => onChangeDraft(e.target.value)}
      onBlur={onCommit}
      onKeyDown={handleKeyDown}
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
};

export default CellEditor;
