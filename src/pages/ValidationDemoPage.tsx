// src/pages/ValidationDemoPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createValidationColumns } from '../demo/demoColumns';
import { VALIDATION_DEMO_ROWS } from '../demo/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const ValidationDemoPage: React.FC = () => {
	const [rows, setRows] = useState(VALIDATION_DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);

	const columns: OneGridColumn[] = useMemo(() => createValidationColumns(), []);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">Validation 데모</h1>
				<p className="docs-section-desc">
					컬럼에 <code>validators</code> 를 설정해서 이메일, 숫자 범위, 한글/영문, 커스텀 검증을 수행하는 예제입니다.
				</p>
				<ul className="docs-section-bullets">
					<li>에러가 있을 때는 셀 테두리가 빨간색으로 표시됩니다.</li>
					<li>마우스를 올리면 브라우저 기본 툴팁으로 에러 메시지가 표시됩니다.</li>
					<li>Enter / Tab / 포커스 아웃 시 검증에 실패하면 커밋되지 않습니다.</li>
				</ul>
			</section>

			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					onRowsChange={setRows}
					width={'100%'}
					height={320}
					options={{
						rowHeight: 32,
						editable: true,
						showRowNumber: true,
						headerAlign: 'center',
						scroll: { x: 'auto', y: 'auto' },
						enableColumnResize: true,
						pagination: { mode: 'none' },
					}}
				/>
			</section>
		</div>
	);
};

export default ValidationDemoPage;
