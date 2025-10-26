import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DocsLayout: React.FC = () => {
	return (
		<div
			style={{
				display: 'flex',
				minHeight: '100vh',
				backgroundColor: '#1e1e1e',
				color: '#fff',
				fontFamily:
					"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
			}}
		>
			{/* 왼쪽 사이드바 */}
			<Sidebar />

			{/* 오른쪽 전체 영역 */}
			<main
				style={{
					flex: 1,
					padding: '24px',
					display: 'flex',
					justifyContent: 'center', // <- 가로 가운데 정렬
				}}
			>
				{/* 이 안에 실제 페이지 콘텐츠를 고정폭으로 감싸서 가운데 배치 */}
				<div
					style={{
						width: '100%',
						maxWidth: '1500px', // 컨텐츠 최대 폭 (원하면 1000~1200으로 더 늘려도 됨)
					}}
				>
					<Outlet />
				</div>
			</main>
		</div>
	);
};

export default DocsLayout;
