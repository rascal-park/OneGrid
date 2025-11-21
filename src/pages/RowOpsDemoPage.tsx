// src/pages/RowOpsDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createEditorColumns } from '../demo/demoColumns';
import { DEMO_ROWS } from '../demo/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

interface ViewResult {
	title: string;
	payload: any;
}

const RowOpsDemoPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createEditorColumns(setRows), [setRows]);

	// 어떤 버튼의 결과를 보고 있는지 + 실제 데이터
	const [viewResult, setViewResult] = useState<ViewResult | null>(null);

	const showResult = (title: string, payload: any) => {
		setViewResult({
			title,
			payload,
		});
	};

	// === 행 추가 ===
	const handleAddFirst = () => {
		gridRef.current?.addRow?.('first');
		// 행 구조가 바뀌면 전체 변경내역도 같이 보고 싶으면:
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	const handleAddLast = () => {
		gridRef.current?.addRow?.('last');
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	const handleAddAtActive = () => {
		gridRef.current?.addRow?.('index');
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	// === 행 삭제 ===
	const handleRemoveFirst = () => {
		gridRef.current?.removeRow?.('first');
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	const handleRemoveLast = () => {
		gridRef.current?.removeRow?.('last');
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	const handleRemoveAtActive = () => {
		gridRef.current?.removeRow?.('index');
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	const handleRemoveSelectedRows = () => {
		gridRef.current?.removeSelectedRows?.();
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	// === 초기화 ===
	const handleResetEmpty = () => {
		gridRef.current?.resetGrid?.([]);
		setRows([]);
		setViewResult({
			title: 'resetGrid([])',
			payload: [],
		});
	};

	const handleResetWithDemo = () => {
		gridRef.current?.resetGrid?.(DEMO_ROWS);
		setRows(DEMO_ROWS);
		setViewResult({
			title: 'resetGrid(DEMO_ROWS)',
			payload: DEMO_ROWS,
		});
	};

	// === 변경 내역 모아보기 ===
	const handleShowChanged = () => {
		const changed = gridRef.current?.getChangedRows?.() ?? [];
		showResult('getChangedRows()', changed);
	};

	// === CUD GET ROWS ===
	const handleInsertRows = () => {
		const data = gridRef.current?.getInsertedRows?.() ?? [];
		showResult('getInsertedRows()', data);
	};

	const handleUpdateRows = () => {
		const data = gridRef.current?.getUpdatedRows?.() ?? [];
		showResult('getUpdatedRows()', data);
	};

	const handleDeletedRows = () => {
		const data = gridRef.current?.getDeletedRows?.() ?? [];
		showResult('getDeletedRows()', data);
	};

	const handleGetCheckedRows = () => {
		const data = gridRef.current?.getCheckedRows?.() ?? [];
		showResult('getCheckedRows()', data);
	};

	const handleSelectedRows = () => {
		const data = gridRef.current?.getSelectedRows?.() ?? [];
		showResult('getSelectedRows()', data);
	};

	const handleGetFocusedRows = () => {
		const data = gridRef.current?.getFocusedRows?.() ?? [];
		showResult('getFocusedRows()', data);
	};

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">행 추가/삭제 & 변경 내역 데모</h1>
				<p className="docs-section-desc">
					<code>addRow</code>, <code>removeRow</code>, <code>resetGrid</code>, <code>removeSelectedRows</code>,{' '}
					<code>getChangedRows</code> 및 각종 <code>getXXXRows</code> 결과를 테스트하는 페이지입니다.
				</p>
			</section>

			<section className="docs-panel" style={{ marginBottom: 10 }}>
				{/* 1줄차: 행 추가/삭제/초기화 */}
				<div className="docs-toolbar" style={{ marginBottom: 5 }}>
					{/* 추가 */}
					<button type="button" className="docs-btn-sm" onClick={handleAddFirst}>
						＋ 첫 행 추가
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleAddLast}>
						＋ 마지막 행 추가
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleAddAtActive}>
						＋ 선택 위치에 추가(index)
					</button>

					{/* 삭제 */}
					<button type="button" className="docs-btn-sm" onClick={handleRemoveFirst}>
						－ 첫 행 삭제
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleRemoveLast}>
						－ 마지막 행 삭제
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleRemoveAtActive}>
						－ 선택 위치 삭제(index)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleRemoveSelectedRows}>
						－ 선택(체크박스) 행 삭제
					</button>

					{/* 초기화 */}
					<button type="button" className="docs-btn-sm" onClick={handleResetEmpty}>
						⟳ 초기화 (빈 그리드)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleResetWithDemo}>
						⟳ 초기화 (DEMO_ROWS)
					</button>
				</div>

				{/* 2줄차: CUD/선택 상태 조회 버튼 */}
				<div className="docs-toolbar" style={{ marginBottom: 8 }}>
					<button type="button" className="docs-btn-sm" onClick={handleInsertRows}>
						신규 행 보기 (getInsertedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleUpdateRows}>
						수정 행 보기 (getUpdatedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleDeletedRows}>
						삭제 행 보기 (getDeletedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleGetCheckedRows}>
						체크 행 보기 (getCheckedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleSelectedRows}>
						선택 행 보기 (getSelectedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleGetFocusedRows}>
						포커스 행 보기 (getFocusedRows)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleShowChanged}>
						변경 내역 보기 (getChangedRows)
					</button>
				</div>

				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					width={'100%'}
					height={450}
					options={{
						rowHeight: 32,
						editable: true,
						showRowNumber: true,
						showCheckBox: true,
						headerAlign: 'center',
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
					onRowsChange={setRows}
				/>
			</section>

			<section className="docs-panel">
				<h2 className="docs-section-title" style={{ fontSize: 16, marginBottom: 8 }}>
					변경 내역 / 조회 결과
				</h2>
				<p className="docs-section-desc" style={{ marginBottom: 8 }}>
					위 버튼을 누르면 해당 API의 결과가 아래에 JSON으로 표시됩니다.
				</p>
				<pre
					style={{
						margin: 0,
						padding: 12,
						backgroundColor: 'var(--bg)',
						borderRadius: 4,
						fontSize: 12,
						maxHeight: 260,
						overflow: 'auto',
						whiteSpace: 'pre-wrap',
					}}
				>
					{viewResult
						? `// ${viewResult.title}\n${JSON.stringify(viewResult.payload, null, 2)}`
						: '// 버튼을 눌러 결과를 확인하세요.'}
				</pre>
			</section>
		</div>
	);
};

export default RowOpsDemoPage;
