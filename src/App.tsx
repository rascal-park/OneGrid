// App.tsx
import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import DocsLayout from './layout/DocsLayout';
import BasicGridPage from './pages/BasicGridPage';
import EditorDemoPage from './pages/EditorDemoPage';
import FormatterDemoPage from './pages/FormatterDemoPage';
import HeaderGroupDemoPage from './pages/HeaderDemoPage';
import OptionsDemoPage from './pages/OptionsDemoPage';
import PaginationDemoPage from './pages/PaginationDemoPage';
import RendererDemoPage from './pages/RendererDemoPage';
import RowOpsDemoPage from './pages/RowOpsDemoPage';
import { ThemeProvider } from './theme/ThemeContext';
import ExportImportDemoPage from './pages/ExportImportDemoPage';
import TreeGridDemoPage from './pages/TreeGridDemoPage';
import OneGridApiDocPage from './pages/OneGridApiDocPage';
import OneGridColumnDocPage from './pages/OneGridColumnDocPage';

const App: React.FC = () => {
	return (
		<ThemeProvider>
			<HashRouter>
				<Routes>
					<Route element={<DocsLayout />}>
						<Route index element={<Navigate to="basic" replace />} />
						<Route path="/basic" element={<BasicGridPage />} />
						<Route path="/renderer" element={<RendererDemoPage />} />
						<Route path="/editor" element={<EditorDemoPage />} />
						<Route path="/formatter" element={<FormatterDemoPage />} />
						<Route path="/options" element={<OptionsDemoPage />} />
						<Route path="/header-group" element={<HeaderGroupDemoPage />} />
						<Route path="/row-ops" element={<RowOpsDemoPage />} />
						<Route path="/pagination" element={<PaginationDemoPage />} />
						<Route path="/export-import" element={<ExportImportDemoPage />} />
						<Route path="/tree" element={<TreeGridDemoPage />} />
						<Route path="/api-doc" element={<OneGridApiDocPage />} />
						<Route path="/column-doc" element={<OneGridColumnDocPage />} />
					</Route>
				</Routes>
			</HashRouter>
		</ThemeProvider>
	);
};

export default App;
