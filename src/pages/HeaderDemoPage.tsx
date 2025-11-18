import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createQuarterGroupColumns } from '../types/demoColumns';
import { DEMO_QUARTER_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const HeaderDemoPage: React.FC = () => {
	const [rows] = useState(DEMO_QUARTER_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createQuarterGroupColumns(), []);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">그룹 헤더 데모</h1>
				<p className="docs-section-desc">
					<code>children</code> 속성을 이용해서 AUI Grid 처럼 다단 헤더(년도 &gt; 분기 &gt; 월)를 구성한 예제입니다.
				</p>
			</section>

			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					rowKeyField="id"
					width={'100%'}
					height={350}
					options={{
						rowHeight: 30,
						editable: false,
						headerAlign: 'center',
						showRowNumber: true,
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
				/>
			</section>
		</div>
	);
};

export default HeaderDemoPage;
