// src/components/OneGrid/OneGridBody.tsx
import React from 'react';
import type { CellCoord, OneGridColumn } from '../../types/types';
import CellEditor from './CellEditor';
import CellRenderer from './CellRenderer';
import { getCellStyle } from './columnLayout';

interface OneGridBodyProps {
	effectiveColumns: OneGridColumn[];
	displayRows: any[];
	rowHeight: number;
	flexCount: number;
	columnWidths: Record<string, number>;
	getRowKey: (row: any) => string | number | undefined;
	selectedCells: Set<string>;
	activeCell: CellCoord | null;
	editCell: CellCoord | null;
	draft: any;
	setDraft: (v: any) => void;
	checkedRowKeys: Set<string | number>;
	setCheckedRowKeys: React.Dispatch<React.SetStateAction<Set<string | number>>>;
	onCellClick: (e: React.MouseEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => void;
	onCellDoubleClick: (rowIndex: number, colIndex: number) => void;
	onCellKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => void;
	onCommitEdit: () => void;
	onCancelEdit: () => void;
	onTabNav: (shift: boolean) => void;
	bodyBgA: string;
	bodyBgB: string;
}

const OneGridBody: React.FC<OneGridBodyProps> = ({
	effectiveColumns,
	displayRows,
	rowHeight,
	flexCount,
	columnWidths,
	getRowKey,
	selectedCells,
	activeCell,
	editCell,
	draft,
	setDraft,
	checkedRowKeys,
	setCheckedRowKeys,
	onCellClick,
	onCellDoubleClick,
	onCellKeyDown,
	onCommitEdit,
	onCancelEdit,
	onTabNav,
	bodyBgA,
	bodyBgB,
}) => {
	return (
		<div>
			{displayRows.map((row, rowIndex) => {
				const rowKeyVal = getRowKey(row);
				const zebraBg = rowIndex % 2 === 0 ? bodyBgA : bodyBgB;

				return (
					<div
						key={rowKeyVal ?? rowIndex}
						style={{
							display: 'flex',
							minWidth: 0,
							borderBottom: '1px solid #333',
							backgroundColor: zebraBg,
							height: rowHeight,
							lineHeight: `${rowHeight}px`,
						}}
					>
						{effectiveColumns.map((col, colIndex) => {
							const isLastCol = colIndex === effectiveColumns.length - 1;
							let cellStyle = getCellStyle(col, isLastCol, flexCount);

							const overrideWidth = columnWidths[col.field];
							if (overrideWidth != null) {
								cellStyle = {
									...cellStyle,
									width: overrideWidth,
									minWidth: overrideWidth,
									flex: '0 0 auto',
								};
							}

							const coordKey = `${rowKeyVal}::${col.field}`;
							const isSelected = selectedCells.has(coordKey);

							const isActiveNow = activeCell && activeCell.rowKey === rowKeyVal && activeCell.colField === col.field;

							const isEditingNow = editCell && editCell.rowKey === rowKeyVal && editCell.colField === col.field;

							const rawVal: any =
								col.field === '__rowNum__'
									? rowIndex + 1
									: col.field === '__rowCheck__'
									? checkedRowKeys.has(rowKeyVal!)
									: row[col.field];

							let renderCol = col;

							if (col.field === '__rowCheck__') {
								renderCol = {
									...col,
									renderer: {
										type: 'checkbox',
										props: {
											checkValue: true,
											uncheckValue: false,
											onToggle: ({ row, nextValue }: any) => {
												const key = getRowKey(row);
												if (key === undefined) return;
												setCheckedRowKeys(prev => {
													const next = new Set(prev);
													if (nextValue) next.add(key);
													else next.delete(key);
													return next;
												});
											},
										},
									},
								};
							}

							return (
								<div
									key={col.field}
									style={{
										...cellStyle,
										borderRight: '1px solid #333',
										backgroundColor: isEditingNow ? '#3a3a3a' : isSelected ? '#4a4a4a' : zebraBg,
										outline: isActiveNow ? '1px solid #888' : '1px solid transparent',
										display: 'flex',
										alignItems: 'center',
										position: 'relative',
									}}
									onClick={e => onCellClick(e, rowIndex, colIndex)}
									onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
									onKeyDown={e => onCellKeyDown(e, rowIndex, colIndex)}
									tabIndex={0}
								>
									{isEditingNow ? (
										<CellEditor
											column={renderCol}
											draft={draft}
											rowHeight={rowHeight}
											onChangeDraft={v => setDraft(v)}
											onCommit={onCommitEdit}
											onCancel={onCancelEdit}
											onTabNav={onTabNav}
										/>
									) : (
										<CellRenderer
											column={renderCol}
											value={rawVal}
											row={row}
											rowIndex={rowIndex}
											colIndex={colIndex}
											rowHeight={rowHeight}
										/>
									)}
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

export default OneGridBody;
