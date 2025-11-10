// App.tsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import DocsLayout from './layout/DocsLayout';
import BasicGridPage from './pages/BasicGridPage';

const App: React.FC = () => {
	return (
		<HashRouter /* basename 안 써도 됨 */>
			<Routes>
				<Route element={<DocsLayout />}>
					{/* #/ */}
					<Route index element={<Navigate to="basic" replace />} />
					{/* #/basic */}
					<Route path="basic" element={<BasicGridPage />} />
				</Route>
			</Routes>
		</HashRouter>
	);
};

export default App;
