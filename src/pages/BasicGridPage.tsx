// src/pages/BasicGridPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createBasicColumns } from '../types/demoColumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const BasicGridPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createBasicColumns(setRows), [setRows]);

	return (
		<div className="docs-main">
			{/* 상단 설명 영역 */}
			<section className="docs-section-header">
				<h1 className="docs-section-title">기본 출력</h1>
				<p className="docs-section-desc">
					가장 기본적인 사용 예제입니다.
					<br />
					<code>columns</code>, <code>rows</code>, <code>rowKeyField</code> 만으로 데이터를 출력하는 방법을 보여줍니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						행 키는 <code>rowKeyField="id"</code> 를 사용합니다.
					</li>
					<li>기본 정렬 / 선택 / 편집 기능은 최소 옵션으로 동작합니다.</li>
				</ul>
			</section>

			{/* 그리드 박스 */}
			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					rowKeyField="id"
					width={'100%'}
					height={400}
					options={{
						rowHeight: 35,
						editable: false,
						headerAlign: 'center',
					}}
				/>
			</section>
		</div>
	);
};

export default BasicGridPage;
