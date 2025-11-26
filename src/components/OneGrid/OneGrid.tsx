// src/components/OneGrid/OneGrid.tsx
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type {
	CellCoord,
	OneGridColumn,
	OneGridHandle,
	OneGridOptions,
	OneGridProps,
	ValidatorFn,
} from '../../types/types';

import { filterHiddenColumns, getFlexCount, injectRowNumberColumn } from './layout/columnLayout';

import { copySelectionToClipboard, pasteFromClipboard } from '../../utils/utilsClipboard';
import { cloneRows, rowsEqual } from '../../utils/utilsHistory';
import { buildRectSelection } from '../../utils/utilsSelection';
import { applySort, nextSortState } from '../../utils/utilsSort';

import type { SortState } from '../../utils/utilsSort';

import OneGridBody from './OneGridBody';
import OneGridHeader from './OneGridHeader';
import PagingButton from './pagination/PagingButtion';
import { runValidators } from './validator/validator';

// 색/스타일 상수 → CSS 변수 사용
const headerBg = 'var(--grid-header-bg)';
const bodyBgA = 'var(--grid-body-a)';
const bodyBgB = 'var(--grid-body-b)';
const border = 'var(--grid-border)';
const footerBg = 'var(--grid-footer-bg)';
const footerBorder = 'var(--grid-footer-border)';
const footerText = 'var(--grid-footer-fg)';
const footerButtonBg = 'var(--grid-footer-button-bg)';
const footerButtonFg = 'var(--grid-footer-button-fg)';
const footerButtonBorder = 'var(--grid-footer-button-border)';

const STATUS_FIELD = '__rowStatus__' as const; // '', 'I', 'U', 'D'
const INTERNAL_KEY_FIELD = '_onegridRowKey' as const;

const OneGrid = forwardRef<OneGridHandle, OneGridProps>(
	(
		{
			columns,
			rows,
			height = 300,
			width,
			options,
			onRowsChange,
			totalCount: externalTotalCount,
			currentPage: controlledPage,
			pageSize: controlledPageSize,
			onPageChange,
			onPageSizeChange,
		}: OneGridProps,
		ref,
	) => {
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
			pagination: paginationOptions = {},
		}: OneGridOptions = options ?? {};

		const paginationMode = paginationOptions.mode ?? 'none'; // 'none' | 'page' | 'scroll'
		const paginationType = paginationOptions.type ?? 'client'; // 'client' | 'server'
		const pageSizeOptions = paginationOptions.pageSizeOptions ?? [15, 30, 50, 100];

		const headerJustify: 'flex-start' | 'center' | 'flex-end' =
			headerAlign === 'right' ? 'flex-end' : headerAlign === 'center' ? 'center' : 'flex-start';

		const rowHeight = optRowHeight;
		const editableGrid = optEditable;
		const showRowNumber = optShowRowNumber;

		const defaultColWidth = 100;

		const overflowX = scroll?.x ?? 'auto';
		const overflowY = paginationMode === 'scroll' ? 'auto' : scroll?.y ?? 'auto';

		const gridRootRef = useRef<HTMLDivElement | null>(null);

		// ===== 내부 rowKey 관리 =====
		const autoIdCounterRef = useRef(0);

		function generateInternalKey(): string {
			if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
				return crypto.randomUUID();
			}
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

		// ===== 페이징 상태 =====
		const [innerPageSize, setInnerPageSize] = useState<number>(
			controlledPageSize ?? paginationOptions.defaultPageSize ?? 15,
		);
		const [innerPage, setInnerPage] = useState<number>(controlledPage ?? 1);
		const [pageInput, setPageInput] = useState<string>('1');

		// ===== 페이징/스크롤 상태 =====
		const [bodyScrollTop, setBodyScrollTop] = useState(0);
		const [bodyClientHeight, setBodyClientHeight] = useState(0);

		// 외부에서 pageSize, currentPage를 제어하는 경우 동기화
		useEffect(() => {
			if (controlledPageSize != null) {
				setInnerPageSize(controlledPageSize);
			}
		}, [controlledPageSize]);

		useEffect(() => {
			if (controlledPage != null) {
				setInnerPage(controlledPage);
			}
		}, [controlledPage]);

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

		// 트리 관련 설정 (트리 컬럼 / indent / rowMap)
		const treeColumn = useMemo(() => effectiveColumns.find(c => c.isTreeColumn), [effectiveColumns]);
		const treeIndent = treeColumn?.treeIndent ?? 16;
		const treeEnabled = !!treeColumn;

		const treeRowMap = useMemo(() => {
			if (!treeEnabled) return new Map<any, any>();
			const m = new Map<any, any>();
			internalRows.forEach(r => {
				if (r._treeId !== undefined) {
					m.set(r._treeId, r);
				}
			});
			return m;
		}, [internalRows, treeEnabled]);

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

		// ===== 정렬 적용 (전체 정렬 결과) =====
		const sortedRows = useMemo(() => applySort(filteredRows, sortState), [filteredRows, sortState]);

		// 트리 확장 상태 적용 (조상 중 _treeExpanded === false 인 노드는 숨김)
		const treeVisibleRows = useMemo(() => {
			if (!treeEnabled) return sortedRows;

			return sortedRows.filter(row => {
				let parentId = row._treeParentId;
				while (parentId != null && parentId !== '') {
					const parent = treeRowMap.get(parentId);
					if (!parent) break;
					if (parent._treeExpanded === false) {
						return false;
					}
					parentId = parent._treeParentId;
				}
				return true;
			});
		}, [sortedRows, treeEnabled, treeRowMap]);

		// ===== 페이징 계산 =====
		const clientTotalCount = treeVisibleRows.length;

		// pageSize
		const effectivePageSize =
			paginationMode === 'none'
				? controlledPageSize ?? innerPageSize
				: Math.max(1, controlledPageSize ?? innerPageSize);

		// totalCount (server 모드면 외부 total 우선)
		const totalCount = externalTotalCount ?? clientTotalCount;

		// 전체 페이지 수
		const pageCount = paginationMode === 'none' ? 1 : Math.max(1, Math.ceil(totalCount / (effectivePageSize || 1)));

		// 현재 페이지 (내부/외부 제어 통합)
		const effectivePage = paginationMode === 'none' ? 1 : Math.min(Math.max(controlledPage ?? innerPage, 1), pageCount);

		useEffect(() => {
			if (paginationMode === 'page') {
				setPageInput(String(effectivePage));
			}
		}, [paginationMode, effectivePage]);

		// rows 변화 시 페이지가 범위를 벗어나면 보정
		useEffect(() => {
			if (paginationMode === 'none') return;
			const maxPage = Math.max(1, Math.ceil(totalCount / (effectivePageSize || 1)));
			if (innerPage > maxPage && controlledPage == null) {
				setInnerPage(maxPage);
			}
		}, [totalCount, effectivePageSize, paginationMode, innerPage, controlledPage]);

		// 실제 그리드에 뿌릴 displayRows (페이징 적용)
		const displayRows = useMemo(() => {
			// 버튼 페이징
			if (paginationMode === 'page') {
				if (paginationType === 'client') {
					const start = (effectivePage - 1) * effectivePageSize;
					const end = start + effectivePageSize;
					return treeVisibleRows.slice(start, end);
				}
				// server 모드: 이미 서버에서 page 단위 rows를 내려줬다고 가정
				return treeVisibleRows;
			}

			// 스크롤 페이징 (무한 스크롤 느낌)
			if (paginationMode === 'scroll') {
				if (paginationType === 'client') {
					// n페이지까지의 데이터를 잘라서 보여줌
					const end = effectivePage * effectivePageSize;
					return treeVisibleRows.slice(0, end);
				}
				// server 모드: 외부에서 rows를 계속 append 해온다고 가정
				return treeVisibleRows;
			}

			// 페이징 없음
			return treeVisibleRows;
		}, [treeVisibleRows, paginationMode, paginationType, effectivePage, effectivePageSize]);

		// ===== 히스토리 =====
		function pushHistoryBeforeChange() {
			setUndoStack(prev => {
				const next = [...prev, cloneRows(internalRows)];
				return next.length > 20 ? next.slice(next.length - 20) : next;
			});
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

		// 트리 행 확장/접기
		function toggleTreeRow(row: any) {
			if (!treeEnabled) return;
			const targetId = row._treeId;
			if (targetId == null) return;

			pushHistoryBeforeChange();

			const next = internalRows.map(r =>
				r._treeId === targetId
					? {
							...r,
							_treeExpanded: r._treeExpanded === false, // undefined/true → false, false → true
					  }
					: r,
			);

			setInternalRows(next);
			onRowsChange?.(next);
		}

		// === 트리 드래그&드롭 처리 ===
		function handleTreeRowDrop(
			sourceRowKey: string | number,
			targetRowKey: string | number | null,
			mode: 'before' | 'after' | 'child',
		) {
			if (!treeEnabled) return;

			pushHistoryBeforeChange();

			// 1) 이동할 블록(source + 서브트리) 찾기
			const srcIndex = internalRows.findIndex(r => getRowKey(r) === sourceRowKey);
			if (srcIndex < 0) return;

			const srcRow = internalRows[srcIndex];
			const srcLevel = srcRow._treeLevel ?? 0;

			const movingBlock: any[] = [];
			movingBlock.push(srcRow);

			let endIndex = srcIndex + 1;
			while (endIndex < internalRows.length) {
				const cand = internalRows[endIndex];
				const lvl = cand._treeLevel ?? 0;
				// 원래 루트보다 깊은 애들은 서브트리로 같이 이동
				if (lvl > srcLevel) {
					movingBlock.push(cand);
					endIndex++;
				} else {
					break;
				}
			}

			let next = [...internalRows];
			// 원래 자리에서 블록 삭제
			next.splice(srcIndex, movingBlock.length);

			// 2) 타겟/부모/레벨 계산
			let targetIndex = -1;
			let targetRow: any | null = null;

			if (targetRowKey != null) {
				targetIndex = next.findIndex(r => getRowKey(r) === targetRowKey);
				if (targetIndex < 0) return;
				targetRow = next[targetIndex];
			}

			let insertIndex = 0;
			let newParentId: any = null;
			let newLevel = 0;

			if (!targetRow) {
				// 루트 맨 아래로
				insertIndex = next.length;
				newParentId = null;
				newLevel = 0;
			} else if (mode === 'child') {
				// 자식으로
				insertIndex = targetIndex + 1;
				newParentId = targetRow._treeId;
				newLevel = (targetRow._treeLevel ?? 0) + 1;

				targetRow._treeHasChildren = true;
				targetRow._treeExpanded = true;
			} else {
				// 형제(before/after)
				newParentId = targetRow._treeParentId ?? null;
				newLevel = targetRow._treeLevel ?? 0;
				insertIndex = mode === 'before' ? targetIndex : targetIndex + 1;
			}

			// 3) 레벨 보정
			const levelDelta = newLevel - srcLevel;

			const updatedBlock = movingBlock.map((r, idx) => {
				if (idx === 0) {
					return {
						...r,
						_treeParentId: newParentId,
						_treeLevel: newLevel,
					};
				}
				return {
					...r,
					_treeLevel: (r._treeLevel ?? 0) + levelDelta,
				};
			});

			// 4) 새 위치에 삽입
			next.splice(insertIndex, 0, ...updatedBlock);

			// 5) _treeHasChildren 재계산
			const idSet = new Set(next.map(r => r._treeId));
			const hasChildMap = new Map<any, boolean>();
			next.forEach(r => {
				const pid = r._treeParentId;
				if (pid != null && idSet.has(pid)) {
					hasChildMap.set(pid, true);
				}
			});

			next = next.map(r => ({
				...r,
				_treeHasChildren: !!hasChildMap.get(r._treeId),
			}));

			setInternalRows(next);
			onRowsChange?.(next);
		}

		// ===== 셀 검증 =====
		function getColumnValidators(col: OneGridColumn): ValidatorFn[] | undefined {
			const v = col.validators;
			if (!v) return undefined;
			return Array.isArray(v) ? v : [v];
		}

		// 지금 편집 중인 셀 값(draft)이 유효한지 체크
		function canLeaveCurrentEditCell(): boolean {
			if (!editCell) return true;

			const col = effectiveColumns[editCell.colIndex];
			if (!col) return true;

			const validators = getColumnValidators(col);
			if (!validators || validators.length === 0) return true;

			const msg = runValidators(validators, draft);
			// msg가 있으면 검증 실패 → 이동하면 안 됨
			return !msg;
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
				const ok = canLeaveCurrentEditCell();
				if (!ok) {
					// 검증 실패하면 commit 안 하고, 셀 이동도 막음
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				// 검증 통과할 때만 진짜 commit
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

		// ===== 페이지 변경 헬퍼 =====
		function changePage(nextPageRaw: number) {
			if (paginationMode === 'none') return;

			const nextPage = Math.min(Math.max(nextPageRaw, 1), pageCount);
			if (nextPage === effectivePage) return;

			if (controlledPage == null) {
				setInnerPage(nextPage);
			}

			setPageInput(String(nextPage));

			onPageChange?.(nextPage, effectivePageSize);
			clearSelectionState();
		}

		function changePageSize(nextSizeRaw: number) {
			if (paginationMode === 'none') return;

			const nextSize = Math.max(1, nextSizeRaw);

			if (controlledPageSize == null) {
				setInnerPageSize(nextSize);
				setInnerPage(1);
			}

			onPageSizeChange?.(nextSize);
			clearSelectionState();
		}

		// ===== 스크롤 페이징 (scroll mode) =====
		function handleScroll(e: React.UIEvent<HTMLDivElement>) {
			const target = e.currentTarget;
			const { scrollTop, clientHeight, scrollHeight } = target;

			setBodyScrollTop(scrollTop);
			setBodyClientHeight(clientHeight);

			if (paginationMode !== 'scroll') return;

			if (scrollTop + clientHeight >= scrollHeight - 1) {
				const nextPage = effectivePage + 1;
				if (nextPage <= pageCount) {
					changePage(nextPage);
				}
			}
		}

		// ===== 내부용 행 추가 =====
		function internalAddRow(position: 'first' | 'last' | 'index' = 'last', options?: { index?: number; row?: any }) {
			pushHistoryBeforeChange();

			const baseRow = options?.row ?? {};
			const withKey = ensureInternalKey(baseRow);

			const newRow = {
				...withKey,
				[STATUS_FIELD]: 'I',
			};

			let insertIndex = internalRows.length;

			if (position === 'first') {
				insertIndex = 0;
			} else if (position === 'index') {
				if (typeof options?.index === 'number') {
					insertIndex = Math.min(Math.max(options.index, 0), internalRows.length);
				} else if (activeCell) {
					const targetKey = activeCell.rowKey;
					const realIndex = internalRows.findIndex(r => getRowKey(r) === targetKey);
					insertIndex = realIndex >= 0 ? realIndex : internalRows.length;
				} else {
					insertIndex = internalRows.length;
				}
			} else {
				insertIndex = internalRows.length;
			}

			const next = [...internalRows];
			next.splice(insertIndex, 0, newRow);

			setInternalRows(next);
			onRowsChange?.(next);

			clearSelectionState();
		}

		// ===== 내부용 단일 행 삭제 =====
		function internalRemoveRow(position: 'first' | 'last' | 'index' = 'last', options?: { index?: number }) {
			if (internalRows.length === 0) return;

			let targetRowKey: string | number | undefined;

			if (position === 'first') {
				const firstVisible = filteredRows[0];
				if (!firstVisible) return;
				targetRowKey = getRowKey(firstVisible);
			} else if (position === 'last') {
				const lastVisible = filteredRows[filteredRows.length - 1];
				if (!lastVisible) return;
				targetRowKey = getRowKey(lastVisible);
			} else if (position === 'index') {
				if (typeof options?.index === 'number') {
					const visibleRow = filteredRows[options.index];
					if (visibleRow) {
						targetRowKey = getRowKey(visibleRow);
					}
				} else if (activeCell) {
					targetRowKey = activeCell.rowKey;
				} else {
					const lastVisible = filteredRows[filteredRows.length - 1];
					if (!lastVisible) return;
					targetRowKey = getRowKey(lastVisible);
				}
			} else {
				const lastVisible = filteredRows[filteredRows.length - 1];
				if (!lastVisible) return;
				targetRowKey = getRowKey(lastVisible);
			}

			if (!targetRowKey) return;

			const removeIndex = internalRows.findIndex(r => getRowKey(r) === targetRowKey);
			if (removeIndex < 0) return;

			pushHistoryBeforeChange();

			const targetRow = internalRows[removeIndex];
			const prevStatus = targetRow[STATUS_FIELD];

			let next: any[];

			if (prevStatus === 'I') {
				next = internalRows.filter((_, idx) => idx !== removeIndex);
			} else {
				next = internalRows.map((row, idx) =>
					idx === removeIndex
						? {
								...row,
								[STATUS_FIELD]: 'D',
						  }
						: row,
				);
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
					next.push(row);
					continue;
				}

				const prevStatus = row[STATUS_FIELD];

				if (prevStatus === 'I') {
					continue;
				}

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

			getPageInfo() {
				return {
					currentPage: effectivePage,
					pageSize: effectivePageSize,
					totalCount,
					pageCount,
				};
			},

			gotoPage(page: number) {
				changePage(page);
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
						minHeight: 0,
						overflowX,
						overflowY,
						position: 'relative',
					}}
					onScroll={handleScroll}
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
							groupColumns={columns}
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
							scrollTop={bodyScrollTop}
							clientHeight={bodyClientHeight}
							treeEnabled={treeEnabled}
							treeIndent={treeIndent}
							onToggleTreeRow={toggleTreeRow}
							onTreeRowDrop={handleTreeRowDrop}
						/>
					</div>
				</div>
				{paginationMode === 'page' && (
					<div
						style={{
							borderTop: `1px solid ${footerBorder}`,
							padding: '4px 8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							fontSize: 12,
							backgroundColor: footerBg,
							color: footerText,
							gap: 8,
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<span style={{ opacity: 0.8 }}>Rows / page</span>
							<select
								value={effectivePageSize}
								onChange={e => changePageSize(Number(e.target.value))}
								style={{
									padding: '0 4px',
									height: 22,
									borderRadius: 4,
									border: `1px solid ${footerButtonBorder}`,
									backgroundColor: footerButtonBg,
									color: footerButtonFg,
									fontSize: 12,
								}}
							>
								{pageSizeOptions.map(size => (
									<option key={size} value={size}>
										{size}
									</option>
								))}
							</select>
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<span>Page</span>
							<input
								type="number"
								min={1}
								max={pageCount}
								value={pageInput}
								onChange={e => setPageInput(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										const n = Number(pageInput);
										if (!Number.isNaN(n) && n >= 1 && n <= pageCount) {
											changePage(n);
										}
									}
								}}
								style={{
									width: 40,
									height: 22,
									borderRadius: 4,
									border: `1px solid ${footerButtonBorder}`,
									backgroundColor: 'transparent',
									color: footerButtonFg,
									textAlign: 'center',
									fontSize: 12,
								}}
							/>
							<span style={{ opacity: 0.7 }}>/ {pageCount}</span>
							<span style={{ opacity: 0.7, marginLeft: 8 }}>Total {totalCount.toLocaleString()}</span>
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<PagingButton disabled={effectivePage <= 1} onClick={() => changePage(1)}>
								⏮
							</PagingButton>
							<PagingButton disabled={effectivePage <= 1} onClick={() => changePage(effectivePage - 1)}>
								◀
							</PagingButton>
							<PagingButton disabled={effectivePage >= pageCount} onClick={() => changePage(effectivePage + 1)}>
								▶
							</PagingButton>
							<PagingButton disabled={effectivePage >= pageCount} onClick={() => changePage(pageCount)}>
								⏭
							</PagingButton>
						</div>
					</div>
				)}
			</div>
		);
	},
);

export default OneGrid;
