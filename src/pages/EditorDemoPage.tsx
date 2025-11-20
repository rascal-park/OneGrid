import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createEditorColumns } from '../types/demoColumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const EditorDemoPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = useMemo(() => createEditorColumns(setRows), [setRows]);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">에디터 데모</h1>
				<p className="docs-section-desc">
					셀 편집 시 사용되는 <code>editor</code> 예제입니다.
				</p>
				<ul className="docs-section-bullets">
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
			</section>

			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					width={'100%'}
					height={500}
					options={{
						rowHeight: 35,
						editable: true,
						showRowNumber: true,
						headerAlign: 'center',
					}}
					onRowsChange={setRows}
				/>
			</section>
		</div>
	);
};

export default EditorDemoPage;
