// src/pages/HeaderGroupDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createQuarterGroupColumns } from '../types/demoColumns';

import { DEMO_QUARTER_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const HeaderGroupDemoPage: React.FC = () => {
	const [rows] = useState(DEMO_QUARTER_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createQuarterGroupColumns(), []);

	return (
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: 16 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>그룹 헤더 데모</h1>
				<p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
					<code>children</code> 속성을 이용해서 AUI Grid 처럼 다단 헤더(년도 &gt; 분기 &gt; 월)를 구성한 예제입니다.
				</p>
			</div>

			<div
				style={{
					backgroundColor: '#2a2a2a',
					border: '1px solid #444',
					borderRadius: 6,
					padding: 16,
				}}
			>
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
						// 그룹 헤더에서는 일단 컬럼 드래그는 끄는 걸 추천
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
				/>
			</div>
		</div>
	);
};

export default HeaderGroupDemoPage;
