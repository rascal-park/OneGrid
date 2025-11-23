// src/pages/PaginationDemoPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createEditorColumns } from '../demo/demoColumns';
import { DEMO_ROWS } from '../demo/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

type PaginationMode = 'none' | 'page' | 'scroll';

const PaginationDemoPage: React.FC = () => {
	const gridRef = useRef<OneGridHandle | null>(null);

	// 데모용으로 rows 좀 늘려주기
	const [rows, setRows] = useState(() => {
		const result: any[] = [];
		for (let i = 0; i < 500; i += 1) {
			DEMO_ROWS.forEach((r, idx) => {
				result.push({
					...r,
					// id 값만 약간 수정,
					id: `${r.id}-${i}-${idx}`,
				});
			});
		}
		return result;
	});

	const columns: OneGridColumn[] = useMemo(() => createEditorColumns(setRows), [setRows]);

	const [mode, setMode] = useState<PaginationMode>('page');
	const [pageInfo, setPageInfo] = useState<any | null>(null);

	const handleRefreshPageInfo = () => {
		const api = gridRef.current;
		if (!api) return;
		setPageInfo(api.getPageInfo());
	};

	const handlePageChange = (page: number, pageSize: number) => {
		console.log('[PaginationDemo] onPageChange', { page, pageSize });
		// 지금은 클라이언트 페이징이니까 rows는 그대로 두고,
		// 서버 페이징으로 바꾸면 여기서 API 호출해서 setRows 해주면 됨.
	};

	const handlePageSizeChange = (pageSize: number) => {
		console.log('[PaginationDemo] onPageSizeChange', { pageSize });
	};

	useEffect(() => {
		// scroll/page로 바뀔 때는 항상 1페이지부터 시작하도록
		gridRef.current?.gotoPage?.(1);
	}, [mode]);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">페이징 데모</h1>
				<p className="docs-section-desc">
					OneGrid의 <code>pagination.mode</code>에 따라
					<br />
					<strong>버튼 페이징 / 스크롤 페이징 / 페이징 없음</strong> 모드를 테스트하는 페이지입니다.
				</p>
			</section>

			<section className="docs-panel" style={{ marginBottom: 12 }}>
				<div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
					<div>
						<strong>Pagination Mode: </strong>
						<label style={{ marginRight: 8 }}>
							<input type="radio" name="pg-mode" checked={mode === 'none'} onChange={() => setMode('none')} /> none
						</label>
						<label style={{ marginRight: 8 }}>
							<input type="radio" name="pg-mode" checked={mode === 'page'} onChange={() => setMode('page')} /> page
							(버튼 페이징)
						</label>
						<label>
							<input type="radio" name="pg-mode" checked={mode === 'scroll'} onChange={() => setMode('scroll')} />{' '}
							scroll (스크롤 페이징)
						</label>
					</div>

					<button type="button" onClick={handleRefreshPageInfo}>
						현재 페이지 정보 가져오기 (getPageInfo)
					</button>
				</div>

				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					width="100%"
					height={420}
					options={{
						rowHeight: 32,
						editable: true,
						showRowNumber: true,
						showCheckBox: true,
						headerAlign: 'center',
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
						pagination: {
							mode, // 'none' | 'page' | 'scroll'
							type: 'client', // 지금은 프론트 페이징
							defaultPageSize: 15,
							pageSizeOptions: [15, 30, 50, 100],
						},
					}}
					onRowsChange={setRows}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
					// totalCount / currentPage / pageSize 는 지금은 내부 상태로 관리
				/>
			</section>

			<section className="docs-panel">
				<h2 className="docs-section-title" style={{ fontSize: 16, marginBottom: 8 }}>
					현재 페이지 정보 (getPageInfo 결과)
				</h2>
				<pre
					style={{
						margin: 0,
						padding: 12,
						backgroundColor: 'var(--bg)',
						borderRadius: 4,
						fontSize: 12,
						maxHeight: 220,
						overflow: 'auto',
						whiteSpace: 'pre-wrap',
					}}
				>
					{pageInfo ? JSON.stringify(pageInfo, null, 2) : '// 상단의 "현재 페이지 정보 가져오기" 버튼을 눌러보세요.'}
				</pre>
			</section>
		</div>
	);
};

export default PaginationDemoPage;
