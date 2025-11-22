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
}) => {
	const totalRows = displayRows.length;

	// ===== 가상 스크롤 범위 계산 =====
	const hasViewport = clientHeight > 0 && rowHeight > 0;
	const overscan = 5; // 위/아래로 여분으로 그릴 행 수

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
		>
			{/* 전체 높이는 전체 행 수 기준으로 유지 */}
			<div
				style={{
					position: 'relative',
					height: totalRows * rowHeight,
				}}
			>
				{/* 실제 렌더링되는 행들의 컨테이너: startIndex만큼 아래로 밀어서 그리기 */}
				<div
					style={{
						position: 'absolute',
						top: startIndex * rowHeight,
						left: 0,
						right: 0,
					}}
				>
					{visibleRows.map((row, localIndex) => {
						// 실제 인덱스 (displayRows 기준)
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

									// 체크박스 컬럼은 내부에서 렌더러 주입
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
												{/* 들여쓰기 */}
												<span
													style={{
														display: 'inline-block',
														width: level * treeIndent,
														flex: '0 0 auto',
													}}
												/>
												{/* 토글 아이콘 */}
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
												{/* 폴더/leaf 아이콘 */}
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
												{/* 실제 내용 */}
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
