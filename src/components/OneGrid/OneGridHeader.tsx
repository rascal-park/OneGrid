import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { OneGridColumn } from '../../types/types';
import type { SortState } from '../../types/utilsSort';
import { getCellStyle } from './columnLayout';

const border = '#444';

/** 그룹 헤더용 내부 타입 */
interface HeaderGroupCell {
	key: string;
	label: string;
	level: number; // 0 = 가장 위
	startLeafIndex: number; // effectiveColumns 기준 시작 인덱스
	leafSpan: number; // 포함하는 leaf 컬럼 개수
}

/**
 * 그룹 헤더 & leaf 가 그룹에 속하는지 여부 계산
 */
function buildGroupHeaderCells(
	groupColumns: OneGridColumn[] | undefined,
	effectiveColumns: OneGridColumn[],
): {
	levels: HeaderGroupCell[][];
	depth: number;
	/** 해당 leaf 컬럼이 어떤 그룹(부모) 아래에 있는지 여부 */
	leafGroupedMap: Map<string, boolean>;
} {
	if (!groupColumns) return { levels: [], depth: 1, leafGroupedMap: new Map() };

	const leafFields = effectiveColumns.map(c => c.field);
	const fieldIndexMap = new Map<string, number>();
	leafFields.forEach((f, idx) => fieldIndexMap.set(f, idx));

	const hasAnyChild = groupColumns.some(c => c.children && c.children.length > 0);
	if (!hasAnyChild) {
		return { levels: [], depth: 1, leafGroupedMap: new Map() };
	}

	let maxDepth = 1;
	const levelCells: HeaderGroupCell[][] = [];
	const leafGroupedMap = new Map<string, boolean>();

	function collectLeafIndices(node: OneGridColumn): number[] {
		if (!node.children || node.children.length === 0) {
			const idx = fieldIndexMap.get(node.field);
			return typeof idx === 'number' ? [idx] : [];
		}
		let result: number[] = [];
		for (const ch of node.children) {
			result = result.concat(collectLeafIndices(ch));
		}
		return result;
	}

	function dfs(nodes: OneGridColumn[], level: number, hasGroupParent: boolean) {
		if (!levelCells[level]) levelCells[level] = [];
		maxDepth = Math.max(maxDepth, level + 1);

		nodes.forEach((node, idx) => {
			const isGroup = !!(node.children && node.children.length > 0);

			if (isGroup) {
				const indices = collectLeafIndices(node).sort((a, b) => a - b);
				if (indices.length === 0) return;

				const startLeafIndex = indices[0];
				const endLeafIndex = indices[indices.length - 1];
				const span = endLeafIndex - startLeafIndex + 1;

				levelCells[level].push({
					key: `${node.field || node.headerName}-${level}-${idx}`,
					label: node.headerName,
					level,
					startLeafIndex,
					leafSpan: span,
				});

				dfs(node.children!, level + 1, true);
			} else {
				const leafIdx = fieldIndexMap.get(node.field);
				if (typeof leafIdx === 'number') {
					const prev = leafGroupedMap.get(node.field) ?? false;
					leafGroupedMap.set(node.field, prev || hasGroupParent);
				}
			}
		});
	}

	dfs(groupColumns, 0, false);

	const usedLevels = levelCells.filter(lv => lv && lv.length > 0);
	const depth = Math.max(usedLevels.length + 1, 1); // +1 = leaf 줄

	return { levels: usedLevels, depth, leafGroupedMap };
}

/** leaf 컬럼 별 width 기본값(리사이즈 핸들용) */
const DEFAULT_COL_WIDTH = 100;

interface OneGridHeaderProps {
	effectiveColumns: OneGridColumn[];
	groupColumns?: OneGridColumn[];

	rowHeight: number;
	headerAlign: 'left' | 'center' | 'right';
	headerJustify: 'flex-start' | 'center' | 'flex-end';
	sortState: SortState | null;
	onToggleSort: (field: string) => void;
	enableColumnReorder: boolean;
	enableColumnResize: boolean;
	enableHeaderFilter: boolean;
	internalRows: any[];
	columnFilters: Record<string, any>;
	setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
	checkedRowKeys: Set<string | number>;
	setCheckedRowKeys: React.Dispatch<React.SetStateAction<Set<string | number>>>;
	displayRows: any[];
	getRowKey: (r: any) => string | number | undefined;
	setColumnOrder: React.Dispatch<React.SetStateAction<string[] | null>>;
	columnWidths: Record<string, number>;
	setColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	flexCount: number;
	headerBg: string;
}

function getDistinctOptions(rows: any[], field: string): { value: any; label: string }[] {
	const map = new Map<any, string>();
	rows.forEach(r => {
		const v = r[field];
		if (v === undefined || v === null || v === '') return;
		if (!map.has(v)) {
			map.set(v, String(v));
		}
	});
	return Array.from(map.entries()).map(([value, label]) => ({
		value,
		label,
	}));
}

const OneGridHeader: React.FC<OneGridHeaderProps> = ({
	effectiveColumns,
	groupColumns,
	rowHeight,
	headerAlign,
	headerJustify,
	sortState,
	onToggleSort,
	enableColumnReorder,
	enableColumnResize,
	enableHeaderFilter,
	internalRows,
	columnFilters,
	setColumnFilters,
	checkedRowKeys,
	setCheckedRowKeys,
	displayRows,
	getRowKey,
	setColumnOrder,
	columnWidths,
	setColumnWidths,
	flexCount,
	headerBg,
}) => {
	const [dragColField, setDragColField] = useState<string | null>(null);
	const [resizing, setResizing] = useState<{
		field: string;
		startX: number;
		startWidth: number;
	} | null>(null);
	const [openFilterField, setOpenFilterField] = useState<string | null>(null);
	const [filterSearch, setFilterSearch] = useState<string>('');

	// 그룹 정보 + leaf 가 그룹에 속하는지 여부
	const {
		levels: groupLevels,
		depth: headerDepth,
		leafGroupedMap,
	} = useMemo(() => buildGroupHeaderCells(groupColumns, effectiveColumns), [groupColumns, effectiveColumns]);

	const headerRowHeight = rowHeight;

	// === leaf 실제 DOM 폭/left 측정 ===
	const headerRef = useRef<HTMLDivElement | null>(null);
	const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [leafMetrics, setLeafMetrics] = useState<{ left: number; width: number }[]>([]);

	useEffect(() => {
		function measure() {
			if (!headerRef.current) return;
			const headerRect = headerRef.current.getBoundingClientRect();
			const metrics = effectiveColumns.map((_, idx) => {
				const el = leafRefs.current[idx];
				if (!el) return { left: 0, width: 0 };
				const r = el.getBoundingClientRect();
				return {
					left: r.left - headerRect.left,
					width: r.width,
				};
			});
			setLeafMetrics(metrics);
		}

		measure();
		window.addEventListener('resize', measure);
		return () => {
			window.removeEventListener('resize', measure);
		};
	}, [effectiveColumns, columnWidths]);

	// === 리사이즈 드래그 ===
	useEffect(() => {
		if (!resizing) return;

		const { field, startX, startWidth } = resizing;

		function handleMouseMove(ev: MouseEvent) {
			const delta = ev.clientX - startX;
			const nextWidth = Math.max(40, startWidth + delta);

			setColumnWidths(prev => ({
				...prev,
				[field]: nextWidth,
			}));
		}

		function handleMouseUp() {
			setResizing(null);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [resizing, setColumnWidths]);

	// === 필터 옵션 ===
	const getBaseFilterOptions = (col: OneGridColumn) => {
		return (
			(col.filterOptions as { value: any; label: string }[] | undefined) ?? getDistinctOptions(internalRows, col.field)
		);
	};

	return (
		<div
			ref={headerRef}
			style={{
				position: 'sticky',
				top: 0,
				zIndex: 2,
				backgroundColor: headerBg,
				borderBottom: `1px solid ${border}`,
				height: headerRowHeight * headerDepth,
				minWidth: 0,
				overflow: 'hidden',
			}}
		>
			{/* === leaf 헤더 줄 (맨 아래 1줄) : flex 레이아웃 → 바디와 폭 100% 동일 === */}
			<div
				style={{
					position: 'absolute',
					top: headerRowHeight * (headerDepth - 1),
					left: 0,
					right: 0,
					height: headerRowHeight,
					display: 'flex',
					zIndex: 1,
				}}
			>
				{effectiveColumns.map((col, colIdx) => {
					const isLastCol = colIdx === effectiveColumns.length - 1;

					const isCheckCol = col.field === '__rowCheck__';
					const isRowNumCol = col.field === '__rowNum__';

					const isDraggable = enableColumnReorder && !isRowNumCol && !isCheckCol;
					const canResize = enableColumnResize && !isRowNumCol && !isCheckCol;

					const isGroupedLeaf = leafGroupedMap.get(col.field) ?? false;

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

					const isSorted = sortState?.field === col.field;

					const isFilterable = enableHeaderFilter && col.filterable && !isRowNumCol && !isCheckCol;
					const selectedValues: any[] = Array.isArray(columnFilters[col.field]) ? columnFilters[col.field] : [];

					const baseOptions = getBaseFilterOptions(col);

					const visibleOptions = baseOptions.filter(opt =>
						opt.label.toLowerCase().includes(filterSearch.toLowerCase()),
					);

					const allVisibleRowKeys = displayRows
						.map(r => getRowKey(r))
						.filter((k): k is string | number => k !== undefined);

					const allChecked = allVisibleRowKeys.length > 0 && allVisibleRowKeys.every(k => checkedRowKeys.has(k));

					return (
						<div
							key={col.field}
							ref={el => {
								leafRefs.current[colIdx] = el;
							}}
							draggable={isDraggable}
							onDragStart={e => {
								if (!isDraggable) return;
								setDragColField(col.field);
								e.dataTransfer?.setData('text/plain', col.field);
							}}
							onDragOver={e => {
								if (!isDraggable || !dragColField || isCheckCol || isRowNumCol) return;
								e.preventDefault();
							}}
							onDrop={() => {
								if (!isDraggable || !dragColField || dragColField === col.field) {
									setDragColField(null);
									return;
								}
								setColumnOrder(prev => {
									if (!prev) return prev;
									const from = prev.indexOf(dragColField);
									const to = prev.indexOf(col.field);
									if (from < 0 || to < 0) return prev;

									const next = [...prev];
									next.splice(from, 1);
									next.splice(to, 0, dragColField);
									return next;
								});
								setDragColField(null);
							}}
							style={{
								...cellStyle,
								borderRight: `1px solid ${border}`,
								backgroundColor: headerBg,
								fontWeight: 600,
								userSelect: 'none',
								display: 'flex',
								alignItems: 'center',
								position: 'relative',
								padding: '0 4px',
								boxSizing: 'border-box',
								overflow: 'visible',
							}}
						>
							{/* leaf 줄 자체에는 "그룹에 속한 컬럼"만 텍스트를 그린다.
							    그룹에 안 속한 컬럼(No, 지역 등)은 오버레이(rowSpan 셀)가 대신 그리기 때문에 여기서는 비워둠 */}
							{isCheckCol ? (
								<div
									style={{
										flex: 1,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<input
										type="checkbox"
										checked={allChecked}
										onChange={e => {
											const checked = e.target.checked;
											setCheckedRowKeys(prev => {
												const next = new Set(prev);
												if (checked) {
													allVisibleRowKeys.forEach(k => next.add(k));
												} else {
													allVisibleRowKeys.forEach(k => next.delete(k));
												}
												return next;
											});
										}}
										style={{ margin: 0 }}
									/>
								</div>
							) : isGroupedLeaf ? (
								<>
									{/* 그룹에 속한 leaf 컬럼만 하단 1줄에 텍스트 표시 */}
									<div
										style={{
											flex: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: headerJustify,
											textAlign: headerAlign,
											gap: 4,
											cursor: col.sortable ? 'pointer' : 'default',
											paddingRight: canResize ? 4 : 0,
											fontSize: 12,
										}}
										onClick={() => {
											if (!col.sortable) return;
											onToggleSort(col.field);
										}}
									>
										<span>{col.headerName}</span>
										{isSorted && (
											<span
												style={{
													fontSize: 10,
													color: '#aaa',
													lineHeight: 1,
												}}
											>
												{sortState?.direction === 'asc' ? '▲' : '▼'}
											</span>
										)}
									</div>

									{/* 필터 아이콘 */}
									{isFilterable && (
										<div
											onClick={e => {
												e.stopPropagation();
												setOpenFilterField(prev => (prev === col.field ? null : col.field));
												setFilterSearch('');
											}}
											style={{
												flex: '0 0 auto',
												width: 16,
												height: 16,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												marginLeft: 4,
												cursor: 'pointer',
												fontSize: 10,
												color: selectedValues.length > 0 ? '#4FC3F7' : '#bbb',
											}}
											title="필터"
										>
											▾
										</div>
									)}

									{/* 필터 팝업 */}
									{isFilterable && openFilterField === col.field && (
										<div
											style={{
												position: 'absolute',
												top: headerRowHeight,
												right: 0,
												minWidth: 180,
												maxWidth: 260,
												backgroundColor: '#1e1e1e',
												border: '1px solid #555',
												borderRadius: 4,
												boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
												padding: 8,
												zIndex: 999,
											}}
											onClick={e => e.stopPropagation()}
										>
											<input
												type="text"
												placeholder="검색"
												value={filterSearch}
												onChange={e => setFilterSearch(e.target.value)}
												style={{
													width: '100%',
													height: 24,
													fontSize: 11,
													padding: '0 6px',
													marginBottom: 6,
													backgroundColor: '#111',
													border: '1px solid #555',
													color: '#fff',
													borderRadius: 3,
													boxSizing: 'border-box',
												}}
											/>

											<div
												style={{
													maxHeight: 160,
													overflowY: 'auto',
													paddingRight: 4,
												}}
											>
												{visibleOptions.length === 0 && (
													<div
														style={{
															fontSize: 11,
															color: '#888',
															padding: '4px 0',
														}}
													>
														검색 결과 없음
													</div>
												)}
												{visibleOptions.map(opt => {
													const checked = selectedValues.includes(opt.value);
													return (
														<label
															key={String(opt.value)}
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: 4,
																fontSize: 11,
																color: '#eee',
																marginBottom: 2,
																cursor: 'pointer',
															}}
														>
															<input
																type="checkbox"
																checked={checked}
																onChange={e => {
																	const nextChecked = e.target.checked;
																	setColumnFilters(prev => {
																		const current: any[] = Array.isArray(prev[col.field]) ? prev[col.field] : [];
																		let next: any[];
																		if (nextChecked) {
																			next = [...current, opt.value];
																		} else {
																			next = current.filter(v => v !== opt.value);
																		}
																		return {
																			...prev,
																			[col.field]: next,
																		};
																	});
																}}
																style={{ margin: 0 }}
															/>
															<span>{opt.label}</span>
														</label>
													);
												})}
											</div>

											<div
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													marginTop: 6,
													gap: 4,
												}}
											>
												<button
													type="button"
													onClick={() => {
														setColumnFilters(prev => ({
															...prev,
															[col.field]: [],
														}));
													}}
													style={{
														flex: 1,
														height: 24,
														fontSize: 11,
														backgroundColor: '#333',
														color: '#fff',
														border: '1px solid #555',
														borderRadius: 3,
														cursor: 'pointer',
													}}
												>
													전체 해제
												</button>
												<button
													type="button"
													onClick={() => {
														setOpenFilterField(null);
													}}
													style={{
														flex: 1,
														height: 24,
														fontSize: 11,
														backgroundColor: '#4FC3F7',
														color: '#000',
														border: '1px solid #4FC3F7',
														borderRadius: 3,
														cursor: 'pointer',
													}}
												>
													닫기
												</button>
											</div>
										</div>
									)}
								</>
							) : null}

							{/* 리사이즈 핸들 */}
							{canResize && (
								<span
									onMouseDown={e => {
										e.preventDefault();
										e.stopPropagation();

										const baseWidth =
											columnWidths[col.field] ??
											(typeof cellStyle.width === 'number'
												? (cellStyle.width as number)
												: typeof col.width === 'number'
												? col.width
												: DEFAULT_COL_WIDTH);

										setResizing({
											field: col.field,
											startX: e.clientX,
											startWidth: baseWidth,
										});
									}}
									style={{
										position: 'absolute',
										right: 0,
										top: 0,
										width: 4,
										height: '100%',
										cursor: 'col-resize',
										userSelect: 'none',
									}}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* === 오버레이 계층 : 그룹 헤더 + rowSpan 헤더(No, 지역 등) === */}
			{leafMetrics.length === effectiveColumns.length && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: headerRowHeight * headerDepth,
						zIndex: 2,
						pointerEvents: 'none', // 오버레이가 클릭 막지 않게
					}}
				>
					{/* 그룹 헤더 (2022년 / 1분기 / 2분기 ... ) */}
					{groupLevels.map((cells, levelIdx) => {
						const top = headerRowHeight * levelIdx;
						return (
							<div
								key={`level-${levelIdx}`}
								style={{
									position: 'absolute',
									top,
									left: 0,
									right: 0,
									height: headerRowHeight,
								}}
							>
								{cells.map(cell => {
									const { startLeafIndex, leafSpan, label, key } = cell;
									const left = leafMetrics[startLeafIndex]?.left ?? 0;
									const width = leafMetrics
										.slice(startLeafIndex, startLeafIndex + leafSpan)
										.reduce((sum, m) => sum + (m?.width ?? 0), 0);

									return (
										<div
											key={key}
											style={{
												position: 'absolute',
												left,
												width,
												height: '100%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												borderRight: `1px solid ${border}`,
												borderBottom: `1px solid ${border}`,
												boxSizing: 'border-box',
												fontSize: 12,
												fontWeight: 600,
												backgroundColor: headerBg,
												userSelect: 'none',
											}}
										>
											{label}
										</div>
									);
								})}
							</div>
						);
					})}

					{/* 그룹에 속하지 않은 leaf 컬럼 → 전체 높이 rowSpan 헤더 (No, 지역) */}
					{effectiveColumns.map((col, idx) => {
						const isGroupedLeaf = leafGroupedMap.get(col.field) ?? false;
						if (isGroupedLeaf) return null; // 그룹에 속한 것은 위/아래 줄로 처리

						//const isLastCol = idx === effectiveColumns.length - 1;
						const metric = leafMetrics[idx];
						if (!metric) return null;

						return (
							<div
								key={`span-${col.field}`}
								style={{
									position: 'absolute',
									top: 0,
									left: metric.left,
									width: metric.width,
									height: headerRowHeight * headerDepth,
									display: 'flex',
									alignItems: 'center',
									justifyContent: headerJustify,
									borderRight: `1px solid ${border}`,
									borderBottom: `1px solid ${border}`,
									boxSizing: 'border-box',
									fontSize: 12,
									fontWeight: 600,
									backgroundColor: headerBg,
									userSelect: 'none',
								}}
							>
								{col.headerName}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default OneGridHeader;
