import React, { useState } from 'react';
import OneGrid from '../components/OneGrid';
import type { OneGridColumn } from '../components/OneGrid';

const initialColumns: OneGridColumn[] = [
  { field: 'id', headerName: 'ID', width: 60, editable: false },
  // width 없음 -> 이 컬럼이 남는 가로폭을 유연하게 차지 (flex 대상)
  { field: 'name', headerName: '이름' },
  {
    field: 'role',
    headerName: '역할',
    width: 120,
    renderCell: (val: string) => (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #555',
          fontSize: 10,
          lineHeight: 1.4,
          color: '#fff',
          fontWeight: 600,
        }}
      >
        {val}
      </span>
    ),
  },
];

const initialRows = [
  { id: 1, name: '박재형', role: 'ADMIN' },
  { id: 2, name: '서영선', role: 'USER' },
  { id: 3, name: '홍길동', role: 'VIEWER' },
];

const BasicGridPage: React.FC = () => {
  // rows는 앞으로 편집(더블클릭 등) 후 변경될 수 있으니까 상태로 관리해주자.
  const [rows, setRows] = useState(initialRows);

  return (
    <div style={{ color: '#fff' }}>
      {/* 타이틀 영역 */}
      <div style={{ marginBottom: '16px' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '8px',
          }}
        >
          그리드 기본 &gt; 기본 출력
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: '#aaa',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          columns / rows 만 전달했을 때의 가장 단순한 렌더링 결과입니다.
        </p>
      </div>

      {/* 실제 Grid 박스 */}
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
          columns={initialColumns}
          rows={rows}
          height={220}
          options={{
            rowHeight: 32,
            editable: true,
          }}
          onRowsChange={(updated) => {
            // 더블클릭 편집 or 키입력 편집 후 값 반영
            setRows(updated);
          }}
        />
      </div>

      {/* 코드 샘플 */}
      <pre
        style={{
          backgroundColor: '#000',
          color: '#0f0',
          fontSize: 12,
          padding: '16px',
          borderRadius: '6px',
          overflowX: 'auto',
          border: '1px solid #333',
        }}
      >{`<OneGrid
  columns={[
    { field: 'id', headerName: 'ID', width: 60, editable: false },
    { field: 'name', headerName: '이름' }, // width 없음 → 남은 영역 차지
    {
      field: 'role',
      headerName: '역할',
      width: 120,
      renderCell: (val) => (
        <span className="role-badge">{val}</span>
      ),
    },
  ]}
  rows={[
    { id: 1, name: '박재형', role: 'ADMIN' },
    { id: 2, name: '서영선', role: 'USER' },
    { id: 3, name: '홍길동', role: 'VIEWER' },
  ]}
  height={220}
  options={{
    rowHeight: 32,
    editable: true,
  }}
  onRowsChange={(updatedRows) => {
    // 편집된 셀 값 반영
    setRows(updatedRows);
  }}
/>`}</pre>
    </div>
  );
};

export default BasicGridPage;
