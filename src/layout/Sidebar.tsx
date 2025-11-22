// src/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';

const Sidebar: React.FC = () => {
	const location = useLocation();
	const { theme, toggleTheme } = useTheme();

	const menuItems = [
		{
			groupLabel: '그리드 기본',
			children: [
				{ label: '기본 출력', to: '/basic' },
				{ label: '헤더 그룹', to: '/header-group' },
				{ label: '페이지네이션', to: '/pagination' },
				{ label: 'Export/Import', to: '/export-import' },
			],
		},
		{
			groupLabel: '그리드 편집',
			children: [
				{ label: '렌더러', to: '/renderer' },
				{ label: '에디터', to: '/editor' },
				{ label: '포매터', to: '/formatter' },
			],
		},
		{
			groupLabel: '그리드 옵션/이벤트 함수',
			children: [
				{ label: '옵션', to: '/options' },
				{ label: '이벤트', to: '/row-ops' },
			],
		},
	];

	return (
		<aside
			style={{
				width: 220,
				backgroundColor: 'var(--sidebar-bg)',
				borderRight: '1px solid var(--sidebar-border)',
				display: 'flex',
				flexDirection: 'column',
				padding: '16px 14px',
				boxSizing: 'border-box',
				color: 'var(--sidebar-fg)',
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>OneGrid Docs</div>

			<nav style={{ fontSize: 13 }}>
				{menuItems.map((group, gi) => (
					<div key={gi} style={{ marginBottom: 16 }}>
						<div
							style={{
								color: 'var(--muted)',
								fontSize: 12,
								fontWeight: 600,
								marginBottom: 8,
							}}
						>
							{group.groupLabel}
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
							{group.children.map(item => {
								const active = location.pathname === item.to;
								return (
									<Link
										key={item.to}
										to={item.to}
										style={{
											textDecoration: 'none',
											color: active ? 'var(--sidebar-fg)' : '#aaaaaa',
											backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
											border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
											borderRadius: 4,
											padding: '6px 8px',
											fontWeight: active ? 600 : 400,
											fontSize: 13,
											lineHeight: '18px',
										}}
									>
										{item.label}
									</Link>
								);
							})}
						</div>
					</div>
				))}
			</nav>

			<div
				style={{
					marginTop: 'auto',
					fontSize: 11,
					color: 'var(--muted)',
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
				}}
			>
				<button
					type="button"
					onClick={toggleTheme}
					style={{
						width: '100%',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 6,
						fontSize: 12,
						padding: '6px 8px',
					}}
				>
					{theme === 'dark' ? '☀ 라이트 모드' : '🌙 다크 모드'}
				</button>

				<div>
					<div style={{ color: 'var(--muted)' }}>v0.0.1</div>
					<div style={{ color: 'var(--muted)' }}>© OneGrid</div>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
