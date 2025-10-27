import React, { useState, useRef } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';
import type {
  OneGridColumn,
  OneGridHandle,
} from '../components/OneGrid/types';

// 1) 컬럼 정의
//  - id: 읽기 전용(에디터 없음), 정렬 가능
//  - name: text 에디터, 정렬 가능, width 미지정 → 남은 폭 차지 (flex 대상)
//  - num: number 에디터
//  - role: formatter로 뱃지 스타일 표시 + text 에디터
//
//  formatter는 셀 값 대신 화면에 어떻게 보일지를 결정하는 렌더러
//  editor는 그 셀을 어떤 방식으로 편집할지 정의 (text / number / custom 등)
const columns: OneGridColumn[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 60,
    sortable: true,
    // editor 없음 => 읽기 전용
  },
  {
    field: 'name',
    headerName: '이름',
    sortable: true,
    // width 없음 => 이 컬럼이 남은 가로폭을 유동적으로 가져간다
    editor: {
      type: 'text', // 기본 텍스트 인라인 에디터
    },
  },
  {
    field: 'num',
    headerName: '숫자',
    width: 120,
    sortable: true,
    editor: {
      type: 'number', // 숫자 전용 인라인 에디터
    },
  },
  {
    field: 'role',
    headerName: '역할',
    width: 120,
    sortable: true,
    formatter: {
      render: ({ value }) => (
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
    },
    editor: {
      type: 'text', // 더블클릭/키입력 진입 가능
    },
  },
  // 숨김 컬럼 예시 (UI에는 안나오지만 데이터에는 존재)
  // {
  //   field: 'secretNote',
  //   headerName: '비고',
  //   hidden: true,
  //   editor: { type: 'text' },
  // },
];

// 2) 초기 rows
//  - rowKeyField="id" 를 주기 때문에 id 값이 고유키로 쓰인다
//  - 만약 rowKeyField가 없는 경우 OneGrid가 내부적으로 _onegridRowKey 를 자동으로 부여함
const initialRows = [
  { id: 1, name: '박재형', num: 1, role: 'ADMIN' },
  { id: 2, name: '서영선', num: 2, role: 'USER' },
  { id: 3, name: '홍길동', num: 3, role: 'VIEWER' },
];

const BasicGridPage: React.FC = () => {
  const [rows, setRows] = useState(initialRows);

  // ref 로 그리드 인스턴스를 제어할 수 있음:
  // - getRows(), setRows()
  // - startEditAt(rowKey, colField)
  // - getActiveCell()
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
          OneGrid 의 가장 기본 형태입니다. <br />
          <br />
          주요 특징:
          <br />- <b>columns</b> 로 컬럼 구조, 정렬 가능 여부
          (<code>sortable</code>), 편집 가능 여부(<code>editor</code>)를
          선언적으로 설정합니다.
          <br />- <b>rows</b> 로 데이터를 바인딩합니다.
          <br />- <b>options.showRowNumber</b> 가 true면 가장 왼쪽에 행
          번호(#) 컬럼이 자동으로 추가됩니다.
          <br />- 헤더를 클릭하면 <code>sortable: true</code> 인 컬럼은
          정렬(▲/▼)이 변경됩니다.
          <br />- 셀은 더블클릭 또는 키 입력(문자 / Enter)으로 편집
          모드에 진입합니다.
          <br />- 편집 중 <code>Tab / Shift+Tab</code> 으로 옆 셀 / 다음
          행으로 이동할 수 있습니다.
          <br />- 셀을 클릭하고 <b>Shift</b> 로 드래그 범위 선택,{' '}
          <b>Ctrl</b>로 다중 셀 토글 선택이 가능합니다.
          <br />- 선택된 영역은 <b>Ctrl+C / Ctrl+V</b> 로
          복사/붙여넣기(TSV 형태) 가능하며, 그리드 내부 값으로 반영됩니다.
          <br />- <b>Ctrl+Z / Ctrl+Y</b> 로 Undo / Redo 가 가능합니다.
        </p>
      </div>

      {/* 실제 Grid 미리보기 */}
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
          rowKeyField="id" // 각 row의 고유키로 사용할 필드명
          height={260}
          options={{
            rowHeight: 35, // 행 높이
            editable: true, // 편집 가능 여부 전체 스위치
            showRowNumber: true, // ← 왼쪽에 # 번호 자동 컬럼 주입
          }}
          onRowsChange={(updatedRows) => {
            // 셀 편집 커밋(Enter / blur 등) 또는 붙여넣기/정렬 등으로
            // rows 내용이 바뀌었을 때 상위로 변경내용을 전달받는다.
            setRows(updatedRows);
          }}
        />
      </div>

      {/* 코드 샘플 (설명용) */}
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
          marginBottom: '16px',
        }}
      >{`// 컬럼 정의
const columns = [
  {
    field: 'id',
    headerName: 'ID',
    width: 60,
    sortable: true,
    // editor 없음 => 읽기 전용
  },
  {
    field: 'name',
    headerName: '이름',
    sortable: true,
    // width 없음 => 이 컬럼이 남은 가로폭을 flex로 차지
    editor: {
      type: 'text', // 기본 텍스트 인라인 에디터
    },
  },
  {
    field: 'num',
    headerName: '숫자',
    width: 120,
    sortable: true,
    editor: {
      type: 'number', // 숫자 전용 인라인 에디터
    },
  },
  {
    field: 'role',
    headerName: '역할',
    width: 120,
    sortable: true,
    formatter: {
      render: ({ value }) => (
        <span className="role-badge">{value}</span>
      ),
    },
    editor: {
      type: 'text', // 역할도 편집 가능
    },
  },

  // 숨김 컬럼 예시
  // {
  //   field: 'secretNote',
  //   headerName: '비고',
  //   hidden: true,
  //   editor: { type: 'text' },
  // },
];

// 초기 rows
const [rows, setRows] = useState([
  { id: 1, name: '박재형', num: 1, role: 'ADMIN' },
  { id: 2, name: '서영선', num: 2, role: 'USER' },
  { id: 3, name: '홍길동', num: 3, role: 'VIEWER' },
]);

// Grid 제어용 ref
const gridRef = useRef<OneGridHandle | null>(null);

// 실제 렌더
<OneGrid
  ref={gridRef}
  columns={columns}
  rows={rows}
  rowKeyField="id"
  height={260}
  options={{
    rowHeight: 35,
    editable: true,       // 전체 편집 가능 여부
    showRowNumber: true,  // 왼쪽에 # 컬럼 자동 추가
  }}
  onRowsChange={(updatedRows) => {
    // 편집/붙여넣기/Undo-Redo 후 반영된 값
    setRows(updatedRows);
  }}
/>;`}</pre>

      {/* ref API 사용 예시 */}
      <div
        style={{
          backgroundColor: '#111',
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '6px',
          color: '#bbb',
          fontSize: 12,
          lineHeight: 1.5,
          overflowX: 'auto',
        }}
      >
        <p
          style={{
            marginTop: 0,
            marginBottom: '8px',
            color: '#aaa',
          }}
        >
          아래는 OneGrid 인스턴스를 직접 제어하는 예시입니다.
          (gridRef.current 사용)
        </p>

        <pre
          style={{
            backgroundColor: 'transparent',
            color: '#bbb',
            fontSize: 12,
            lineHeight: 1.4,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >{`// 현재 rows 전부 가져오기
const allData = gridRef.current?.getRows();

// rows를 통째로 교체하기
gridRef.current?.setRows([
  { id: 100, name: '신규 사용자', num: 99, role: 'ADMIN' },
  { id: 101, name: '테스터',     num: 42, role: 'USER'  },
]);

// 특정 셀을 강제로 편집 모드로 열기
// (rowKey = 2, colField = 'name' 인 셀)
gridRef.current?.startEditAt(2, 'name');

// 현재 포커스된(마지막으로 클릭된) 셀 정보 가져오기
const activeCell = gridRef.current?.getActiveCell();
// => { rowKey: 2, colField: 'name' } 또는 null

//--------------------------------------
// 사용 가능한 사용자 상호작용(요약)
//--------------------------------------
// • 정렬: 헤더 클릭 (sortable: true인 경우)
// • 편집 시작: 더블클릭 or 셀 포커스 후 문자 키 / Enter
// • 편집 중 Tab / Shift+Tab: 다음/이전 셀로 이동
// • Shift+클릭: 범위(사각형) 선택
// • Ctrl+클릭: 개별 셀 다중 선택 토글
// • Ctrl+C / Ctrl+V: 선택 영역 복사/붙여넣기
// • Ctrl+Z / Ctrl+Y: Undo / Redo
`}</pre>
      </div>
    </div>
  );
};

export default BasicGridPage;
