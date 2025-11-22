// src/pages/TreeGridDemoPage.tsx
import React, { useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import type { OneGridColumn, OneGridHandle } from '../types/types';
import { createTreeColumns } from '../demo/demoColumns';
import { flattenTree } from '../utils/utilsTreeFlatten';
import { DEMO_TREE_NODES } from '../demo/demoRows';

const TreeGridDemoPage: React.FC = () => {
	// children 기반 계층 데이터 → 플랫 + _tree* 메타 필드
	const [rows, setRows] = useState<any[]>(() => flattenTree(DEMO_TREE_NODES));

	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = createTreeColumns();

	return (
		<div className="docs-main">
			{/* 상단 설명 영역 */}
			<section className="docs-section-header">
				<h1 className="docs-section-title">트리 그리드 데모</h1>
				<p className="docs-section-desc">
					서버에서 <code>children</code> 구조로 내려온 계층형 데이터를 OneGrid에 뿌리는 예제입니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						트리 컬럼에는 <code>isTreeColumn</code>, <code>treeIndent</code> 옵션을 설정해 들여쓰기와 폴더 아이콘/토글을
						표시합니다.
					</li>
					<li>
						상단 버튼으로 <code>Collapse All</code> / <code>Expand All</code> 을 제어합니다.
					</li>
				</ul>
			</section>

			{/* 그리드 영역 */}
			<section className="docs-panel">
				<div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
					<button
						type="button"
						onClick={() => {
							// 전체 접기
							setRows(prev => prev.map(r => (r._treeHasChildren ? { ...r, _treeExpanded: false } : r)));
						}}
					>
						Collapse All
					</button>
					<button
						type="button"
						onClick={() => {
							// 전체 펼치기
							setRows(prev => prev.map(r => (r._treeHasChildren ? { ...r, _treeExpanded: true } : r)));
						}}
					>
						Expand All
					</button>
				</div>

				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					width={'100%'}
					height={480}
					options={{
						rowHeight: 28,
						editable: true,
						showRowNumber: true,
						headerAlign: 'center',
						scroll: { x: 'auto', y: 'auto' },
						enableColumnReorder: false,
						enableColumnResize: true,
						enableHeaderFilter: false,
						showCheckBox: false,
						pagination: {
							mode: 'none', // 트리는 일단 전체 스크롤
						},
					}}
				/>
			</section>
		</div>
	);
};

export default TreeGridDemoPage;
