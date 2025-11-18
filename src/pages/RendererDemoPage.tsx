// src/pages/RendererDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createRendererColumns } from '../types/demoColumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const RendererDemoPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createRendererColumns(setRows), [setRows]);

	return (
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: 16 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>렌더러 데모</h1>
				<p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
					셀을 어떻게 그릴지 결정하는 <code>renderer</code> 예제입니다.
				</p>
				<ul style={{ fontSize: 12, color: '#bbb', marginTop: 8, paddingLeft: 16 }}>
					<li>
						<code>type: 'text'</code> – 기본 텍스트 출력
					</li>
					<li>
						<code>type: 'image'</code> – 이미지 URL을 이미지로 렌더링
					</li>
					<li>
						<code>type: 'icon'</code> – 아이콘 + 텍스트
					</li>
					<li>
						<code>type: 'checkbox'</code> – 체크 여부 표시/토글
					</li>
					<li>
						<code>type: 'button'</code> – 액션 버튼
					</li>
					<li>
						<code>type: 'dropdown'</code> – 값 → 라벨 매핑 출력
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
					width={'100%'}
					height={500}
					options={{
						rowHeight: 35,
						editable: true,
						showRowNumber: true,
						headerAlign: 'center',
						scroll: { x: 'scroll', y: 'scroll' },
					}}
					onRowsChange={setRows}
				/>
			</div>
		</div>
	);
};

export default RendererDemoPage;
