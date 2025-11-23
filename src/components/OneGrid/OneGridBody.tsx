// src/components/OneGrid/OneGridBody.tsx
import React from 'react';
import type { CellCoord, OneGridColumn } from '../../types/types';
import CellEditor from './editor/CellEditor';
import { getCellStyle } from './layout/columnLayout';
import CellRenderer from './renderer/CellRenderer';

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
	scrollTop: number;
	clientHeight: number;

	// 트리 그리드용
	treeEnabled?: boolean;
	treeIndent?: number;
	onToggleTreeRow?: (row: any) => void;

	// 트리 드래그&드롭
	onTreeRowDrop?: (
		sourceRowKey: string | number,
		targetRowKey: string | number | null,
		mode: 'before' | 'after' | 'child',
	) => void;
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
	scrollTop,
	clientHeight,
	treeEnabled,
	treeIndent = 16,
	onToggleTreeRow,
	onTreeRowDrop,
}) => {
	const totalRows = displayRows.length;

	// ===== 가상 스크롤 범위 계산 =====
	const hasViewport = clientHeight > 0 && rowHeight > 0;
	const overscan = 5;

	let startIndex = 0;
	let endIndex = totalRows;

	if (hasViewport) {
		const firstVisible = Math.floor(scrollTop / rowHeight);
		const visibleCount = Math.ceil(clientHeight / rowHeight);

		startIndex = Math.max(0, firstVisible - overscan);
		endIndex = Math.min(totalRows, firstVisible + visibleCount + overscan);
	}

	const visibleRows = displayRows.slice(startIndex, endIndex);

	return (
		<div
			style={{
				backgroundColor: bodyBgA,
				position: 'relative',
			}}
			onDragOver={e => {
				if (!treeEnabled) return;
				// 루트로 드랍 가능하게 하려면 기본 동작 막기
				e.preventDefault();
			}}
			onDrop={e => {
				if (!treeEnabled || !onTreeRowDrop) return;
				// row에서 처리하지 않은 드롭만 이쪽으로 옴
				e.preventDefault();
				const srcKey = e.dataTransfer.getData('text/plain');
				if (!srcKey) return;
				onTreeRowDrop(srcKey, null, 'after'); // 루트 맨 아래로
			}}
		>
			<div
				style={{
					position: 'relative',
					height: totalRows * rowHeight,
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: startIndex * rowHeight,
						left: 0,
						right: 0,
					}}
				>
					{visibleRows.map((row, localIndex) => {
						const rowIndex = startIndex + localIndex;
						const rowKeyVal = getRowKey(row);
						const zebraBg = rowIndex % 2 === 0 ? bodyBgA : bodyBgB;

						return (
							<div
								key={rowKeyVal ?? `idx:${rowIndex}`}
								style={{
									display: 'flex',
									minWidth: 0,
									borderBottom: '1px solid var(--grid-border)',
									backgroundColor: zebraBg,
									height: rowHeight,
									lineHeight: `${rowHeight}px`,
								}}
								draggable={!!treeEnabled}
								onDragStart={e => {
									if (!treeEnabled || rowKeyVal == null) return;
									e.dataTransfer.effectAllowed = 'move';
									e.dataTransfer.setData('text/plain', String(rowKeyVal));
								}}
								onDragOver={e => {
									if (!treeEnabled) return;
									e.preventDefault();
								}}
								onDrop={e => {
									if (!treeEnabled || !onTreeRowDrop || rowKeyVal == null) return;
									e.preventDefault();
									e.stopPropagation(); // 루트 onDrop으로 안 올라가게

									const sourceKey = e.dataTransfer.getData('text/plain');
									if (!sourceKey || String(sourceKey) === String(rowKeyVal)) return;

									const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
									const y = e.clientY - rect.top;

									let mode: 'before' | 'after' | 'child';
									if (y < rect.height / 3) mode = 'before';
									else if (y > (rect.height * 2) / 3) mode = 'after';
									else mode = 'child';

									onTreeRowDrop(sourceKey, rowKeyVal, mode);
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

									const isActiveNow =
										activeCell && activeCell.rowKey === rowKeyVal && activeCell.colField === col.field;

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

									const isTreeCol = treeEnabled && col.isTreeColumn;

									let content: React.ReactNode;

									if (isEditingNow) {
										content = (
											<CellEditor
												column={renderCol}
												draft={draft}
												rowHeight={rowHeight}
												onChangeDraft={v => setDraft(v)}
												onCommit={onCommitEdit}
												onCancel={onCancelEdit}
												onTabNav={onTabNav}
											/>
										);
									} else if (isTreeCol) {
										const level: number = Number(row._treeLevel ?? 0);
										const hasChildren: boolean = !!row._treeHasChildren;
										const expanded: boolean = row._treeExpanded !== false;

										content = (
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													width: '100%',
												}}
											>
												<span
													style={{
														display: 'inline-block',
														width: level * treeIndent,
														flex: '0 0 auto',
													}}
												/>
												{hasChildren && (
													<span
														style={{
															width: 14,
															textAlign: 'center',
															cursor: 'pointer',
															userSelect: 'none',
															flex: '0 0 auto',
															fontSize: 10,
														}}
														onClick={e => {
															e.stopPropagation();
															onToggleTreeRow?.(row);
														}}
													>
														{expanded ? '▼' : '▶'}
													</span>
												)}
												<span
													style={{
														marginLeft: 2,
														marginRight: 4,
														flex: '0 0 auto',
														fontSize: 11,
													}}
												>
													{hasChildren ? (expanded ? '📂' : '📁') : '•'}
												</span>
												<div
													style={{
														flex: 1,
														minWidth: 0,
													}}
												>
													<CellRenderer
														column={renderCol}
														value={rawVal}
														row={row}
														rowIndex={rowIndex}
														colIndex={colIndex}
														rowHeight={rowHeight}
													/>
												</div>
											</div>
										);
									} else {
										content = (
											<CellRenderer
												column={renderCol}
												value={rawVal}
												row={row}
												rowIndex={rowIndex}
												colIndex={colIndex}
												rowHeight={rowHeight}
											/>
										);
									}

									return (
										<div
											key={col.field}
											style={{
												...cellStyle,
												borderRight: '1px solid var(--grid-border)',
												backgroundColor: isEditingNow
													? 'var(--grid-edit-bg)'
													: isSelected
													? 'var(--grid-selected-bg)'
													: zebraBg,
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
											{content}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default OneGridBody;
