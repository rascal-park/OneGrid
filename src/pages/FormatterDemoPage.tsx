// src/pages/FormatterDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createFormatterColumns } from '../types/demoCloumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const FormatterDemoPage: React.FC = () => {
	const [rows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = useMemo(() => createFormatterColumns(() => {}), []);

	return (
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: 16 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>포매터 데모</h1>
				<p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
					원본 값은 그대로 두고 화면에 표시되는 값만 바꾸는 <code>formatter</code> 예제입니다.
				</p>
				<ul style={{ fontSize: 12, color: '#bbb', marginTop: 8, paddingLeft: 16 }}>
					<li>
						<code>num</code> : 1000000 → &quot;1,000,000원&quot;
					</li>
					<li>
						<code>birth</code> : &quot;2025-01-10&quot; → &quot;2025/01/10&quot;
					</li>
				</ul>
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
					height={400}
					width={'100%'}
					options={{
						rowHeight: 35,
						editable: false,
						showRowNumber: true,
						headerAlign: 'center',
					}}
				/>
			</div>
		</div>
	);
};

export default FormatterDemoPage;
