// src/components/OneGrid/OneGrid.tsx
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { CellCoord, OneGridColumn, OneGridHandle, OneGridOptions, OneGridProps } from '../../types/types';

import { filterHiddenColumns, getFlexCount, injectRowNumberColumn } from './columnLayout';

import { copySelectionToClipboard, pasteFromClipboard } from '../../types/utilsClipboard';
import { cloneRows, rowsEqual } from '../../types/utilsHistory';
import { buildRectSelection } from '../../types/utilsSelection';
import { applySort, nextSortState } from '../../types/utilsSort';

import type { SortState } from '../../types/utilsSort';

import OneGridBody from './OneGridBody';
import OneGridHeader from './OneGridHeader';

// 색/스타일 상수 → CSS 변수 사용
const headerBg = 'var(--grid-header-bg)';
const bodyBgA = 'var(--grid-body-a)';
const bodyBgB = 'var(--grid-body-b)';
const border = 'var(--grid-border)';

const STATUS_FIELD = '__rowStatus__' as const; // '', 'I', 'U', 'D'
const INTERNAL_KEY_FIELD = '_onegridRowKey' as const;

const OneGrid = forwardRef<OneGridHandle, OneGridProps>(
	({ columns, rows, height = 300, width, options, onRowsChange }: OneGridProps, ref) => {
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

		const defaultColWidth = 100;

		const overflowX = scroll?.x ?? 'auto';
		const overflowY = scroll?.y ?? 'auto';

		const gridRootRef = useRef<HTMLDivElement | null>(null);

		// ===== 내부 rowKey 관리 =====
		const autoIdCounterRef = useRef(0);

		function generateInternalKey(): string {
			// 브라우저 환경이면 거의 다 있음
			if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
				return crypto.randomUUID();
			}
			// 혹시 모를 환경 대비: timestamp + counter
			autoIdCounterRef.current += 1;
			return `og_${Date.now()}_${autoIdCounterRef.current}`;
		}

		const ensureInternalKey = useCallback((r: any): any => {
			let base = r;

			if (base[INTERNAL_KEY_FIELD] == null) {
				base = {
					...base,
					[INTERNAL_KEY_FIELD]: generateInternalKey(),
				};
			}

			if (base[STATUS_FIELD] === undefined) {
				base = {
					...base,
					[STATUS_FIELD]: '',
				};
			}

			return base;
		}, []);

		const attachInternalKeys = useCallback(
			(rawRows: any[]): any[] => rawRows.map(r => ensureInternalKey(r)),
			[ensureInternalKey],
		);

		function getRowKey(row: any): string | undefined {
			return row[INTERNAL_KEY_FIELD];
		}

		const [internalRows, setInternalRows] = useState<any[]>(() => attachInternalKeys(rows));

		useEffect(() => {
			setInternalRows(attachInternalKeys(rows));
		}, [rows, attachInternalKeys]);

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

		// ===== undo / redo =====
		const [_undoStack, setUndoStack] = useState<any[][]>([]);
		const [_redoStack, setRedoStack] = useState<any[][]>([]);

		// ===== 컬럼 순서/크기 =====
		const [columnOrder, setColumnOrder] = useState<string[] | null>(null);
		const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

		// ===== 필터/체크박스 =====
		const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
		const [checkedRowKeys, setCheckedRowKeys] = useState<Set<string | number>>(() => new Set());

		function flattenLeafColumns(cols: OneGridColumn[]): OneGridColumn[] {
			const result: OneGridColumn[] = [];

			const walk = (list: OneGridColumn[]) => {
				list.forEach(col => {
					if (col.children && col.children.length > 0) {
						walk(col.children);
					} else {
						result.push(col);
					}
				});
			};

			walk(cols);
			return result;
		}

		// 컬럼 변경 시 존재하지 않는 필터 제거
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

		// ===== 컬럼 정렬/체크박스/rowNum 반영된 effectiveColumns =====
		// leaf 컬럼 (children 풀어서 데이터에 실제로 쓰이는 컬럼)
		const leafColumnsFromProp = useMemo(() => flattenLeafColumns(columns), [columns]);

		// order 적용된 leaf 컬럼
		const orderedBaseColumns: OneGridColumn[] = useMemo(() => {
			if (!columnOrder) return leafColumnsFromProp;

			const map = new Map(leafColumnsFromProp.map(c => [c.field, c]));
			const ordered: OneGridColumn[] = [];

			columnOrder.forEach(field => {
				const col = map.get(field);
				if (col) ordered.push(col);
			});

			leafColumnsFromProp.forEach(col => {
				if (!ordered.includes(col)) ordered.push(col);
			});

			return ordered;
		}, [leafColumnsFromProp, columnOrder]);

		// 체크박스/rowNum 반영된 헤더용 컬럼 (flat)
		const headerColumns = useMemo(() => {
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
			return filterHiddenColumns(injected); // flat 배열
		}, [orderedBaseColumns, showRowNumber, showCheckBox]);

		// effectiveColumns = leaf만
		function flattenLeaf(cols: OneGridColumn[]): OneGridColumn[] {
			const out: OneGridColumn[] = [];
			const walk = (c: OneGridColumn) => {
				if (c.children && c.children.length) {
					c.children.forEach(walk);
				} else {
					out.push(c);
				}
			};
			cols.forEach(walk);
			return out;
		}

		const effectiveColumns: OneGridColumn[] = useMemo(() => flattenLeaf(headerColumns), [headerColumns]);

		// 헤더/바디에서 공통으로 쓸 전체 content width (단순합)
		const totalContentWidth = useMemo(() => {
			const sum = effectiveColumns.reduce((acc, col) => {
				const overrideWidth = columnWidths[col.field];
				const w =
					overrideWidth ??
					(typeof col.width === 'number'
						? col.width
						: col.field === '__rowCheck__'
						? 32
						: col.field === '__rowNum__'
						? col.width ?? 50
						: defaultColWidth);
				return acc + w;
			}, 0);

			if (typeof width === 'number') {
				return Math.max(sum, width);
			}
			return sum;
		}, [effectiveColumns, columnWidths, width]);

		function findRealIndexByDisplayIndex(displayIndex: number): number {
			if (displayIndex < 0 || displayIndex >= displayRows.length) return -1;
			const targetRow = displayRows[displayIndex];
			const targetKey = getRowKey(targetRow);
			if (targetKey === undefined) return -1;
			return internalRows.findIndex(r => getRowKey(r) === targetKey);
		}

		const flexCount = useMemo(() => getFlexCount(effectiveColumns), [effectiveColumns]);

		// ===== 필터 적용 =====
		const filteredRows = useMemo(() => {
			// 기본적으로 삭제된 행(D)은 안 보여주기
			const baseRows = internalRows.filter(r => r[STATUS_FIELD] !== 'D');

			if (!enableHeaderFilter) return baseRows;

			const activeFields = Object.keys(columnFilters).filter(field => {
				const v = columnFilters[field];
				if (Array.isArray(v)) return v.length > 0;
				return v !== undefined && v !== null && v !== '';
			});
			if (activeFields.length === 0) return baseRows;

			return baseRows.filter(row => {
				return activeFields.every(field => {
					const col = effectiveColumns.find(c => c.field === field);
					if (!col || !col.filterable) return true;

					const filterVal = columnFilters[field];
					const raw = row[field];

					if (col.filterable) {
						if (!Array.isArray(filterVal) || filterVal.length === 0) return true;
						return filterVal.includes(raw);
					}
					return true;
				});
			});
		}, [internalRows, columnFilters, enableHeaderFilter, effectiveColumns]);

		// ===== 정렬 적용 =====
		const displayRows = useMemo(() => applySort(filteredRows, sortState), [filteredRows, sortState]);

		// ===== 히스토리 =====
		function pushHistoryBeforeChange() {
			setUndoStack(prev => [...prev, cloneRows(internalRows)]);
			setRedoStack([]);
		}

		function handleUndo() {
			setUndoStack(prevUndo => {
				if (prevUndo.length === 0) return prevUndo;

				const prevState = prevUndo[prevUndo.length - 1];
				if (rowsEqual(prevState, internalRows)) {
					return prevUndo.slice(0, prevUndo.length - 1);
				}

				setRedoStack(prevRedo => [...prevRedo, cloneRows(internalRows)]);

				const restored = cloneRows(prevState);
				setInternalRows(restored);
				onRowsChange?.(restored);

				return prevUndo.slice(0, prevUndo.length - 1);
			});
		}

		function handleRedo() {
			setRedoStack(prevRedo => {
				if (prevRedo.length === 0) return prevRedo;

				const nextState = prevRedo[prevRedo.length - 1];
				if (rowsEqual(nextState, internalRows)) {
					return prevRedo.slice(0, prevRedo.length - 1);
				}

				setUndoStack(prevUndo => [...prevUndo, cloneRows(internalRows)]);

				const restored = cloneRows(nextState);
				setInternalRows(restored);
				onRowsChange?.(restored);

				return prevRedo.slice(0, prevRedo.length - 1);
			});
		}

		// ===== 편집 진입/커밋/취소 =====
		function enterEditMode(target: CellCoord, initialDraft?: string) {
			if (!editableGrid) return;

			const col = effectiveColumns[target.colIndex];
			if (!col || !col.editor || col.field === '__rowNum__') return;

			const row = displayRows[target.rowIndex];
			const currentVal = col.field === '__rowNum__' ? target.rowIndex + 1 : row?.[col.field] ?? '';

			setActiveCell(target);
			setEditCell(target);
			setDraft(initialDraft !== undefined ? initialDraft : (currentVal as any));
		}

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

			pushHistoryBeforeChange();

			const updated = [...internalRows];
			const prevRow = updated[realIndex];

			const nextRow: any = {
				...prevRow,
				[colField]: draft,
			};

			// 상태 플래그 갱신
			const prevStatus = prevRow[STATUS_FIELD];
			if (prevStatus !== 'I' && prevStatus !== 'D') {
				nextRow[STATUS_FIELD] = 'U';
			}

			updated[realIndex] = nextRow;

			setInternalRows(updated);
			onRowsChange?.(updated);
			setEditCell(null);
		}

		function cancelEdit() {
			setEditCell(null);
		}

		// ===== Tab / Shift+Tab =====
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

			for (let c = colIndex + step; c >= 0 && c < effectiveColumns.length; c += step) {
				if (tryEnterAt(rowIndex, c)) return;
			}

			const nextRow = shift ? rowIndex - 1 : rowIndex + 1;
			if (nextRow < 0 || nextRow >= displayRows.length) {
				commitEdit();
				return;
			}

			if (shift) {
				for (let c = effectiveColumns.length - 1; c >= 0; c--) {
					if (tryEnterAt(nextRow, c)) return;
				}
			} else {
				for (let c = 0; c < effectiveColumns.length; c++) {
					if (tryEnterAt(nextRow, c)) return;
				}
			}

			commitEdit();
		}

		// ===== 정렬 토글 =====
		function handleHeaderClick(field: string) {
			setSortState(prev => nextSortState(prev, field));
		}

		// ===== 그리드 키 이벤트 (Undo/Redo/Copy/Paste) =====
		function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
			if (editCell) return;

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				if (e.shiftKey) {
					handleRedo();
				} else {
					handleUndo();
				}
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
				e.preventDefault();
				handleRedo();
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
				if (selectionRect) {
					e.preventDefault();
					copySelectionToClipboard(selectionRect, displayRows, effectiveColumns);
				}
				return;
			}

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

		// ===== 셀 클릭/더블클릭/키다운 =====
		function handleCellClick(e: React.MouseEvent<HTMLDivElement>, rowIndex: number, colIndex: number) {
			if (!editCell && gridRootRef.current) {
				gridRootRef.current.focus();
			}

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

			if (e.shiftKey && anchorCell) {
				const result = buildRectSelection(anchorCell, rowIndex, colIndex, displayRows, effectiveColumns, getRowKey);
				setActiveCell(clicked);
				setSelectedCells(result.selectedCells);
				setSelectionRect(result.rect);
				return;
			}

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

		function handleCellKeyDown(e: React.KeyboardEvent<HTMLDivElement>, rowIndex: number, colIndex: number) {
			const row = displayRows[rowIndex];
			const col = effectiveColumns[colIndex];
			const rowKeyVal = getRowKey(row);
			if (rowKeyVal === undefined) return;

			if (editCell && editCell.rowKey === rowKeyVal && editCell.colField === col.field) {
				return;
			}

			if (!col.editor || col.field === '__rowNum__') return;

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

		// === 선택/편집 상태 초기화 헬퍼 ===
		function clearSelectionState() {
			setActiveCell(null);
			setAnchorCell(null);
			setSelectedCells(new Set());
			setSelectionRect(null);
			setEditCell(null);
		}

		// ===== 내부용 행 추가 =====
		function internalAddRow(position: 'first' | 'last' | 'index' = 'last', options?: { index?: number; row?: any }) {
			pushHistoryBeforeChange();

			// 기본 newRow (일단 빈 객체, 나중에 status 컬럼 등 붙이기 좋게)
			const baseRow = options?.row ?? {};
			const withKey = ensureInternalKey(baseRow);

			const newRow = {
				...withKey,
				[STATUS_FIELD]: 'I', // 신규 행은 무조건 I
			};

			let insertIndex = internalRows.length;

			if (position === 'first') {
				insertIndex = 0;
			} else if (position === 'index') {
				if (typeof options?.index === 'number') {
					// 명시적인 index 가 있으면 우선
					insertIndex = Math.min(Math.max(options.index, 0), internalRows.length);
				} else if (activeCell) {
					// activeCell 기준으로 internalRows 인덱스 찾기
					const targetKey = activeCell.rowKey;
					const realIndex = internalRows.findIndex(r => getRowKey(r) === targetKey);
					insertIndex = realIndex >= 0 ? realIndex : internalRows.length;
				} else {
					// activeCell도 없고 index도 없음 → 마지막에
					insertIndex = internalRows.length;
				}
			} else {
				// 'last' 또는 undefined
				insertIndex = internalRows.length;
			}

			const next = [...internalRows];
			next.splice(insertIndex, 0, newRow);

			setInternalRows(next);
			onRowsChange?.(next);

			// 구조가 바뀌었으니 selection/편집 상태는 리셋
			clearSelectionState();
		}

		// ===== 내부용 단일 행 삭제 =====
		function internalRemoveRow(position: 'first' | 'last' | 'index' = 'last', options?: { index?: number }) {
			if (internalRows.length === 0) return;

			let removeIndex = internalRows.length - 1;

			if (position === 'first') {
				removeIndex = 0;
			} else if (position === 'index') {
				if (typeof options?.index === 'number') {
					removeIndex = Math.min(Math.max(options.index, 0), internalRows.length - 1);
				} else if (activeCell) {
					const targetKey = activeCell.rowKey;
					const realIndex = internalRows.findIndex(r => getRowKey(r) === targetKey);
					removeIndex = realIndex >= 0 ? realIndex : internalRows.length - 1;
				} else {
					removeIndex = internalRows.length - 1;
				}
			} else {
				// 'last' or undefined
				removeIndex = internalRows.length - 1;
			}

			if (removeIndex < 0 || removeIndex >= internalRows.length) return;

			pushHistoryBeforeChange();

			const targetRow = internalRows[removeIndex];
			const prevStatus = targetRow[STATUS_FIELD];

			let next: any[];

			if (prevStatus === 'I') {
				// 신규행은 그냥 제거 (서버에 D 안 보낼 거면 이렇게)
				next = internalRows.filter((_, idx) => idx !== removeIndex);
			} else {
				// 기존행은 D 로 마킹해서 내부에는 유지
				next = internalRows.map((row, idx) => (idx === removeIndex ? { ...row, [STATUS_FIELD]: 'D' } : row));
			}

			setInternalRows(next);
			onRowsChange?.(next);

			clearSelectionState();
		}

		// ===== 내부용 선택 행 삭제 (체크박스 기반) =====
		function internalRemoveSelectedRows() {
			if (checkedRowKeys.size === 0) return;

			pushHistoryBeforeChange();

			const next: any[] = [];

			for (const row of internalRows) {
				const key = getRowKey(row);
				if (key === undefined || !checkedRowKeys.has(key)) {
					// 체크 안된 행은 그대로 유지
					next.push(row);
					continue;
				}

				const prevStatus = row[STATUS_FIELD];

				if (prevStatus === 'I') {
					// 신규행은 완전 제거 → next 에 안 넣음
					continue;
				}

				// 기존행은 D로 마킹해서 next에 넣어둠
				next.push({
					...row,
					[STATUS_FIELD]: 'D',
				});
			}

			setInternalRows(next);
			onRowsChange?.(next);

			setCheckedRowKeys(new Set());
			clearSelectionState();
		}

		// ===== 내부용 그리드 리셋 =====
		function internalResetGrid(nextRows?: any[]) {
			const base = Array.isArray(nextRows) ? nextRows : [];
			const withKeys = attachInternalKeys(base);

			setInternalRows(withKeys);
			onRowsChange?.(withKeys);

			// 히스토리/선택/체크박스 다 리셋
			setUndoStack([]);
			setRedoStack([]);
			setCheckedRowKeys(new Set());
			clearSelectionState();
		}

		// ===== ref API =====
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

			// === 여기부터 새로 추가 ===
			addRow(position, options) {
				internalAddRow(position ?? 'last', options);
			},
			removeRow(position, options) {
				internalRemoveRow(position ?? 'last', options);
			},
			removeSelectedRows() {
				internalRemoveSelectedRows();
			},
			resetGrid(nextRows) {
				internalResetGrid(nextRows);
			},
			getInsertedRows() {
				return internalRows.filter(r => r[STATUS_FIELD] === 'I');
			},
			getUpdatedRows() {
				return internalRows.filter(r => r[STATUS_FIELD] === 'U');
			},
			getDeletedRows() {
				return internalRows.filter(r => r[STATUS_FIELD] === 'D');
			},
			getChangedRows() {
				return internalRows.filter(r => {
					const st = r[STATUS_FIELD];
					return st === 'I' || st === 'U' || st === 'D';
				});
			},
			getCheckedRows() {
				return internalRows.filter(r => {
					const rk = getRowKey(r);
					return rk != null && checkedRowKeys.has(rk);
				});
			},
			getSelectedRows() {
				const rowKeyStrings = new Set<string>();
				selectedCells.forEach(key => {
					const [rk] = key.split('::');
					if (rk && rk !== 'undefined') rowKeyStrings.add(rk);
				});
				return internalRows.filter(r => rowKeyStrings.has(String(getRowKey(r))));
			},
			getFocusedRows() {
				if (!activeCell) return [];
				const rk = activeCell.rowKey;
				return internalRows.filter(r => getRowKey(r) === rk);
			},
		}));

		// 컬럼 순서 초기화
		useEffect(() => {
			setColumnOrder(prev => {
				const base = columns.map(c => c.field);
				if (!prev) return base;

				const remained = prev.filter(f => base.includes(f));
				const added = base.filter(f => !remained.includes(f));
				return [...remained, ...added];
			});
		}, [columns]);

		const headerHeight = rowHeight;

		return (
			<div
				ref={gridRootRef}
				style={{
					display: 'flex',
					flexDirection: 'column',
					border: `1px solid ${border}`,
					backgroundColor: bodyBgA,
					color: 'var(--fg)',
					fontSize: 12,
					height,
					width: width ?? 'fit-content',
					overflow: 'hidden',
					borderRadius: 4,
				}}
				tabIndex={0}
				onKeyDown={handleGridKeyDown}
			>
				<div
					style={{
						flex: 1,
						overflowX,
						overflowY,
						position: 'relative',
					}}
				>
					<div
						style={{
							display: 'inline-block',
							minWidth: totalContentWidth,
							width: typeof width !== 'undefined' ? '100%' : undefined,
						}}
					>
						<OneGridHeader
							effectiveColumns={effectiveColumns}
							groupColumns={columns} // 원본 트리 기준으로 그룹 헤더 계산
							rowHeight={headerHeight}
							headerAlign={headerAlign}
							headerJustify={headerJustify}
							sortState={sortState}
							onToggleSort={handleHeaderClick}
							enableColumnReorder={enableColumnReorder}
							enableColumnResize={enableColumnResize}
							enableHeaderFilter={enableHeaderFilter}
							internalRows={internalRows}
							columnFilters={columnFilters}
							setColumnFilters={setColumnFilters}
							checkedRowKeys={checkedRowKeys}
							setCheckedRowKeys={setCheckedRowKeys}
							displayRows={displayRows}
							getRowKey={getRowKey}
							setColumnOrder={setColumnOrder}
							columnWidths={columnWidths}
							setColumnWidths={setColumnWidths}
							headerBg={headerBg}
							flexCount={flexCount}
						/>

						<OneGridBody
							effectiveColumns={effectiveColumns}
							displayRows={displayRows}
							rowHeight={rowHeight}
							flexCount={flexCount}
							columnWidths={columnWidths}
							getRowKey={getRowKey}
							selectedCells={selectedCells}
							activeCell={activeCell}
							editCell={editCell}
							draft={draft}
							setDraft={setDraft}
							checkedRowKeys={checkedRowKeys}
							setCheckedRowKeys={setCheckedRowKeys}
							onCellClick={handleCellClick}
							onCellDoubleClick={handleCellDoubleClick}
							onCellKeyDown={handleCellKeyDown}
							onCommitEdit={commitEdit}
							onCancelEdit={cancelEdit}
							onTabNav={moveEditByTab}
							bodyBgA={bodyBgA}
							bodyBgB={bodyBgB}
						/>
					</div>
				</div>
			</div>
		);
	},
);

export default OneGrid;
