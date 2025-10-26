import React, { useState, useRef } from 'react';
import OneGrid from '../components/OneGrid';
import type {
  OneGridColumn,
  OneGridHandle,
} from '../components/OneGrid';

// 컬럼 정의
// - id: 읽기 전용 (editor 없음)
// - name: text editor
// - role: custom 렌더(뱃지) + text editor 예시
const columns: OneGridColumn[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 60,
    // editor 없음 → 편집 불가 컬럼
  },
  {
    field: 'name',
    headerName: '이름',
    // width 없음 → 남은 가로폭 자동으로 차지 (flex 대상)
    editor: {
      type: 'text',
    },
  },
  {
    field: 'role',
    headerName: '역할',
    width: 120,
    // 보기 모드에서 어떻게 보일지
    renderCell: ({ value }) => (
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
        {value}
      </span>
    ),
    // 편집은 text 입력으로 가능하게 (role도 수정 가능)
    editor: {
      type: 'text',
    },
  },
];

// 초기 데이터
const initialRows = [
  { id: 1, name: '박재형', role: 'ADMIN' },
  { id: 2, name: '서영선', role: 'USER' },
  { id: 3, name: '홍길동', role: 'VIEWER' },
];

const BasicGridPage: React.FC = () => {
  const [rows, setRows] = useState(initialRows);

  // ref로 외부 제어 가능 (나중에 startEditAt 같은 거 호출 가능)
  const gridRef = useRef<OneGridHandle | null>(null);

  return (
    <div style={{ color: '#fff' }}>
      {/* 타이틀 / 설명 */}
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
          가장 기본 형태의 OneGrid 입니다. <br />
          - columns로 컬럼 정의
          - rows로 데이터 전달
          - 컬럼별 editor / renderCell로 표시와 편집 방식을 제어합니다.
        </p>
      </div>

      {/* 실제 Grid */}
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
          ref={gridRef}
          columns={columns}
          rows={rows}
          rowKeyField="id"
          height={220}
          options={{
            rowHeight: 32,
            editable: true,
          }}
          onRowsChange={(updatedRows) => {
            // 편집(더블클릭 / 타이핑 시작 등)으로 값이 바뀌었을 때
            setRows(updatedRows);
          }}
        />
      </div>

      {/* 코드 샘플 섹션 */}
      <pre
        style={{
          backgroundColor: '#000',
          color: '#0f0',
          fontSize: 12,
          padding: '16px',
          borderRadius: '6px',
          overflowX: 'auto',
          border: '1px solid #333',
          lineHeight: 1.5,
        }}
      >{`// columns 정의
const columns = [
  {
    field: 'id',
    headerName: 'ID',
    width: 60,
    // editor 없음 => 읽기 전용
  },
  {
    field: 'name',
    headerName: '이름',
    // width 없음 => 남은 가로폭 자동 할당
    editor: {
      type: 'text', // text 에디터
    },
  },
  {
    field: 'role',
    headerName: '역할',
    width: 120,
    renderCell: ({ value }) => (
      <span className="role-badge">{value}</span>
    ),
    editor: {
      type: 'text',
    },
  },
];

// rows 데이터
const [rows, setRows] = useState([
  { id: 1, name: '박재형', role: 'ADMIN' },
  { id: 2, name: '서영선', role: 'USER' },
  { id: 3, name: '홍길동', role: 'VIEWER' },
]);

// gridRef로 그리드를 바깥에서 제어할 수도 있습니다.
const gridRef = useRef<OneGridHandle | null>(null);

<OneGrid
  ref={gridRef}
  columns={columns}
  rows={rows}
  rowKeyField="id"
  height={220}
  options={{
    rowHeight: 32,
    editable: true,
  }}
  onRowsChange={(updatedRows) => {
    setRows(updatedRows);
  }}
/>`}</pre>

      {/* 예: 외부 제어 버튼 같은 것도 문서에 보여줄 수 있음 */}
      <div style={{ marginTop: '16px', fontSize: 12, color: '#aaa' }}>
        <p style={{ margin: 0 }}>
          ※ 예) 나중에는 이런 식으로도 가능해집니다.
        </p>
        <pre
          style={{
            backgroundColor: '#111',
            border: '1px solid #333',
            padding: '12px',
            borderRadius: '6px',
            color: '#bbb',
            fontSize: 12,
            lineHeight: 1.4,
            overflowX: 'auto',
            marginTop: '8px',
          }}
        >{`// 특정 셀 강제 편집 시작
gridRef.current?.startEditAt(2, 'name'); // id=2 의 name 셀을 에디트로 연다

// 현재 rows 가져오기
const currentData = gridRef.current?.getRows();

// rows 통째로 바꾸기
gridRef.current?.setRows([
  { id: 100, name: '신규', role: 'ADMIN' },
]);`}</pre>
      </div>
    </div>
  );
};

export default BasicGridPage;
