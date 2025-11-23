// src/pages/OneGridApiDocPage.tsx
import React from 'react';

interface OptionDocRow {
	id: string;
	name: string;
	desc: string;
	usage: string;
}

interface MethodDocRow {
	id: string;
	name: string;
	desc: string;
	usage: string;
}

// ===== 옵션 문서 데이터 =====
const optionRows: OptionDocRow[] = [
	{
		id: 'rowHeight',
		name: 'rowHeight',
		desc: '각 행(row)의 높이(px)를 설정합니다. 기본값은 32입니다.',
		usage: `<OneGrid options={{ rowHeight: 28 }} />`,
	},
	{
		id: 'editable',
		name: 'editable',
		desc: '셀 편집 가능 여부입니다. false로 설정하면 모든 에디터가 비활성화됩니다. 기본값: true',
		usage: `<OneGrid options={{ editable: false }} />`,
	},
	{
		id: 'showRowNumber',
		name: 'showRowNumber',
		desc: '좌측에 행 번호(1,2,3,…) 컬럼을 표시할지 여부입니다. 기본값: false',
		usage: `<OneGrid options={{ showRowNumber: true }} />`,
	},
	{
		id: 'headerAlign',
		name: 'headerAlign',
		desc: "헤더 텍스트 정렬 방향을 설정합니다. 'left' | 'center' | 'right' 중 하나를 사용합니다. 기본값: 'center'",
		usage: `<OneGrid options={{ headerAlign: 'left' }} />`,
	},
	{
		id: 'scroll',
		name: 'scroll',
		desc: "그리드 스크롤 동작을 설정합니다. scroll.x, scroll.y 에 'auto' | 'hidden' | 'scroll' 을 지정합니다.",
		usage: `<OneGrid options={{ scroll: { x: 'auto', y: 'auto' } }} />`,
	},
	{
		id: 'enableColumnReorder',
		name: 'enableColumnReorder',
		desc: '헤더를 드래그해서 컬럼 순서를 변경할 수 있게 합니다. 기본값: false',
		usage: `<OneGrid options={{ enableColumnReorder: true }} />`,
	},
	{
		id: 'enableColumnResize',
		name: 'enableColumnResize',
		desc: '헤더 우측을 드래그해서 컬럼 너비를 조정할 수 있게 합니다. 기본값: false',
		usage: `<OneGrid options={{ enableColumnResize: true }} />`,
	},
	{
		id: 'enableHeaderFilter',
		name: 'enableHeaderFilter',
		desc: '헤더 필터(값 목록)를 활성화합니다. 컬럼 정의에서 filterable인 컬럼에 한해 필터가 동작합니다.',
		usage: `<OneGrid options={{ enableHeaderFilter: true }} />`,
	},
	{
		id: 'showCheckBox',
		name: 'showCheckBox',
		desc: '좌측에 체크박스 컬럼을 추가합니다. 선택 행은 ref.getCheckedRows()로 조회할 수 있습니다.',
		usage: `<OneGrid options={{ showCheckBox: true }} />`,
	},
	{
		id: 'pagination.mode',
		name: 'pagination.mode',
		desc: "페이징 모드를 설정합니다. 'none' | 'page' | 'scroll' 중 하나를 사용합니다. 기본값: 'none'",
		usage: `<OneGrid options={{ pagination: { mode: 'page' } }} />`,
	},
	{
		id: 'pagination.type',
		name: 'pagination.type',
		desc: "페이징 방식입니다. 'client' 는 클라이언트에서 데이터 슬라이싱, 'server' 는 서버 페이징을 가정합니다. 기본값: 'client'",
		usage: `<OneGrid options={{ pagination: { mode: 'page', type: 'server' } }} />`,
	},
	{
		id: 'pagination.defaultPageSize',
		name: 'pagination.defaultPageSize',
		desc: '초기 페이지 크기입니다. pageSize prop으로 제어하지 않을 때 사용됩니다.',
		usage: `<OneGrid options={{ pagination: { mode: 'page', defaultPageSize: 50 } }} />`,
	},
	{
		id: 'pagination.pageSizeOptions',
		name: 'pagination.pageSizeOptions',
		desc: '푸터에서 선택 가능한 페이지 크기 목록입니다. 기본값: [15, 30, 50, 100]',
		usage: `<OneGrid options={{ pagination: { mode: 'page', pageSizeOptions: [10, 20, 40] } }} />`,
	},
];

// ===== ref 메서드 문서 데이터 =====
const methodRows: MethodDocRow[] = [
	{
		id: 'setRows',
		name: 'setRows(nextRows)',
		desc: '그리드 내부 데이터(internalRows)를 완전히 교체합니다. 기존 변경 이력과 키를 재부여합니다.',
		usage: `gridRef.current?.setRows(nextRows);`,
	},
	{
		id: 'getRows',
		name: 'getRows()',
		desc: '현재 그리드의 전체 internalRows 를 반환합니다. __rowStatus__ / _onegridRowKey 가 포함됩니다.',
		usage: `const rows = gridRef.current?.getRows();`,
	},
	{
		id: 'getActiveCell',
		name: 'getActiveCell()',
		desc: '현재 포커스된 셀의 rowKey, colField를 반환합니다. 없으면 null을 반환합니다.',
		usage: `const cell = gridRef.current?.getActiveCell();`,
	},
	{
		id: 'startEditAt',
		name: 'startEditAt(rowKey, colField)',
		desc: '특정 행/컬럼을 바로 편집 모드로 진입시킵니다.',
		usage: `gridRef.current?.startEditAt(rowKey, 'taskName');`,
	},
	{
		id: 'addRow',
		name: 'addRow(position, options)',
		desc: "새 행을 추가합니다. position: 'first' | 'last' | 'index'. options.index 또는 options.row 로 위치/초기값 지정.",
		usage: `gridRef.current?.addRow('last', { row: { name: '신규' } });`,
	},
	{
		id: 'removeRow',
		name: 'removeRow(position, options)',
		desc: "단일 행을 삭제/삭제 표시합니다. position: 'first' | 'last' | 'index'. 내부적으로 __rowStatus__ 를 'D' 로 마킹합니다.",
		usage: `gridRef.current?.removeRow('index'); // 현재 포커스된 행 기준`,
	},
	{
		id: 'removeSelectedRows',
		name: 'removeSelectedRows()',
		desc: '체크박스로 선택된 행들을 삭제/삭제 표시합니다. showCheckBox 옵션 사용 시 유용합니다.',
		usage: `gridRef.current?.removeSelectedRows();`,
	},
	{
		id: 'resetGrid',
		name: 'resetGrid(nextRows?)',
		desc: '그리드를 초기화합니다. 전달한 nextRows 로 다시 세팅하며, undo/redo, 체크박스, 선택 상태를 모두 초기화합니다.',
		usage: `gridRef.current?.resetGrid(initialRows);`,
	},
	{
		id: 'getInsertedRows',
		name: 'getInsertedRows()',
		desc: "__rowStatus__ 가 'I' 인 새로 추가된 행 목록만 반환합니다.",
		usage: `const inserted = gridRef.current?.getInsertedRows();`,
	},
	{
		id: 'getUpdatedRows',
		name: 'getUpdatedRows()',
		desc: "__rowStatus__ 가 'U' 인 수정된 행 목록만 반환합니다.",
		usage: `const updated = gridRef.current?.getUpdatedRows();`,
	},
	{
		id: 'getDeletedRows',
		name: 'getDeletedRows()',
		desc: "__rowStatus__ 가 'D' 인 삭제된 행 목록만 반환합니다. (화면에는 기본적으로 표시되지 않음)",
		usage: `const deleted = gridRef.current?.getDeletedRows();`,
	},
	{
		id: 'getChangedRows',
		name: 'getChangedRows()',
		desc: "__rowStatus__ 가 'I' | 'U' | 'D' 인 모든 변경 행을 한 번에 반환합니다.",
		usage: `const allChanged = gridRef.current?.getChangedRows();`,
	},
	{
		id: 'getCheckedRows',
		name: 'getCheckedRows()',
		desc: '체크박스 컬럼(옵션 showCheckBox: true)으로 선택된 행들만 반환합니다.',
		usage: `const checked = gridRef.current?.getCheckedRows();`,
	},
	{
		id: 'getSelectedRows',
		name: 'getSelectedRows()',
		desc: '마우스로 드래그/Shift/Ctrl로 선택된 셀들이 속한 행들을 반환합니다.',
		usage: `const selectedRows = gridRef.current?.getSelectedRows();`,
	},
	{
		id: 'getFocusedRows',
		name: 'getFocusedRows()',
		desc: '현재 활성 셀(포커스된 셀)이 속한 행(대부분 1개)을 반환합니다.',
		usage: `const focused = gridRef.current?.getFocusedRows();`,
	},
	{
		id: 'getPageInfo',
		name: 'getPageInfo()',
		desc: '현재 페이지 정보(currentPage, pageSize, totalCount, pageCount)를 반환합니다.',
		usage: `const pageInfo = gridRef.current?.getPageInfo();`,
	},
	{
		id: 'gotoPage',
		name: 'gotoPage(page)',
		desc: '해당 페이지 번호로 이동합니다. pagination.mode가 page 또는 scroll 일 때 사용합니다.',
		usage: `gridRef.current?.gotoPage(2);`,
	},
];

const OneGridApiDocPage: React.FC = () => {
	const renderOptionCard = (row: OptionDocRow) => (
		<article key={row.id} className="og-api-card">
			<header className="og-api-card-header">
				<div>
					<div className="og-api-chip og-api-chip-option">Option</div>
					<h3 className="og-api-title">{row.name}</h3>
				</div>
			</header>

			<p className="og-api-desc">{row.desc}</p>

			<div className="og-api-section">
				<div className="og-api-section-title">사용 예</div>
				<pre className="og-api-code">
					<code>{row.usage}</code>
				</pre>
			</div>
		</article>
	);

	const renderMethodCard = (row: MethodDocRow) => (
		<article key={row.id} className="og-api-card">
			<header className="og-api-card-header">
				<div>
					<div className="og-api-chip og-api-chip-method">Method</div>
					<h3 className="og-api-title">{row.name}</h3>
				</div>
			</header>

			<p className="og-api-desc">{row.desc}</p>

			<div className="og-api-section">
				<div className="og-api-section-title">사용 예</div>
				<pre className="og-api-code">
					<code>{row.usage}</code>
				</pre>
			</div>
		</article>
	);

	return (
		<div className="docs-main">
			{/* 헤더 설명 영역 */}
			<section className="docs-section-header">
				<h1 className="docs-section-title">OneGrid 옵션 &amp; API 문서</h1>
				<p className="docs-section-desc">
					이 페이지는 <code>OneGrid</code> 컴포넌트의 <strong>options</strong> 항목과{' '}
					<strong>ref 메서드(OneGridHandle)</strong>를 정리한 문서 페이지입니다.
				</p>
				<ul className="docs-section-bullets">
					<li>
						기본 사용 예:
						<br />
						<code>{`const gridRef = useRef<OneGridHandle | null>(null);`}</code>
						<br />
						<code>{`<OneGrid ref={gridRef} columns={columns} rows={rows} options={{ rowHeight: 28 }} />`}</code>
					</li>
					<li>
						옵션은 <code>options</code> prop으로 전달하며, 대부분 선택(optional)입니다.
					</li>
					<li>
						ref 메서드는 <code>gridRef.current?.함수명()</code> 형태로 호출합니다.
					</li>
				</ul>
			</section>

			{/* 옵션 카드 목록 */}
			<section className="docs-panel">
				<h2 className="docs-section-title">1. OneGrid Options</h2>
				<p className="docs-section-desc">
					<code>options: OneGridOptions</code> 에 설정 가능한 항목입니다. 아래 카드의 &quot;사용 예&quot; 코드를 그대로
					복사해 사용할 수 있습니다.
				</p>

				<div className="og-api-grid">{optionRows.map(renderOptionCard)}</div>
			</section>

			{/* ref 메서드 카드 목록 */}
			<section className="docs-panel" style={{ marginTop: 16 }}>
				<h2 className="docs-section-title">2. OneGrid ref 메서드 (OneGridHandle)</h2>
				<p className="docs-section-desc">
					<code>forwardRef</code> 로 노출되는 <code>OneGridHandle</code> 의 함수 목록입니다. CRUD 및 변경 내역 조회,
					페이징 제어 등에 사용할 수 있습니다.
				</p>

				<div className="og-api-grid">{methodRows.map(renderMethodCard)}</div>
			</section>

			{/* 카드 스타일 (테마 변수 사용) */}
			<style>{`
				/* 한 줄에 카드 1개씩 세로로 배치 */
				.og-api-grid {
					display: flex;
					flex-direction: column;
					gap: 12px;
					margin-top: 8px;
				}
				.og-api-card {
					border-radius: 8px;
					border: 1px solid var(--panel-border);
					background-color: var(--panel-bg);
					box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
					padding: 12px 14px 14px;
					display: flex;
					flex-direction: column;
					gap: 8px;
					width: 100%;
				}
				.og-api-card-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-end;
					gap: 8px;
				}
				.og-api-chip {
					display: inline-flex;
					align-items: center;
					padding: 2px 8px;
					border-radius: 999px;
					font-size: 10px;
					text-transform: uppercase;
					letter-spacing: 0.04em;
					margin-bottom: 4px;
				}
				.og-api-chip-option {
					background: rgba(96, 188, 255, 0.12);
					color: var(--fg);
					border: 1px solid rgba(96, 188, 255, 0.4);
				}
				.og-api-chip-method {
					background: rgba(162, 129, 255, 0.12);
					color: var(--fg);
					border: 1px solid rgba(162, 129, 255, 0.4);
				}
				.og-api-title {
					font-size: 14px;
					font-weight: 600;
					margin: 0;
					color: var(--fg);
				}
				.og-api-desc {
					font-size: 12px;
					color: var(--muted);
					margin: 0;
				}
				.og-api-section {
					margin-top: 4px;
				}
				.og-api-section-title {
					font-size: 11px;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.06em;
					color: var(--muted);
					margin-bottom: 4px;
				}
				.og-api-code {
					margin: 0;
					padding: 8px;
					border-radius: 6px;
					border: 1px solid var(--panel-border);
					font-size: 11px;
					max-height: 160px;
					overflow: auto;
					background-color: var(--bg);
				}
				.og-api-code code {
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						'Liberation Mono', 'Courier New', monospace;
					white-space: pre;
				}
			`}</style>
		</div>
	);
};

export default OneGridApiDocPage;
