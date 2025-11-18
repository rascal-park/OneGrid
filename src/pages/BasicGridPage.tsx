// src/pages/BasicGridPage.tsx (기존 BasicGridPage를 "기본 출력" 버전으로 변경)
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
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: 16 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>기본 출력</h1>
				<p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
					가장 기본적인 사용 예제입니다.
					<br />
					<code>columns</code>, <code>rows</code>, <code>rowKeyField</code> 만으로 데이터를 출력하는 방법을 보여줍니다.
				</p>
				<ul style={{ fontSize: 12, color: '#bbb', marginTop: 8, paddingLeft: 16 }}>
					<li>
						행 키는 <code>rowKeyField="id"</code> 를 사용합니다.
					</li>
					<li>기본 정렬/선택/편집 기능은 최소 옵션으로 동작합니다.</li>
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
					height={400}
					options={{
						rowHeight: 35,
						editable: false,
						headerAlign: 'center',
					}}
				/>
			</div>
		</div>
	);
};

export default BasicGridPage;
