// src/pages/ExportImportDemoPage.tsx
import React, { useMemo, useRef, useState, type ChangeEvent } from 'react';
import OneGrid from '../components/OneGrid/OneGrid';

import type { OneGridColumn, OneGridHandle } from '../types/types';
import { DEMO_ROWS } from '../demo/demoRows';
import { createEditorColumns } from '../demo/demoColumns';
import {
	exportToCsv,
	exportToJson,
	exportToPdf,
	exportToXlsx,
	importToCsv,
	importToJson,
	importToXlsx,
} from '../utils/utilsExportImport';

const ExportImportDemoPage: React.FC = () => {
	// 좌측(상단) 그리드: 샘플 데이터
	const [leftRows, setLeftRows] = useState<any[]>(DEMO_ROWS);

	// 우측(하단) 그리드: 업로드 결과를 넣을 빈 그리드
	const [rightRows, setRightRows] = useState<any[]>([]);

	const leftGridRef = useRef<OneGridHandle | null>(null);
	const rightGridRef = useRef<OneGridHandle | null>(null);

	// 공통 컬럼 (둘 다 동일하게 사용)
	const columns: OneGridColumn[] = useMemo(() => createEditorColumns(setLeftRows), [setLeftRows]);

	// 업로드용 파일 인풋 ref
	const xlsxInputRef = useRef<HTMLInputElement | null>(null);
	const csvInputRef = useRef<HTMLInputElement | null>(null);
	const jsonInputRef = useRef<HTMLInputElement | null>(null);

	// =============================
	// 상단: EXPORT 버튼 핸들러
	// =============================
	const handleExportXlsx = () => {
		exportToXlsx({ columns, rows: leftRows, fileName: 'onegrid-xlsx' });
	};

	const handleExportCsv = () => {
		exportToCsv({ columns, rows: leftRows, fileName: 'onegrid-csv' });
	};

	const handleExportJson = () => {
		exportToJson({ rows: leftRows, fileName: 'onegrid-json' });
	};

	const handleExportPdf = () => {
		exportToPdf({ columns, rows: leftRows, fileName: 'onegrid-pdf' });
	};

	// =============================
	// 하단: IMPORT 핸들러
	// =============================

	// 공통 change 핸들러 헬퍼
	const withFile = (e: ChangeEvent<HTMLInputElement>, cb: (file: File) => void) => {
		const file = e.target.files?.[0];
		if (!file) return;

		cb(file);

		// 같은 파일 다시 선택 가능하도록 value 초기화
		(e.target as HTMLInputElement).value = '';
	};

	const handleImportXlsxChange = (e: ChangeEvent<HTMLInputElement>) => {
		withFile(e, async file => {
			try {
				const rows = await importToXlsx(file, columns);
				setRightRows(rows);
				rightGridRef.current?.resetGrid?.(rows);
			} catch (err) {
				console.error(err);
				alert('엑셀 업로드 중 오류가 발생했습니다.');
			}
		});
	};

	const handleImportCsvChange = (e: ChangeEvent<HTMLInputElement>) => {
		withFile(e, async file => {
			try {
				const rows = await importToCsv(file, columns);
				setRightRows(rows);
				rightGridRef.current?.resetGrid?.(rows);
			} catch (err) {
				console.error(err);
				alert('CSV 업로드 중 오류가 발생했습니다.');
			}
		});
	};

	const handleImportJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
		withFile(e, async file => {
			try {
				const rows = await importToJson(file, columns);
				setRightRows(rows);
				rightGridRef.current?.resetGrid?.(rows);
			} catch (err) {
				console.error(err);
				alert('JSON 업로드 중 오류가 발생했습니다.');
			}
		});
	};

	// 하단 GRID RESET
	const handleResetRightGrid = () => {
		setRightRows([]);
		rightGridRef.current?.resetGrid?.([]);
	};

	return (
		<div className="docs-main">
			<section className="docs-section-header">
				<h1 className="docs-section-title">엑셀 / CSV / JSON Export & Import 데모</h1>
				<p className="docs-section-desc">
					상단 그리드의 데이터를 <code>엑셀 / CSV / JSON / PDF</code>로 다운로드하고,
					<br />
					다운로드한 파일을 하단 그리드에 업로드하여 다시 로딩하는 예제입니다.
				</p>
			</section>

			{/* ================= 상단: EXPORT GRID ================= */}
			<section className="docs-panel" style={{ marginBottom: 16 }}>
				<h2 className="docs-section-title" style={{ fontSize: 16, marginBottom: 8 }}>
					상단: 샘플 데이터 (Export 대상)
				</h2>
				<p className="docs-section-desc" style={{ marginBottom: 8 }}>
					상단 그리드의 데이터를 다양한 포맷으로 다운로드할 수 있습니다.
				</p>

				<div className="docs-toolbar" style={{ marginBottom: 6 }}>
					<button type="button" className="docs-btn-sm" onClick={handleExportXlsx}>
						엑셀 다운로드 (XLSX)
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleExportCsv}>
						CSV 다운로드
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleExportJson}>
						JSON 다운로드
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleExportPdf}>
						PDF 다운로드
					</button>
				</div>

				<OneGrid
					ref={leftGridRef}
					columns={columns}
					rows={leftRows}
					width="100%"
					height={360}
					options={{
						rowHeight: 32,
						editable: true,
						showRowNumber: true,
						showCheckBox: true,
						headerAlign: 'center',
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
					onRowsChange={setLeftRows}
				/>
			</section>

			{/* ================= 하단: IMPORT GRID ================= */}
			<section className="docs-panel">
				<h2 className="docs-section-title" style={{ fontSize: 16, marginBottom: 8 }}>
					하단: 업로드 대상 그리드 (Import 결과)
				</h2>
				<p className="docs-section-desc" style={{ marginBottom: 8 }}>
					엑셀 / CSV / JSON 파일을 업로드하면, 해당 데이터를 이 그리드에 로딩합니다.
				</p>

				<div className="docs-toolbar" style={{ marginBottom: 6 }}>
					<button type="button" className="docs-btn-sm" onClick={() => xlsxInputRef.current?.click()}>
						엑셀 업로드 (XLSX)
					</button>
					<button type="button" className="docs-btn-sm" onClick={() => csvInputRef.current?.click()}>
						CSV 업로드
					</button>
					<button type="button" className="docs-btn-sm" onClick={() => jsonInputRef.current?.click()}>
						JSON 업로드
					</button>
					<button type="button" className="docs-btn-sm" onClick={handleResetRightGrid}>
						그리드 초기화
					</button>
				</div>

				{/* 숨겨진 파일 인풋들 */}
				<input
					type="file"
					accept=".xlsx,.xls"
					ref={xlsxInputRef}
					style={{ display: 'none' }}
					onChange={handleImportXlsxChange}
				/>
				<input
					type="file"
					accept=".csv,text/csv"
					ref={csvInputRef}
					style={{ display: 'none' }}
					onChange={handleImportCsvChange}
				/>
				<input
					type="file"
					accept=".json,application/json"
					ref={jsonInputRef}
					style={{ display: 'none' }}
					onChange={handleImportJsonChange}
				/>

				<OneGrid
					ref={rightGridRef}
					columns={columns}
					rows={rightRows}
					width="100%"
					height={360}
					options={{
						rowHeight: 32,
						editable: true,
						showRowNumber: true,
						showCheckBox: true,
						headerAlign: 'center',
						enableColumnReorder: true,
						enableColumnResize: true,
						enableHeaderFilter: true,
					}}
					onRowsChange={setRightRows}
				/>
			</section>
		</div>
	);
};

export default ExportImportDemoPage;
