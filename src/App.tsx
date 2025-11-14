// App.tsx
import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import DocsLayout from './layout/DocsLayout';
import BasicGridPage from './pages/BasicGridPage';
import EditorDemoPage from './pages/EditorDemoPage';
import FormatterDemoPage from './pages/FormatterDemoPage';
import OptionsDemoPage from './pages/OptionsDemoPage';
import RendererDemoPage from './pages/RendererDemoPage';

const App: React.FC = () => {
	return (
		<HashRouter /* basename 안 써도 됨 */>
			<Routes>
				<Route element={<DocsLayout />}>
					{/* #/ */}
					<Route index element={<Navigate to="basic" replace />} />
					<Route path="/basic" element={<BasicGridPage />} />
					<Route path="/renderer" element={<RendererDemoPage />} />
					<Route path="/editor" element={<EditorDemoPage />} />
					<Route path="/formatter" element={<FormatterDemoPage />} />
					<Route path="/options" element={<OptionsDemoPage />} />
				</Route>
			</Routes>
		</HashRouter>
	);
};

export default App;
