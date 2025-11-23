// src/pages/TreeGridDemoPage.tsx
import React, { useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import type { OneGridColumn, OneGridHandle } from '../types/types';
import { createTreeColumns } from '../demo/demoColumns';
import { flattenTree } from '../utils/utilsTreeFlatten';
import { DEMO_TREE_NODES, type DemoTreeNode } from '../demo/demoRows';

// flat → children 구조로 다시 되돌리는 헬퍼
function unflattenTree(flatRows: any[]): DemoTreeNode[] {
	const nodeMap = new Map<string, DemoTreeNode>();
	const roots: DemoTreeNode[] = [];

	flatRows.forEach(r => {
		// flattenTree에서 _treeId, _treeParentId 를 넣어줬다고 가정
		const node: DemoTreeNode = {
			id: r.id,
			taskId: r.taskId,
			taskName: r.taskName,
			charge: r.charge,
			complete: r.complete,
			startDate: r.startDate,
			endDate: r.endDate,
			children: [],
		};
		nodeMap.set(r._treeId ?? r.id, node);
	});

	flatRows.forEach(r => {
		const key = r._treeId ?? r.id;
		const node = nodeMap.get(key);
		if (!node) return;
		const pid = r._treeParentId;
		if (!pid) {
			roots.push(node);
		} else {
			const parent = nodeMap.get(pid);
			if (parent) {
				if (!parent.children) parent.children = [];
				parent.children.push(node);
			} else {
				roots.push(node);
			}
		}
	});

	return roots;
}

const TreeGridDemoPage: React.FC = () => {
	// children 기반 계층 데이터 → 플랫 + _tree* 메타 필드
	const [rows, setRows] = useState<any[]>(() => flattenTree(DEMO_TREE_NODES));

	// 트리 이동 전/후 비교용 JSON
	const [beforeTreeJson, setBeforeTreeJson] = useState<DemoTreeNode[]>(() => DEMO_TREE_NODES);
	const [afterTreeJson, setAfterTreeJson] = useState<DemoTreeNode[]>(() => DEMO_TREE_NODES);

	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = createTreeColumns();

	// 그리드에서 rows 변경 콜백
	const handleRowsChange = (next: any[]) => {
		// 이전 rows 를 children 구조로 변환 → before
		setBeforeTreeJson(unflattenTree(rows));
		// 새 rows 를 children 구조로 변환 → after
		setAfterTreeJson(unflattenTree(next));
		setRows(next);
	};

	return (
		<div className="docs-main">
			{/* 상단 설명 영역 */}
			<section className="docs-section-header">
				<h1 className="docs-section-title">트리 그리드 데모</h1>
				<p className="docs-section-desc">
					서버에서 <code>children</code> 구조로 내려온 계층형 데이터를 OneGrid에 뿌리고, 드래그&amp;드롭으로 부모/자식
					구조를 바꾸는 예제입니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						트리 컬럼에는 <code>isTreeColumn</code>, <code>treeIndent</code> 옵션을 설정해 들여쓰기와 폴더 아이콘/토글을
						표시합니다.
					</li>
					<li>
						행을 마우스로 드래그해서 같은 레벨로 옮기면 형제 순서가 변경되고, 행 중앙 영역에 드롭하면 해당 행의{' '}
						<strong>자식</strong>으로 들어갑니다.
					</li>
					<li>
						행 바깥(빈 영역)에 드롭하면 <strong>루트 레벨</strong>로 빠져나옵니다.
					</li>
					<li>
						트리 이동이 일어날 때마다 아래의 <code>JSON Before / JSON After</code> 영역에 children 구조가 갱신됩니다.
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
							mode: 'none',
						},
					}}
					onRowsChange={handleRowsChange}
				/>
			</section>

			{/* JSON Before / After 비교 영역 */}
			<section className="docs-panel" style={{ marginTop: 16 }}>
				<h2 className="docs-section-title" style={{ marginBottom: 8 }}>
					트리 구조 JSON 비교
				</h2>
				<p className="docs-section-desc" style={{ marginBottom: 12 }}>
					드래그&amp;드롭으로 트리 구조를 변경할 때마다, children 기반 트리 구조가 이동 전/이동 후로 표시됩니다.
				</p>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: 12,
					}}
				>
					<div>
						<div style={{ fontWeight: 600, marginBottom: 4 }}>Before (이동 전)</div>
						<pre
							style={{
								height: 260,
								overflow: 'auto',
								padding: 8,
								borderRadius: 4,
								border: '1px solid var(--grid-border)',
								backgroundColor: 'var(--bg)',
								fontSize: 11,
							}}
						>
							{JSON.stringify(beforeTreeJson, null, 2)}
						</pre>
					</div>

					<div>
						<div style={{ fontWeight: 600, marginBottom: 4 }}>After (이동 후)</div>
						<pre
							style={{
								height: 260,
								overflow: 'auto',
								padding: 8,
								borderRadius: 4,
								border: '1px solid var(--grid-border)',
								backgroundColor: 'var(--bg)',
								fontSize: 11,
							}}
						>
							{JSON.stringify(afterTreeJson, null, 2)}
						</pre>
					</div>
				</div>
			</section>
		</div>
	);
};

export default TreeGridDemoPage;
