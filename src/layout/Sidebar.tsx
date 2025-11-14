import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
	const location = useLocation();

	// Sidebar.tsx
	const menuItems = [
		{
			groupLabel: '그리드 기본',
			children: [
				{ label: '기본 출력', to: '/basic' },
				{ label: '렌더러', to: '/renderer' },
				{ label: '에디터', to: '/editor' },
				{ label: '포매터', to: '/formatter' },
				{ label: '옵션', to: '/options' },
			],
		},
	];

	return (
		<aside
			style={{
				width: 220,
				backgroundColor: '#2a2a2a',
				borderRight: '1px solid #444',
				display: 'flex',
				flexDirection: 'column',
				padding: '16px',
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: '16px', fontSize: 14, color: '#fff' }}>OneGrid Docs</div>

			<nav style={{ fontSize: 13, color: '#ccc' }}>
				{menuItems.map((group, gi) => (
					<div key={gi} style={{ marginBottom: '16px' }}>
						<div style={{ color: '#999', fontSize: 12, fontWeight: 600, marginBottom: '8px' }}>{group.groupLabel}</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
							{group.children.map(item => {
								const active = location.pathname === item.to;
								return (
									<Link
										key={item.to}
										to={item.to}
										style={{
											textDecoration: 'none',
											color: active ? '#fff' : '#aaa',
											backgroundColor: active ? '#3a3a3a' : 'transparent',
											border: active ? '1px solid #666' : '1px solid transparent',
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

			<div style={{ marginTop: 'auto', fontSize: 11, color: '#555' }}>
				<div style={{ color: '#777' }}>v0.0.1</div>
				<div style={{ color: '#555' }}>© OneGrid</div>
			</div>
		</aside>
	);
};

export default Sidebar;
