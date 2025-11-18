// src/layout/DocsLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DocsLayout: React.FC = () => {
	return (
		<div className="docs-layout">
			{/* 왼쪽 사이드바 */}
			<Sidebar />

			{/* 오른쪽 전체 영역 */}
			<main className="docs-main-area">
				<div className="docs-content-wrapper">
					<Outlet />
				</div>
			</main>
		</div>
	);
};

export default DocsLayout;
