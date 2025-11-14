// src/demo/demoColumns.ts
import mailIcon from '@assets/icon/icon_email.svg';
import { createDateFormatter, createNumberFormatter } from '../components/OneGrid/formatters';
import type { OneGridColumn } from './types';

const ROLE_OPTIONS = [
	{ value: 'ADMIN', label: '관리자' },
	{ value: 'USER', label: '사용자' },
	{ value: 'VIEWER', label: '조회자' },
];

const COUNTRY_OPTIONS = [
	{ value: 'KOREA', label: 'KOREA' },
	{ value: 'JAPAN', label: 'JAPAN' },
	{ value: 'USA', label: 'USA' },
];

// setRows 를 주입받는 공통 컬럼 팩토리
export function createBaseColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	return [
		{
			field: 'id',
			headerName: 'ID',
			width: 60,
			sortable: true,
			align: 'left',
			renderer: { type: 'text' },
			editor: { type: 'number', step: 1 },
		},
		{
			field: 'name',
			headerName: '이름(text)',
			width: 100,
			sortable: true,
			align: 'center',
			renderer: { type: 'text' },
			editor: { type: 'text' },
			filterable: true,
		},
		{
			field: 'num',
			headerName: '숫자(number)',
			width: 120,
			sortable: true,
			align: 'right',
			renderer: { type: 'text' },
			editor: { type: 'number', step: 1 },
			formatter: createNumberFormatter({
				useGrouping: true,
				decimalPlaces: 0,
				unit: '원',
			}),
			filterable: true,
		},
		{
			field: 'birth',
			headerName: '생년월일(date)',
			width: 140,
			sortable: true,
			align: 'center',
			renderer: { type: 'text' },
			editor: { type: 'date' },
			formatter: createDateFormatter({ format: 'yyyy/MM/dd' }),
		},
		{
			field: 'active',
			headerName: '사용여부(checkbox)',
			width: 150,
			align: 'center',
			renderer: {
				type: 'checkbox',
				props: {
					checkValue: 'Y',
					uncheckValue: 'N',
					onToggle: ({ row, nextValue }: any) => {
						setRows(prev => prev.map(r => (r.id === row.id ? { ...r, active: nextValue } : r)));
					},
				},
			},
			editor: {
				type: 'dropdown',
				options: [
					{ value: 'Y', label: '사용' },
					{ value: 'N', label: '미사용' },
				],
				multiple: false,
			},
			filterable: true,
			filterOptions: [
				{ value: 'Y', label: '사용' },
				{ value: 'N', label: '미사용' },
			],
		},
		{
			field: 'avatar',
			headerName: '이미지(image)',
			width: 120,
			renderer: {
				type: 'image',
				props: {
					fit: 'cover',
					align: 'left',
					onClick: ({ row }: any) => {
						alert(`이미지 클릭: ${row.name}`);
					},
				},
			},
			editor: { type: 'text' },
		},
		{
			field: 'icon',
			headerName: '아이콘(icon)',
			width: 140,
			align: 'right',
			renderer: {
				type: 'icon',
				props: {
					position: 'right',
					size: 18,
					icon: mailIcon,
					onClick: ({ row }: any) => {
						alert(`아이콘 클릭: ${row.name}`);
					},
				},
			},
			editor: { type: 'text' },
		},
		{
			field: 'role',
			headerName: '역할(dropdown)',
			width: 160,
			renderer: {
				type: 'dropdown',
				props: { options: ROLE_OPTIONS },
			},
			editor: { type: 'dropdown', options: ROLE_OPTIONS, multiple: false },
		},
		{
			field: 'roles',
			headerName: '역할(multi dropdown)',
			width: 200,
			renderer: {
				type: 'dropdown',
				props: { options: ROLE_OPTIONS },
			},
			editor: { type: 'dropdown', options: ROLE_OPTIONS, multiple: true },
		},
		{
			field: 'comboCountry',
			headerName: '국가(combo box)',
			width: 180,
			renderer: { type: 'text' },
			editor: { type: 'combo', options: COUNTRY_OPTIONS },
		},
		{
			field: 'action',
			headerName: '액션(button)',
			width: 90,
			renderer: {
				type: 'button',
				props: {
					onClick: ({ row }: any) => {
						console.log('액션 버튼 클릭:', row);
						alert(`액션: ${row.name} (${row.id})`);
					},
				},
			},
			editor: { type: 'text' },
		},
	];
}

/** 1) 기본 출력용: 텍스트/숫자/날짜/체크박스 */
export function createBasicColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	const all = createBaseColumns(setRows);
	return all.filter(col => ['id', 'name', 'num', 'birth', 'active'].includes(col.field));
}

/** 2) 렌더러 데모용 */
export function createRendererColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	const all = createBaseColumns(setRows);
	return all.filter(col =>
		['id', 'name', 'avatar', 'icon', 'active', 'role', 'roles', 'comboCountry', 'action'].includes(col.field),
	);
}

/** 3) 에디터 데모용 */
export function createEditorColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	const all = createBaseColumns(setRows);
	// 편집 가능한 것들을 위주로
	return all.filter(col =>
		['name', 'num', 'birth', 'active', 'role', 'roles', 'comboCountry', 'action'].includes(col.field),
	);
}

/** 4) 포매터 데모용 */
export function createFormatterColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	const all = createBaseColumns(setRows);
	// num, birth 에 포매터가 있으니까 이 둘 위주 + 비교용 텍스트
	return all.filter(col => ['id', 'name', 'num', 'birth'].includes(col.field));
}

/** 5) 옵션 데모용 (열 이동/너비/필터/체크박스/rowNum 보여줄 컬럼) */
export function createOptionsColumns(setRows: React.Dispatch<React.SetStateAction<any[]>>): OneGridColumn[] {
	const all = createBaseColumns(setRows);
	// 옵션 데모는 컬럼 종류보단 "동작" 위주라 거의 다 써도 됨
	return all;
}
