import React, { useState, useRef, useMemo } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import type { OneGridColumn, OneGridHandle } from '../components/OneGrid/types';

// 공통 dropdown 옵션
const ROLE_OPTIONS = [
	{ value: 'ADMIN', label: '관리자' },
	{ value: 'USER', label: '사용자' },
	{ value: 'VIEWER', label: '조회자' },
];

const COUNTRY_OPTIONS = [
	{ value: 'Korea', label: 'Korea' },
	{ value: 'Japan', label: 'Japan' },
	{ value: 'USA', label: 'USA' },
];

// 2) 초기 rows
const initialRows = [
	{
		id: 1,
		name: '박재형',
		num: 10,
		birth: '1990-01-10',
		active: 'Y',
		avatar: 'https://via.placeholder.com/32x32.png?text=P',
		icon: '⭐',
		role: 'ADMIN', // 단일
		roles: ['ADMIN', 'USER'], // 멀티
		comboCountry: 'Korea',
		action: '상세',
	},
	{
		id: 2,
		name: '서영선',
		num: 20,
		birth: '1992-05-21',
		active: 'N',
		avatar: 'https://via.placeholder.com/32x32.png?text=S',
		icon: '👀',
		role: 'USER',
		roles: ['USER'],
		comboCountry: 'Japan',
		action: '편집',
	},
	{
		id: 3,
		name: '홍길동',
		num: 30,
		birth: '1985-09-03',
		active: 'Y',
		avatar: 'https://via.placeholder.com/32x32.png?text=H',
		icon: '📌',
		role: 'VIEWER',
		roles: ['VIEWER', 'USER'],
		comboCountry: 'USA',
		action: '로그',
	},
];

const BasicGridPage: React.FC = () => {
	const [rows, setRows] = useState(initialRows);
	const gridRef = useRef<OneGridHandle | null>(null);

	// ✅ 모든 컬럼에 renderer + editor 1개씩
	const columns: OneGridColumn[] = useMemo(
		() => [
			{
				field: 'id',
				headerName: 'ID',
				width: 60,
				sortable: true,
				renderer: { type: 'text' },
				editor: {
					type: 'number',
					step: 1,
				},
			},
			{
				field: 'name',
				headerName: '이름(text)',
				sortable: true,
				renderer: { type: 'text' },
				editor: {
					type: 'text',
				},
			},
			{
				field: 'num',
				headerName: '숫자(number)',
				width: 80,
				sortable: true,
				renderer: { type: 'text' },
				editor: {
					type: 'number',
					step: 1,
				},
			},
			{
				field: 'birth',
				headerName: '생년월일(date)',
				width: 140,
				renderer: {
					type: 'text', // '1990-01-10' 텍스트로 표시
				},
				editor: {
					type: 'date', // 더블클릭 → date input + 달력 아이콘
				},
			},
			{
				field: 'active',
				headerName: '사용여부(checkbox)',
				width: 150,
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
			},
			{
				field: 'avatar',
				headerName: '이미지(image)',
				width: 120,
				renderer: {
					type: 'image',
					props: {
						fit: 'cover',
						align: 'center',
						onClick: ({ row }: any) => {
							alert(`이미지 클릭: ${row.name}`);
						},
					},
				},
				editor: {
					type: 'text', // 이미지 URL 입력
				},
			},
			{
				field: 'icon',
				headerName: '아이콘(icon)',
				width: 140,
				renderer: {
					type: 'icon',
					props: {
						position: 'left',
						size: 18,
						icon: '⭐',
						onClick: ({ row }: any) => {
							alert(`아이콘 클릭: ${row.name}`);
						},
					},
				},
				editor: {
					type: 'text', // 텍스트 라벨 (value) 입력
				},
			},
			{
				field: 'role',
				headerName: '역할(dropdown)',
				width: 160,
				renderer: {
					type: 'dropdown',
					props: {
						options: ROLE_OPTIONS,
					},
				},
				editor: {
					type: 'dropdown',
					options: ROLE_OPTIONS,
					multiple: false, // 싱글 드롭다운
				},
			},
			{
				field: 'roles',
				headerName: '역할(multi dropdown)',
				width: 200,
				renderer: {
					type: 'dropdown',
					props: {
						options: ROLE_OPTIONS,
					},
				},
				editor: {
					type: 'dropdown',
					options: ROLE_OPTIONS,
					multiple: true, // 멀티 드롭다운 (커스텀 UI)
				},
			},
			{
				field: 'comboCountry',
				headerName: '국가(combo box)',
				width: 180,
				renderer: {
					type: 'text',
				},
				editor: {
					type: 'combo', // 드롭다운 + 입력 필터
					options: COUNTRY_OPTIONS,
				},
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
				editor: {
					type: 'text', // 버튼 라벨 변경용
				},
			},
		],
		[setRows],
	);

	return (
		<div style={{ color: '#fff' }}>
			<div style={{ marginBottom: '16px' }}>
				<h1
					style={{
						fontSize: '20px',
						fontWeight: 600,
						margin: 0,
						marginBottom: '8px',
					}}
				>
					그리드 기본 &gt; 렌더러 / 에디터 데모
				</h1>

				<p
					style={{
						fontSize: '13px',
						color: '#aaa',
						lineHeight: 1.5,
						margin: 0,
					}}
				>
					각 컬럼은 렌더러 / 에디터 한 쌍으로 구성됩니다.
					<br />
					드롭다운(싱글/멀티) / 콤보박스 에디터는 같은 스타일의 UI로 동작합니다.
				</p>
			</div>

			<div
				style={{
					backgroundColor: '#2a2a2a',
					border: '1px solid #444',
					borderRadius: '6px',
					padding: '16px',
					marginBottom: '16px',
				}}
			>
				<OneGrid
					ref={gridRef}
					columns={columns}
					rows={rows}
					rowKeyField="id"
					height={360}
					options={{
						rowHeight: 35,
						editable: true,
						showRowNumber: true,
					}}
					onRowsChange={updatedRows => {
						setRows(updatedRows);
					}}
				/>
			</div>
		</div>
	);
};

export default BasicGridPage;
