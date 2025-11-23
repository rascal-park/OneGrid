// src/pages/RendererEditorFormatterDocsPage.tsx
import React from 'react';

interface ApiItem {
	id: string;
	name: string;
	kind: 'formatter' | 'renderer' | 'editor';
	label: string;
	description: string;
	signature?: string;
	params?: { name: string; desc: string }[];
	usage: string;
	notes?: string[];
}

const OneGridColumnDocPage: React.FC = () => {
	const formatterItems: ApiItem[] = [
		{
			id: 'number',
			kind: 'formatter',
			name: 'createNumberFormatter',
			label: '숫자 포매터',
			description: '숫자 값을 천단위 콤마, 소수점 자리수, 단위(원, 개 등)를 붙여서 표시하기 위한 포매터입니다.',
			signature: 'createNumberFormatter(options?: NumberFormatterOptions): OneGridFormatterConfig',
			params: [
				{
					name: 'decimalPlaces?: number',
					desc: '소수점 자리수. 지정하지 않으면 원래 소수 자릿수를 유지합니다.',
				},
				{
					name: 'useGrouping?: boolean',
					desc: '천단위 콤마 사용 여부 (기본값: true).',
				},
				{
					name: 'unit?: string',
					desc: "숫자 뒤에 붙일 단위 문자열. 예: '원', '개'.",
				},
			],
			usage: `{
  field: 'price',
  headerName: '금액',
  align: 'right',
  renderer: { type: 'text' },
  formatter: createNumberFormatter({
    decimalPlaces: 0,
    useGrouping: true,
    unit: '원',
  }),
}`,
			notes: ['값이 숫자로 변환되지 않으면 원래 값을 그대로 반환합니다.'],
		},
		{
			id: 'date',
			kind: 'formatter',
			name: 'createDateFormatter',
			label: '날짜 포매터',
			description: 'Date, 문자열, 숫자 형태의 날짜 값을 지정된 포맷 문자열(yyyy-MM-dd 등)로 포맷팅합니다.',
			signature: 'createDateFormatter(options?: DateFormatterOptions): OneGridFormatterConfig',
			params: [
				{
					name: "format?: 'yyyy-MM-dd' | 'yyyy.MM.dd' | 'yyyy/MM/dd' | 'locale'",
					desc: "표시 형식. 'locale'은 브라우저 로케일 기반으로 표시합니다. (기본값: 'yyyy-MM-dd')",
				},
				{
					name: 'locale?: string',
					desc: "format 이 'locale' 일 때 사용할 로케일. (기본값: 'ko-KR')",
				},
			],
			usage: `{
  field: 'birth',
  headerName: '생년월일',
  align: 'center',
  editor: { type: 'date' },
  formatter: createDateFormatter({
    format: 'yyyy/MM/dd',
  }),
}`,
			notes: ['Date, 문자열, 숫자를 모두 지원하며, 파싱 실패 시 원래 값을 그대로 반환합니다.'],
		},
	];

	const rendererItems: ApiItem[] = [
		{
			id: 'renderer-text',
			kind: 'renderer',
			name: "renderer.type = 'text'",
			label: '텍스트',
			description: '가장 기본적인 렌더러. 포매터 결과 혹은 원본 값을 단순 텍스트로 표시합니다.',
			usage: `{
  field: 'name',
  headerName: '이름',
  renderer: { type: 'text' },
}`,
		},
		{
			id: 'renderer-image',
			kind: 'renderer',
			name: "renderer.type = 'image'",
			label: '이미지',
			description: '셀 안에 <img> 태그로 이미지를 표시합니다. 아바타/썸네일 등에 사용합니다.',
			params: [
				{ name: 'renderer.props.fit', desc: "'contain' | 'cover' (기본값: 'contain')" },
				{ name: 'renderer.props.align', desc: "'left' | 'center' | 'right'" },
				{ name: 'renderer.props.width / height', desc: '이미지 최대 크기 지정' },
				{
					name: 'renderer.props.onClick',
					desc: '(params) => void; 이미지 클릭 시 호출되는 핸들러',
				},
			],
			usage: `{
  field: 'avatar',
  headerName: 'Avatar',
  renderer: {
    type: 'image',
    props: {
      fit: 'cover',
      align: 'left',
      onClick: ({ row }) => {
        alert(\`이미지 클릭: \${row.name}\`);
      },
    },
  },
}`,
		},
		{
			id: 'renderer-icon',
			kind: 'renderer',
			name: "renderer.type = 'icon'",
			label: '아이콘',
			description:
				'SVG/이미지/텍스트 아이콘을 표시합니다. value는 라벨 텍스트로만 사용되고, 실제 아이콘은 renderer.props.icon 으로 지정합니다.',
			params: [
				{
					name: 'renderer.props.icon',
					desc: 'SVG ReactComponent, 이미지 URL, 또는 텍스트 이모지 등.',
				},
				{
					name: 'renderer.props.position',
					desc: "'left' | 'right' 아이콘 위치 (기본값: 'left')",
				},
				{ name: 'renderer.props.size', desc: '아이콘 크기(px). 기본값: 14' },
				{
					name: 'renderer.props.onClick',
					desc: '(params) => void; 아이콘 영역 클릭 시 호출.',
				},
			],
			usage: `import mailIcon from '@assets/icon/icon_email.svg';

{
  field: 'icon',
  headerName: '메일',
  renderer: {
    type: 'icon',
    props: {
      icon: mailIcon,
      position: 'right',
      size: 18,
      onClick: ({ row }) => {
        alert(\`메일 보내기: \${row.name}\`);
      },
    },
  },
}`,
		},
		{
			id: 'renderer-checkbox',
			kind: 'renderer',
			name: "renderer.type = 'checkbox'",
			label: '체크박스',
			description: '셀 안에 커스텀 체크박스를 렌더링합니다. 클릭 시 onToggle 콜백으로 다음 값을 넘겨줍니다.',
			params: [
				{
					name: 'renderer.props.checkValue',
					desc: '체크 상태일 때 저장할 값 (기본값: true).',
				},
				{
					name: 'renderer.props.uncheckValue',
					desc: '미체크 상태일 때 저장할 값 (기본값: false).',
				},
				{
					name: 'renderer.props.onToggle',
					desc: '(params & { nextValue }) => void; 토글 시 호출.',
				},
			],
			usage: `{
  field: 'active',
  headerName: '사용여부',
  renderer: {
    type: 'checkbox',
    props: {
      checkValue: 'Y',
      uncheckValue: 'N',
      onToggle: ({ row, nextValue }) => {
        // setRows 로 상태 업데이트
      },
    },
  },
}`,
		},
		{
			id: 'renderer-button',
			kind: 'renderer',
			name: "renderer.type = 'button'",
			label: '버튼',
			description: '셀 안에 작은 버튼을 렌더링합니다. label 이 없으면 버튼은 렌더링되지 않습니다.',
			params: [
				{
					name: 'renderer.props.label',
					desc: '버튼 라벨. 지정하지 않으면 value/formatter 결과를 사용.',
				},
				{ name: 'renderer.props.onClick', desc: '(params) => void; 클릭 시 호출.' },
			],
			usage: `{
  field: 'action',
  headerName: '액션',
  renderer: {
    type: 'button',
    props: {
      label: '상세',
      onClick: ({ row }) => {
        console.log('액션 클릭', row);
      },
    },
  },
}`,
		},
		{
			id: 'renderer-dropdown',
			kind: 'renderer',
			name: "renderer.type = 'dropdown'",
			label: '드롭다운 표시용 렌더러',
			description:
				'셀 값(코드)을 label 로 매핑해서 표시하는 렌더러입니다. 실제 편집은 editor.dropdown 과 함께 사용합니다.',
			params: [
				{
					name: 'renderer.props.options',
					desc: '{ value: any; label: string }[] 형태의 코드/라벨 목록.',
				},
			],
			usage: `const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'USER', label: '사용자' },
];

{
  field: 'role',
  headerName: '역할',
  renderer: {
    type: 'dropdown',
    props: { options: ROLE_OPTIONS },
  },
  editor: {
    type: 'dropdown',
    options: ROLE_OPTIONS,
    multiple: false,
  },
}`,
		},
		{
			id: 'renderer-custom',
			kind: 'renderer',
			name: "renderer.type = 'custom'",
			label: '커스텀 렌더러',
			description:
				'렌더링 로직을 완전히 커스터마이징할 때 사용합니다. renderer.renderCustom 함수에서 직접 ReactNode를 반환합니다.',
			params: [
				{
					name: 'renderer.renderCustom',
					desc: '(params) => ReactNode; 셀 렌더링 함수.',
				},
			],
			usage: `{
  field: 'status',
  headerName: '상태',
  renderer: {
    type: 'custom',
    renderCustom: ({ value }) => (
      <span style={{ color: value === 'ERROR' ? 'red' : 'inherit' }}>
        {value}
      </span>
    ),
  },
}`,
		},
	];

	const editorItems: ApiItem[] = [
		{
			id: 'editor-text',
			kind: 'editor',
			name: "editor.type = 'text'",
			label: '텍스트 에디터',
			description: '기본 텍스트 입력용 에디터입니다. 일반 문자열/코드 입력에 사용합니다.',
			usage: `{
  field: 'name',
  headerName: '이름',
  renderer: { type: 'text' },
  editor: { type: 'text' },
}`,
		},
		{
			id: 'editor-number',
			kind: 'editor',
			name: "editor.type = 'number'",
			label: '숫자 에디터',
			description: '숫자 전용 입력 에디터입니다. step, min, max 옵션을 지원합니다.',
			params: [
				{ name: 'editor.step', desc: '증감 단위 (기본값: 1).' },
				{ name: 'editor.min / editor.max', desc: '최소/최대 값.' },
			],
			usage: `{
  field: 'num',
  headerName: '숫자',
  align: 'right',
  renderer: { type: 'text' },
  editor: { type: 'number', step: 1, min: 0 },
}`,
		},
		{
			id: 'editor-date',
			kind: 'editor',
			name: "editor.type = 'date'",
			label: '날짜 에디터',
			description:
				"input[type='date'] + 달력 아이콘으로 날짜를 선택하는 에디터입니다. createDateFormatter 와 함께 사용하면 좋습니다.",
			usage: `{
  field: 'birth',
  headerName: '생년월일',
  renderer: { type: 'text' },
  editor: { type: 'date' },
  formatter: createDateFormatter({ format: 'yyyy-MM-dd' }),
}`,
		},
		{
			id: 'editor-dropdown',
			kind: 'editor',
			name: "editor.type = 'dropdown'",
			label: '드롭다운 에디터 (단일/멀티)',
			description:
				'select 기반 드롭다운 에디터입니다. options 로 코드값을 설정하며, multiple = true 로 멀티 선택도 가능합니다.',
			params: [
				{
					name: 'editor.options',
					desc: '{ value: any; label: string }[] 형태의 옵션 목록.',
				},
				{
					name: 'editor.multiple',
					desc: 'true 일 경우 멀티 선택. value 는 문자열 배열로 관리됩니다.',
				},
			],
			usage: `const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'USER', label: '사용자' },
];

{
  field: 'roles',
  headerName: '역할(복수)',
  renderer: {
    type: 'dropdown',
    props: { options: ROLE_OPTIONS },
  },
  editor: {
    type: 'dropdown',
    options: ROLE_OPTIONS,
    multiple: true,
  },
}`,
		},
		{
			id: 'editor-combo',
			kind: 'editor',
			name: "editor.type = 'combo'",
			label: '콤보(입력+선택) 에디터',
			description: 'input + datalist 구조로, 직접 입력하거나 제안 목록에서 선택할 수 있는 콤보 박스입니다.',
			params: [
				{
					name: 'editor.options',
					desc: '{ value: any; label: string }[]; datalist 제안 목록.',
				},
			],
			usage: `const COUNTRY_OPTIONS = [
  { value: 'KOREA', label: '한국' },
  { value: 'USA', label: '미국' },
];

{
  field: 'comboCountry',
  headerName: '국가(콤보)',
  renderer: { type: 'text' },
  editor: {
    type: 'combo',
    options: COUNTRY_OPTIONS,
  },
}`,
		},
		{
			id: 'editor-custom',
			kind: 'editor',
			name: "editor.type = 'custom'",
			label: '커스텀 에디터',
			description: '완전 커스텀 편집 컴포넌트를 사용하고 싶을 때 editor.renderCustomEditor 로 직접 렌더링합니다.',
			params: [
				{
					name: 'editor.renderCustomEditor',
					desc: '(params) => ReactNode; 커스텀 에디터 렌더링 함수.',
				},
			],
			usage: `{
  field: 'color',
  headerName: '색상',
  renderer: { type: 'text' },
  editor: {
    type: 'custom',
    renderCustomEditor: ({ value, onChange, onCommit, onCancel }) => (
      <input
        type="color"
        value={value ?? '#ffffff'}
        onChange={e => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={e => {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter') onCommit();
        }}
      />
    ),
  },
}`,
		},
	];

	const renderApiCard = (item: ApiItem) => {
		return (
			<article key={item.id} className="og-api-card">
				<header className="og-api-card-header">
					<div>
						<div className="og-api-chip">
							{item.kind === 'formatter' ? 'Formatter' : item.kind === 'renderer' ? 'Renderer' : 'Editor'}
						</div>
						<h3 className="og-api-title">{item.label}</h3>
					</div>
					<div className="og-api-name">{item.name}</div>
				</header>

				<p className="og-api-desc">{item.description}</p>

				{item.signature && (
					<div className="og-api-signature">
						<span className="og-api-signature-label">시그니처</span>
						<code>{item.signature}</code>
					</div>
				)}

				{item.params && item.params.length > 0 && (
					<div className="og-api-section">
						<div className="og-api-section-title">파라미터</div>
						<ul className="og-api-param-list">
							{item.params.map(p => (
								<li key={p.name}>
									<div className="og-api-param-name">{p.name}</div>
									<div className="og-api-param-desc">{p.desc}</div>
								</li>
							))}
						</ul>
					</div>
				)}

				<div className="og-api-section">
					<div className="og-api-section-title">사용 예</div>
					<pre className="og-api-code">
						<code>{item.usage}</code>
					</pre>
				</div>

				{item.notes && item.notes.length > 0 && (
					<div className="og-api-notes">
						{item.notes.map((n, idx) => (
							<div key={idx} className="og-api-note-line">
								※ {n}
							</div>
						))}
					</div>
				)}
			</article>
		);
	};

	return (
		<div className="docs-main">
			{/* 헤더 영역 */}
			<section className="docs-section-header">
				<h1 className="docs-section-title">Renderer / Editor / Formatter API</h1>
				<p className="docs-section-desc">OneGrid 셀 렌더링과 편집, 포매팅을 위한 옵션들을 정리한 페이지입니다.</p>
				<ul className="docs-section-bullets">
					<li>
						각 항목은 <strong>명 / 설명 / 사용방법</strong> 형태로 정리되어 있으며, 실제 코드 예제까지 포함합니다.
					</li>
					<li>
						<code>createNumberFormatter</code>, <code>createDateFormatter</code> 등 유틸 함수와 <code>renderer</code>,{' '}
						<code>editor</code> 조합 패턴을 한곳에서 볼 수 있습니다.
					</li>
				</ul>
			</section>

			{/* 포매터 섹션 */}
			<section className="docs-panel">
				<h2 className="docs-section-subtitle">1. Formatter (포매터)</h2>
				<p className="docs-section-desc">
					포매터는 셀의 원본 값을 화면에 표시하기 좋은 문자열로 변환하는 역할을 합니다. 열 정의에서{' '}
					<code>formatter</code> 속성으로 설정합니다.
				</p>

				<div className="og-api-grid">{formatterItems.map(renderApiCard)}</div>
			</section>

			{/* 렌더러 섹션 */}
			<section className="docs-panel">
				<h2 className="docs-section-subtitle">2. Renderer (렌더러)</h2>
				<p className="docs-section-desc">
					렌더러는 포매팅된 값(혹은 원본 값)을 실제 DOM으로 어떻게 그릴지 정의합니다. 열 정의에서{' '}
					<code>renderer: {'{ type, props }'}</code> 형태로 설정합니다.
				</p>

				<div className="og-api-grid">{rendererItems.map(renderApiCard)}</div>
			</section>

			{/* 에디터 섹션 */}
			<section className="docs-panel">
				<h2 className="docs-section-subtitle">3. Editor (에디터)</h2>
				<p className="docs-section-desc">
					에디터는 사용자가 셀을 더블 클릭하거나 입력할 때 표시되는 입력 UI입니다. 열 정의에서{' '}
					<code>editor: {'{ type, ... }'}</code> 로 설정합니다.
				</p>

				<div className="og-api-grid">{editorItems.map(renderApiCard)}</div>
			</section>

			{/* Docs 전용 스타일 (테마 변수 사용) */}
			<style>{`
				/* 한 줄에 카드 1개씩만 세로로 배치 */
				.og-api-grid {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}
				.og-api-card {
					border-radius: 8px;
					border: 1px solid var(--panel-border);
					background-color: var(--panel-bg);
					box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
					padding: 14px 16px 16px;
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
					background: rgba(150, 150, 255, 0.12);
					color: var(--fg);
					border: 1px solid rgba(150, 150, 255, 0.4);
					margin-bottom: 4px;
				}
				.og-api-title {
					font-size: 14px;
					font-weight: 600;
					margin: 0;
					color: var(--fg);
				}
				.og-api-name {
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						'Liberation Mono', 'Courier New', monospace;
					font-size: 11px;
					color: var(--muted);
					padding: 2px 6px;
					border-radius: 4px;
					background: rgba(0, 0, 0, 0.05);
					border: 1px solid var(--panel-border);
				}
				.og-api-desc {
					font-size: 12px;
					color: var(--muted);
					margin: 0;
				}
				.og-api-section {
					margin-top: 6px;
				}
				.og-api-section-title {
					font-size: 11px;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.06em;
					color: var(--muted);
					margin-bottom: 4px;
				}
				.og-api-signature {
					margin-top: 4px;
					display: flex;
					flex-direction: column;
					gap: 2px;
				}
				.og-api-signature-label {
					font-size: 11px;
					color: var(--muted);
				}
				.og-api-signature code {
					font-size: 11px;
					padding: 4px 6px;
					border-radius: 4px;
					border: 1px solid var(--panel-border);
					white-space: pre-wrap;
				}
				.og-api-param-list {
					list-style: none;
					margin: 0;
					padding: 0;
					display: flex;
					flex-direction: column;
					gap: 4px;
				}
				.og-api-param-name {
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						'Liberation Mono', 'Courier New', monospace;
					font-size: 11px;
					color: var(--fg);
				}
				.og-api-param-desc {
					font-size: 11px;
					color: var(--muted);
					margin-left: 4px;
				}
				.og-api-code {
					margin: 0;
					padding: 8px;
					border-radius: 6px;
					border: 1px solid var(--panel-border);
					font-size: 11px;
					max-height: 220px;
					overflow: auto;
					background-color: var(--bg);
				}
				.og-api-code code {
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						'Liberation Mono', 'Courier New', monospace;
					white-space: pre;
				}
				.og-api-notes {
					margin-top: 4px;
					padding-top: 4px;
					border-top: 1px dashed var(--panel-border);
				}
				.og-api-note-line {
					font-size: 11px;
					color: var(--muted);
				}
				.docs-section-subtitle {
					font-size: 16px;
					font-weight: 600;
					margin-bottom: 6px;
					color: var(--fg);
				}
				.docs-section-mini-title {
					font-size: 14px;
					font-weight: 600;
					margin-bottom: 6px;
					color: var(--fg);
				}
			`}</style>
		</div>
	);
};

export default OneGridColumnDocPage;
