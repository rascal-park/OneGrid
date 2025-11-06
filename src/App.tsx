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
          {/* 기본 진입 시 /basic 으로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/basic" replace />} />

          {/* 실제 문서 페이지들 */}
          <Route path="/basic" element={<BasicGridPage />} />

          {/* 앞으로 확장 예:
            <Route path="/selection" element={<SelectionPage />} />
            <Route path="/sort" element={<SortDemoPage />} />
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
