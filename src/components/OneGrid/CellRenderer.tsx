/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { OneGridColumn } from './types';

interface CellRendererProps {
  column: OneGridColumn;
  value: any;
  row: any;
  rowIndex: number;
  colIndex: number;
  rowHeight: number;
}

const CellRenderer: React.FC<CellRendererProps> = ({
  column,
  value,
  row,
  rowIndex,
  colIndex,
  rowHeight,
}) => {
  if (column?.formatter?.hidden) {
    return null;
  }

  if (column.formatter) {
    return (
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
        {column.formatter.render({
          value,
          row,
          rowIndex,
          colIndex,
          column,
        })}
      </span>
    );
  }

  return (
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
      {String(value ?? '')}
    </span>
  );
};

export default CellRenderer;
