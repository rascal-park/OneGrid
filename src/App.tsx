import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import DocsLayout from './layout/DocsLayout';
import BasicGridPage from './pages/BasicGridPage';

const App: React.FC = () => {
	return (
		<BrowserRouter basename={import.meta.env.BASE_URL}>
			<Routes>
				{/* 공통 레이아웃 */}
				<Route element={<DocsLayout />}>
					{/* /OneGrid/ (== basename 뒤의 "/")로 들어왔을 때 */}
					<Route index element={<Navigate to="basic" replace />} />

					{/* /OneGrid/basic */}
					<Route path="basic" element={<BasicGridPage />} />

					{/* 앞으로 확장 예:
              <Route path="selection" element={<SelectionPage />} />
              <Route path="sort" element={<SortDemoPage />} />
          */}
				</Route>
			</Routes>
		</BrowserRouter>
	);
};

export default App;
