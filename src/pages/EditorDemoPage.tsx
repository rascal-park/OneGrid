// src/pages/EditorDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createEditorColumns } from '../types/demoCloumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const EditorDemoPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = useMemo(() => createEditorColumns(setRows), [setRows]);

	return (
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: 16 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>에디터 데모</h1>
				<p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
					셀 편집 시 사용되는 <code>editor</code> 예제입니다.
				</p>
				<ul style={{ fontSize: 12, color: '#bbb', marginTop: 8, paddingLeft: 16 }}>
					<li>
						<code>type: 'text'</code> – 기본 텍스트 입력
					</li>
					<li>
						<code>type: 'number'</code> – 숫자 입력 (step/min/max)
					</li>
					<li>
						<code>type: 'date'</code> – <code>input[type=date]</code> + 달력 버튼
					</li>
					<li>
						<code>type: 'dropdown'</code> – 싱글/멀티 옵션 선택
					</li>
					<li>
						<code>type: 'combo'</code> – 입력 + datalist 조합
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
					height={500}
					options={{
						rowHeight: 35,
						editable: true,
						showRowNumber: true,
						headerAlign: 'center',
					}}
					onRowsChange={setRows}
				/>
			</div>
		</div>
	);
};

export default EditorDemoPage;
