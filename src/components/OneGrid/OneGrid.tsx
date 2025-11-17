import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { CellCoord, OneGridColumn, OneGridHandle, OneGridOptions, OneGridProps } from '../../types/types';

import { filterHiddenColumns, getCellStyle, getFlexCount, injectRowNumberColumn } from './columnLayout';

import { copySelectionToClipboard, pasteFromClipboard } from '../../types/utilsClipboard';
import { cloneRows, rowsEqual } from '../../types/utilsHistory';
import { buildRectSelection } from '../../types/utilsSelection';
import { applySort, nextSortState } from '../../types/utilsSort';

import type { SortState } from '../../types/utilsSort';

import CellEditor from './CellEditor';
import CellRenderer from './CellRenderer';

// 색/스타일 상수
const headerBg = '#2a2a2a';
const bodyBgA = '#1e1e1e';
const bodyBgB = '#252525';
const border = '#444';

const OneGrid = forwardRef<OneGridHandle, OneGridProps>(
	({ columns, rows, rowKeyField = 'id', height = 300, width, options, onRowsChange }: OneGridProps, ref) => {
		const {
			rowHeight: optRowHeight = 32,
			editable: optEditable = true,
			showRowNumber: optShowRowNumber = false,
			headerAlign = 'center',
			scroll,
			enableColumnReorder = false,
			enableColumnResize = false,
			enableHeaderFilter = false,
			showCheckBox = false,
		}: OneGridOptions = options ?? {};

		const headerJustify: 'flex-start' | 'center' | 'flex-end' =
			headerAlign === 'right' ? 'flex-end' : headerAlign === 'center' ? 'center' : 'flex-start';

		const rowHeight = optRowHeight;
		const editableGrid = optEditable;
		const showRowNumber = optShowRowNumber;

		const defaultColWidth = 100; // width 없는 컬럼 기본 폭

		const overflowX = scroll?.x ?? 'auto';
		const overflowY = scroll?.y ?? 'auto';

		// 루트 focus(키보드 단축키, 복붙 등 처리하려고)
		const gridRootRef = useRef<HTMLDivElement | null>(null);

		// 내부적으로 row key 자동 생성 (rowKeyField 없을 때 fallback)
		const autoIdCounterRef = useRef(0);
		function ensureInternalKey(r: any): any {
			const hasUserKey = r[rowKeyField] !== undefined && r[rowKeyField] !== null;
			if (hasUserKey) return r;

			if (r._onegridRowKey === undefined || r._onegridRowKey === null) {
				autoIdCounterRef.current += 1;
				return {
					...r,
					_onegridRowKey: autoIdCounterRef.current,
				};
			}
			return r;
		}

		function attachInternalKeys(rawRows: any[]): any[] {
			return rawRows.map(r => ensureInternalKey(r));
		}

		function getRowKey(row: any): string | number | undefined {
			if (row[rowKeyField] !== undefined && row[rowKeyField] !== null) {
				return row[rowKeyField];
			}
			return row._onegridRowKey;
		}

		// 편집 대상이 되는 내부 rows 상태
		const [internalRows, setInternalRows] = useState<any[]>(() => attachInternalKeys(rows));

		// 외부 rows prop 바뀌면 내부 rows도 동기화
		useEffect(() => {
			setInternalRows(attachInternalKeys(rows));
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [rows]);

		// ===== 선택 상태 =====
		const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
		const [anchorCell, setAnchorCell] = useState<CellCoord | null>(null);
		const [selectedCells, setSelectedCells] = useState<Set<string>>(() => new Set());
		const [selectionRect, setSelectionRect] = useState<{
			rStart: number;
			rEnd: number;
			cStart: number;
			cEnd: number;
		} | null>(null);

		// ===== 편집 상태 =====
		const [editCell, setEditCell] = useState<CellCoord | null>(null);
		const [draft, setDraft] = useState<any>('');

		// ===== 정렬 상태 =====
		const [sortState, setSortState] = useState<SortState | null>(null);

		// ===== undo / redo 스택 =====
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_undoStack, setUndoStack] = useState<any[][]>([]);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_redoStack, setRedoStack] = useState<any[][]>([]);

		// ===== 컬럼 순서/크기 상태 =====
		// field 기준으로 순서를 기억 (rowNumber 컬럼 제외)
		const [columnOrder, setColumnOrder] = useState<string[] | null>(null);

		// field 별 width (사용자가 리사이즈한 값만 저장)
		const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

		// 헤더 드래그용
		const [dragColField, setDragColField] = useState<string | null>(null);

		// 리사이즈 중 상태
		const [resizing, setResizing] = useState<{
			field: string;
			startX: number;
			startWidth: number;
		} | null>(null);

		// === 필터 상태 ===
		const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
		const [openFilterField, setOpenFilterField] = useState<string | null>(null); // 어떤 컬럼 필터 팝업이 열려있는지
		const [filterSearch, setFilterSearch] = useState<string>(''); // 팝업 안에서 옵션 검색용

		// === 행 체크박스 선택 상태 ===
		const [checkedRowKeys, setCheckedRowKeys] = useState<Set<string | number>>(() => new Set());

		// 컬럼 바뀌면 존재하지 않는 필터는 정리
		useEffect(() => {
			setColumnFilters(prev => {
				const next: Record<string, any> = {};
				columns.forEach(c => {
					if (Object.prototype.hasOwnProperty.call(prev, c.field)) {
						next[c.field] = prev[c.field];
					}
				});
				return next;
			});
		}, [columns]);

		// order 적용된 컬럼 배열 (rowNumber 넣기 전)
		const orderedBaseColumns: OneGridColumn[] = useMemo(() => {
			if (!columnOrder) return columns;

			const map = new Map(columns.map(c => [c.field, c]));
			const ordered: OneGridColumn[] = [];

			columnOrder.forEach(field => {
				const col = map.get(field);
				if (col) ordered.push(col);
			});

			// 혹시 빠진 컬럼 있으면 뒤에 추가
			columns.forEach(col => {
				if (!ordered.includes(col)) ordered.push(col);
			});

			return ordered;
		}, [columns, columnOrder]);

		const effectiveColumns: OneGridColumn[] = useMemo(() => {
			let base: OneGridColumn[] = orderedBaseColumns;

			if (showCheckBox) {
				const exists = base.some(c => c.field === '__rowCheck__');
				if (!exists) {
					base = [
						{
							field: '__rowCheck__',
							headerName: '',
							width: 32,
							align: 'center',
						} as OneGridColumn,
						...base,
					];
				}
			}

			const injected = injectRowNumberColumn(base, showRowNumber);
			return filterHiddenColumns(injected);
		}, [orderedBaseColumns, showRowNumber, showCheckBox]);

		const totalContentWidth = useMemo(() => {
			return effectiveColumns.reduce((sum, col) => {
				const overrideWidth = columnWidths[col.field];
				// 체크박스/rowNum 도 width 없으면 기본값 사용
				const w =
					overrideWidth ??
					(typeof col.width === 'number'
						? col.width
						: col.field === '__rowCheck__'
						? 32
						: col.field === '__rowNum__'
						? col.width ?? 50
						: defaultColWidth);

				return sum + w;
			}, 0);
		}, [effectiveColumns, columnWidths]);

		// flex 대상 컬럼 개수 (width 없는 컬럼 수)
		const flexCount = useMemo(() => {
			return getFlexCount(effectiveColumns);
		}, [effectiveColumns]);

		// === 필터 적용 ===
		const filteredRows = useMemo(() => {
			if (!enableHeaderFilter) return internalRows;

			const activeFields = Object.keys(columnFilters).filter(field => {
				const v = columnFilters[field];
				if (Array.isArray(v)) return v.length > 0; // 다중 선택
				return v !== undefined && v !== null && v !== '';
			});
			if (activeFields.length === 0) return internalRows;

			return internalRows.filter(row => {
				return activeFields.every(field => {
					const col = effectiveColumns.find(c => c.field === field);
					if (!col || !col.filterable) return true;

					const filterVal = columnFilters[field];
					const raw = row[field];

					if (col.filterable) {
						// 체크박스 멀티 선택 필터
						if (!Array.isArray(filterVal) || filterVal.length === 0) return true;
						return filterVal.includes(raw);
					}

					// (원래 text/number 필터 유지하고 싶으면 여기 추가 가능)
					return true;
				});
			});
		}, [internalRows, columnFilters, enableHeaderFilter, effectiveColumns]);

		// 정렬까지 적용된 최종 rows
		const displayRows = useMemo(() => {
			return applySort(filteredRows, sortState);
		}, [filteredRows, sortState]);

		// === 히스토리 스냅샷 추가 ===
		function pushHistoryBeforeChange() {
			setUndoStack(prev => [...prev, cloneRows(internalRows)]);
			setRedoStack([]); // 새로운 브랜치 시작
		}

		// === Undo ===
		function handleUndo() {
			setUndoStack(prevUndo => {
				if (prevUndo.length === 0) return prevUndo;

				const prevState = prevUndo[prevUndo.length - 1];

				// prevState랑 현재 상태가 똑같으면 중복 snapshot만 pop
				if (rowsEqual(prevState, internalRows)) {
					return prevUndo.slice(0, prevUndo.length - 1);
				}

				// 정상 undo 경로
				setRedoStack(prevRedo => [...prevRedo, cloneRows(internalRows)]);

				const restored = cloneRows(prevState);
				setInternalRows(restored);
				onRowsChange?.(restored);

				return prevUndo.slice(0, prevUndo.length - 1);
			});
		}

		// === Redo ===
		function handleRedo() {
			setRedoStack(prevRedo => {
				if (prevRedo.length === 0) return prevRedo;

				const nextState = prevRedo[prevRedo.length - 1];

				// nextState랑 현재 상태 같으면 pop만
				if (rowsEqual(nextState, internalRows)) {
					return prevRedo.slice(0, prevRedo.length - 1);
				}

				// 정상 redo 경로
				setUndoStack(prevUndo => [...prevUndo, cloneRows(internalRows)]);

				const restored = cloneRows(nextState);
				setInternalRows(restored);
				onRowsChange?.(restored);

				return prevRedo.slice(0, prevRedo.length - 1);
			});
		}

		// === 편집 모드 진입 ===
		function enterEditMode(target: CellCoord, initialDraft?: string) {
			if (!editableGrid) return;

			const col = effectiveColumns[target.colIndex];
			if (!col || !col.editor || col.field === '__rowNum__') return;

			const row = displayRows[target.rowIndex];
			const currentVal = col.field === '__rowNum__' ? target.rowIndex + 1 : row?.[col.field] ?? '';

			setActiveCell(target);
			setEditCell(target);
			setDraft(initialDraft !== undefined ? initialDraft : currentVal);
		}

		// === 편집 커밋 ===
		function commitEdit() {
			if (!editCell) return;

			const { rowKey, colField } = editCell;

			const realIndex = internalRows.findIndex(r => getRowKey(r) === rowKey);
			if (realIndex < 0) {
				setEditCell(null);
				return;
			}

			const col = effectiveColumns[editCell.colIndex];
			if (!col || col.field === '__rowNum__') {
				setEditCell(null);
				return;
			}

			// 변경 직전 스냅샷 저장
			pushHistoryBeforeChange();

			const updated = [...internalRows];
			updated[realIndex] = {
				...updated[realIndex],
				[colField]: draft,
			};

			setInternalRows(updated);
			onRowsChange?.(updated);
			setEditCell(null);
		}

		function cancelEdit() {
			setEditCell(null);
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
			return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
		}

		// === Tab / Shift+Tab 이동 ===
		function moveEditByTab(shift: boolean) {
			if (!editCell) return;

			const { rowIndex, colIndex } = editCell;

			function tryEnterAt(r: number, c: number): boolean {
				if (r < 0 || r >= displayRows.length || c < 0 || c >= effectiveColumns.length) {
					return false;
				}
				const row = displayRows[r];
				const col = effectiveColumns[c];
				const rowKeyVal = getRowKey(row);
				if (rowKeyVal === undefined) return false;

				if (!col.editor || col.field === '__rowNum__') {
					return false;
				}

				const coord: CellCoord = {
					rowKey: rowKeyVal,
					colField: col.field,
					rowIndex: r,
					colIndex: c,
				};
				enterEditMode(coord);
				return true;
			}

			const step = shift ? -1 : 1;

			// 같은 행에서 다음/이전 editable 컬럼 탐색
			for (let c = colIndex + step; c >= 0 && c < effectiveColumns.length; c += step) {
				if (tryEnterAt(rowIndex, c)) return;
			}

			// 다음/이전 행으로 이동
			const nextRow = shift ? rowIndex - 1 : rowIndex + 1;
			if (nextRow < 0 || nextRow >= displayRows.length) {
				commitEdit();
				return;
			}

			if (shift) {
				// 이전 행의 마지막부터 거꾸로
				for (let c = effectiveColumns.length - 1; c >= 0; c--) {
					if (tryEnterAt(nextRow, c)) return;
				}
			} else {
				// 다음 행의 첫 컬럼부터 순회
				for (let c = 0; c < effectiveColumns.length; c++) {
					if (tryEnterAt(nextRow, c)) return;
				}
			}

			commitEdit();
		}

		// === 헤더 클릭 -> 정렬 토글 ===
		function handleHeaderClick(col: OneGridColumn) {
			if (!col.sortable) return;
			setSortState(prev => nextSortState(prev, col.field));
		}

		// === 그리드 전체 키 처리 (Undo/Redo, Copy/Paste 등) ===
		function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
			// 현재 셀이 에디터 모드일 땐 input 내부에서 ctrl+z 등 처리
			if (editCell) return;

			// Undo / Redo
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				if (e.shiftKey) {
					// Ctrl+Shift+Z => redo
					handleRedo();
				} else {
					// Ctrl+Z => undo
					handleUndo();
				}
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
				e.preventDefault();
				handleRedo();
				return;
			}

			// Copy
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
				if (selectionRect) {
					e.preventDefault();
					copySelectionToClipboard(selectionRect, displayRows, effectiveColumns);
				}
				return;
			}

			// Paste
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
				if (activeCell && selectionRect) {
					e.preventDefault();
					pasteFromClipboard(
						{
							rowIndex: activeCell.rowIndex,
							colIndex: activeCell.colIndex,
							rowKey: activeCell.rowKey,
							colField: activeCell.colField,
						},
						displayRows,
						effectiveColumns,
						internalRows,
						getRowKey,
					).then(updated => {
						if (!updated) return;
						pushHistoryBeforeChange();
						setInternalRows(updated);
						onRowsChange?.(updated);
					});
				}
				return;
			}
		}

		// === 셀 클릭 ===
		function handleCellClick(e: React.MouseEvent<HTMLDivElement>, rowIndex: number, colIndex: number) {
			// 전역 단축키 받으려고 focus 유지
			if (!editCell && gridRootRef.current) {
				gridRootRef.current.focus();
			}

			// 다른 셀로 이동할 때 기존 편집은 커밋
			if (editCell && (editCell.rowIndex !== rowIndex || editCell.colIndex !== colIndex)) {
				commitEdit();
			}

			const row = displayRows[rowIndex];
			const col = effectiveColumns[colIndex];
			const rowKeyVal = getRowKey(row);
			if (rowKeyVal === undefined) return;

			const clicked: CellCoord = {
				rowKey: rowKeyVal,
				colField: col.field,
				rowIndex,
				colIndex,
			};

			// Ctrl: 토글식 멀티셀 선택
			if (e.ctrlKey || e.metaKey) {
				setActiveCell(clicked);
				setAnchorCell(prev => prev ?? clicked);

				setSelectedCells(prev => {
					const nextSel = new Set(prev);
					const k = `${rowKeyVal}::${col.field}`;
					if (nextSel.has(k)) nextSel.delete(k);
					else nextSel.add(k);
					return nextSel;
				});
				return;
			}

			// Shift: anchorCell~현재 셀 사각형 선택
			if (e.shiftKey && anchorCell) {
				const result = buildRectSelection(anchorCell, rowIndex, colIndex, displayRows, effectiveColumns, getRowKey);
				setActiveCell(clicked);
				setSelectedCells(result.selectedCells);
				setSelectionRect(result.rect);
				return;
			}

			// 그냥 클릭: 단일 셀
			setActiveCell(clicked);
			setAnchorCell(clicked);

			const single = new Set([`${rowKeyVal}::${col.field}`]);
			setSelectedCells(single);
			setSelectionRect({
				rStart: rowIndex,
				rEnd: rowIndex,
				cStart: colIndex,
				cEnd: colIndex,
			});
		}

		// === 더블클릭 -> 에디트 진입 ===
		function handleCellDoubleClick(rowIndex: number, colIndex: number) {
			const row = displayRows[rowIndex];
			const col = effectiveColumns[colIndex];
			const rowKeyVal = getRowKey(row);
			if (rowKeyVal === undefined) return;

			const coord: CellCoord = {
				rowKey: rowKeyVal,
				colField: col.field,
				rowIndex,
				colIndex,
			};
			enterEditMode(coord);
		}

		// === 키 입력으로 즉시 편집 시작 (문자키 / Enter) ===
		function handleCellKeyDown(e: React.KeyboardEvent<HTMLDivElement>, rowIndex: number, colIndex: number) {
			const row = displayRows[rowIndex];
			const col = effectiveColumns[colIndex];
			const rowKeyVal = getRowKey(row);
			if (rowKeyVal === undefined) return;

			// 이미 이 셀 편집중이면 여기선 안 건드림
			if (editCell && editCell.rowKey === rowKeyVal && editCell.colField === col.field) {
				return;
			}

			// 편집 불가능 컬럼이면 패스
			if (!col.editor || col.field === '__rowNum__') return;

			// 'a', 'b', 'c' 처럼 길이 1 키 or Enter
			if (e.key.length === 1 || e.key === 'Enter') {
				const typed = e.key.length === 1 ? e.key : String(row?.[col.field] ?? '');
				const coord: CellCoord = {
					rowKey: rowKeyVal,
					colField: col.field,
					rowIndex,
					colIndex,
				};
				enterEditMode(coord, typed);
			}
		}

		// === ref API 노출 ===
		useImperativeHandle(ref, () => ({
			setRows(next) {
				const withKeys = attachInternalKeys(next);
				setInternalRows(withKeys);
				onRowsChange?.(withKeys);
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
				const rIndex = displayRows.findIndex(r => getRowKey(r) === rowKey);
				const cIndex = effectiveColumns.findIndex(c => c.field === colField);
				if (rIndex < 0 || cIndex < 0) return;

				const coord: CellCoord = {
					rowKey,
					colField,
					rowIndex: rIndex,
					colIndex: cIndex,
				};
				enterEditMode(coord);
			},
		}));

		// columns prop 이 처음 들어왔을 때 순서 초기화
		useEffect(() => {
			setColumnOrder(prev => {
				const base = columns.map(c => c.field);
				if (!prev) return base;

				// 이전 order에서 살아있는 애들만 유지 + 새로 생긴 컬럼 뒤에 추가
				const remained = prev.filter(f => base.includes(f));
				const added = base.filter(f => !remained.includes(f));
				return [...remained, ...added];
			});
		}, [columns]);

		useEffect(() => {
			if (!resizing) return;

			const { field, startX, startWidth } = resizing;

			function handleMouseMove(ev: MouseEvent) {
				const delta = ev.clientX - startX;
				const nextWidth = Math.max(40, startWidth + delta); // 최소 40px

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
		}, [resizing]);

		// ===================== 렌더 =====================
		const headerHeight = rowHeight;

		return (
			<div
				ref={gridRootRef}
				style={{
					display: 'flex',
					flexDirection: 'column',
					border: `1px solid ${border}`,
					backgroundColor: bodyBgA,
					color: '#fff',
					fontSize: 12,
					height,
					width: width ?? 'fit-content', // <= width 없으면 내용폭만큼만
					overflow: 'hidden',
					borderRadius: 4,
				}}
				tabIndex={0}
				onKeyDown={handleGridKeyDown}
			>
				{/* 공통 스크롤 컨테이너 (HEADER + BODY 같이 들어감) */}
				<div
					style={{
						flex: 1,
						overflowX, // options.scroll.x 반영
						overflowY, // options.scroll.y 반영
						position: 'relative',
					}}
				>
					{/* 실제 그리드 내용 래퍼: 컬럼 폭 합 만큼 최소 너비 확보 */}
					<div
						style={{
							display: 'inline-block',
							minWidth: totalContentWidth,
							// width prop 이 숫자/문자열로 들어오면 그 값까지 늘어남
							// (width 미지정이면 내용 폭 기준)
							width: typeof width !== 'undefined' ? '100%' : undefined,
						}}
					>
						{/* HEADER */}
						<div
							style={{
								display: 'flex',
								minWidth: 0,
								//width: '100%',
								backgroundColor: headerBg,
								borderBottom: `1px solid ${border}`,
								height: headerHeight,
								fontWeight: 600,
								position: 'sticky',
								top: 0,
								zIndex: 2,
							}}
						>
							{effectiveColumns.map((col, colIdx) => {
								const isLastCol = colIdx === effectiveColumns.length - 1;
								let cellStyle = getCellStyle(col, colIdx, isLastCol, flexCount);

								const isSorted = sortState?.field === col.field;

								const overrideWidth = columnWidths[col.field];
								if (overrideWidth != null) {
									cellStyle = {
										...cellStyle,
										width: overrideWidth,
										minWidth: overrideWidth,
										flex: '0 0 auto',
									};
								}

								const isCheckCol = col.field === '__rowCheck__';
								const isRowNumCol = col.field === '__rowNum__';

								const isDraggable = enableColumnReorder && !isRowNumCol && !isCheckCol;
								const canResize = enableColumnResize && !isRowNumCol && !isCheckCol;

								// 필터 가능한 컬럼 여부 (여기서는 select만)
								const isFilterable = enableHeaderFilter && col.filterable && !isRowNumCol && !isCheckCol;
								const selectedValues: any[] = Array.isArray(columnFilters[col.field]) ? columnFilters[col.field] : [];

								// 이 컬럼용 옵션 목록
								const baseOptions =
									(col.filterOptions as { value: any; label: string }[] | undefined) ??
									getDistinctOptions(internalRows, col.field);

								// 검색어 적용된 옵션 목록
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
											borderRight: isLastCol ? 'none' : `1px solid ${border}`,
											backgroundColor: headerBg,
											fontWeight: 600,
											userSelect: 'none',
											display: 'flex',
											alignItems: 'center',
											position: 'relative', // 필터 팝업/리사이즈 핸들용
											padding: '0 4px',
											boxSizing: 'border-box',
											overflow: 'visible',
										}}
									>
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
																// 현재 보이는 행들 전부 추가
																allVisibleRowKeys.forEach(k => next.add(k));
															} else {
																// 현재 보이는 행들만 제거
																allVisibleRowKeys.forEach(k => next.delete(k));
															}
															return next;
														});
													}}
													style={{ margin: 0 }}
												/>
											</div>
										) : (
											<>
												{/* 헤더 텍스트 + 정렬 */}
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
														handleHeaderClick(col);
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
															color: selectedValues.length > 0 ? '#4FC3F7' : '#bbb', // 선택 있으면 색 강조
														}}
														title="필터"
													>
														{/* 간단한 필터 아이콘 (원하면 SVG 아이콘으로 교체 가능) */}▾
													</div>
												)}

												{/* 필터 팝업 */}
												{isFilterable && openFilterField === col.field && (
													<div
														style={{
															position: 'absolute',
															top: headerHeight,
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
														{/* 검색 인풋 */}
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

														{/* 체크박스 리스트 */}
														<div
															style={{
																maxHeight: 160,
																overflowY: 'auto',
																paddingRight: 4,
															}}
														>
															{visibleOptions.length === 0 && (
																<div style={{ fontSize: 11, color: '#888', padding: '4px 0' }}>검색 결과 없음</div>
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
																				const checked = e.target.checked;
																				setColumnFilters(prev => {
																					const current: any[] = Array.isArray(prev[col.field]) ? prev[col.field] : [];
																					let next: any[];
																					if (checked) {
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

														{/* 버튼 영역 (전체해제 / 닫기 정도) */}
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
										)}

										{/* 리사이즈 핸들 */}
										{canResize && (
											<span
												onMouseDown={e => {
													e.preventDefault();
													e.stopPropagation(); // 헤더 클릭/필터 팝업 열림 막기

													const baseWidth =
														columnWidths[col.field] ??
														(typeof cellStyle.width === 'number'
															? cellStyle.width
															: typeof col.width === 'number'
															? col.width
															: 100);

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

						{/* BODY */}
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
											//width: '100%',
											borderBottom: '1px solid #333',
											backgroundColor: zebraBg,
											height: rowHeight,
											lineHeight: `${rowHeight}px`,
										}}
									>
										{effectiveColumns.map((col, colIndex) => {
											const isLastCol = colIndex === effectiveColumns.length - 1;
											let cellStyle = getCellStyle(col, colIndex, isLastCol, flexCount);

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

											const rawVal =
												col.field === '__rowNum__'
													? rowIndex + 1
													: col.field === '__rowCheck__'
													? checkedRowKeys.has(rowKeyVal!)
													: row[col.field];

											if (col.field === '__rowCheck__') {
												// 렌더러 강제 설정
												col = {
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
														borderRight: isLastCol ? 'none' : '1px solid #333',
														backgroundColor: isEditingNow ? '#3a3a3a' : isSelected ? '#4a4a4a' : zebraBg,
														outline: isActiveNow ? '1px solid #888' : '1px solid transparent',
														display: 'flex',
														alignItems: 'center',
														position: 'relative',
													}}
													onClick={e => handleCellClick(e, rowIndex, colIndex)}
													onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
													onKeyDown={e => handleCellKeyDown(e, rowIndex, colIndex)}
													tabIndex={0}
												>
													{isEditingNow ? (
														<CellEditor
															column={col}
															draft={draft}
															rowHeight={rowHeight}
															onChangeDraft={v => setDraft(v)}
															onCommit={commitEdit}
															onCancel={cancelEdit}
															onTabNav={moveEditByTab}
														/>
													) : (
														<CellRenderer
															column={col}
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
					</div>
				</div>
			</div>
		);
	},
);

export default OneGrid;
