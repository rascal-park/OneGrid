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
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">렌더러 데모</h1>
				<p className="docs-section-desc">
					셀을 어떻게 그릴지 결정하는 <code>renderer</code> 예제입니다.
				</p>
				<ul className="docs-section-bullets">
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
						scroll: { x: 'scroll', y: 'scroll' },
					}}
					onRowsChange={setRows}
				/>
			</section>
		</div>
	);
};

export default RendererDemoPage;
