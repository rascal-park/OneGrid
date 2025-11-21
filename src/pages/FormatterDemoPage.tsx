import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createFormatterColumns } from '../demo/demoColumns';
import { DEMO_ROWS } from '../demo/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const FormatterDemoPage: React.FC = () => {
	const [rows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = useMemo(() => createFormatterColumns(() => {}), []);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">포매터 데모</h1>
				<p className="docs-section-desc">
					원본 값은 그대로 두고 화면에 표시되는 값만 바꾸는 <code>formatter</code> 예제입니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						<code>num</code> : 1000000 → &quot;1,000,000원&quot;
					</li>
					<li>
						<code>birth</code> : &quot;2025-01-10&quot; → &quot;2025/01/10&quot;
					</li>
				</ul>
			</section>

			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					height={400}
					width={'100%'}
					options={{
						rowHeight: 35,
						editable: false,
						showRowNumber: true,
						headerAlign: 'center',
					}}
				/>
			</section>
		</div>
	);
};

export default FormatterDemoPage;
