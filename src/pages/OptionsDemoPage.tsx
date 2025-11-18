import React, { useMemo, useRef, useState } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import { createOptionsColumns } from '../types/demoColumns';
import { DEMO_ROWS } from '../types/demoRows';
import type { OneGridColumn, OneGridHandle } from '../types/types';

const OptionsDemoPage: React.FC = () => {
	const [rows, setRows] = useState(DEMO_ROWS);
	const gridRef = useRef<OneGridHandle | null>(null);
	const columns: OneGridColumn[] = useMemo(() => createOptionsColumns(setRows), [setRows]);

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">옵션 데모</h1>
				<p className="docs-section-desc">
					열 이동 / 열 너비 조절 / 헤더 필터 / 행 번호 / 체크박스 선택 등의 옵션을 한 곳에서 보여줍니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						<code>enableColumnReorder</code> – 헤더 드래그로 열 순서 변경
					</li>
					<li>
						<code>enableColumnResize</code> – 헤더 우측 핸들로 너비 조절
					</li>
					<li>
						<code>enableHeaderFilter</code> – 필터 아이콘 클릭 → 체크박스 필터 팝업
					</li>
					<li>
						<code>showRowNumber</code> – 좌측에 행 번호 컬럼 추가
					</li>
					<li>
						<code>showCheckBox</code> – 좌측에 행 선택 체크박스 컬럼 추가
					</li>
				</ul>
			</section>

			<section className="docs-panel">
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					rowKeyField="id"
					height={500}
					width={'100%'}
					options={{
						rowHeight: 35,
						editable: true,
						showRowNumber: true,
						showCheckBox: true,
						headerAlign: 'center',
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
					onRowsChange={setRows}
				/>
			</section>
		</div>
	);
};

export default OptionsDemoPage;
