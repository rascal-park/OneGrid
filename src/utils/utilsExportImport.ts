// src/utils/utilsExportImport.ts
// OneGrid 용 공통 Export / Import 유틸
// - 엑셀(XLSX), CSV, PDF, JSON 다운로드
// - 엑셀(XLSX), CSV, JSON 업로드 → rows 배열로 변환
// --------------------------------------------------
// 필요 라이브러리 (클라이언트 기준):
//   npm install xlsx jspdf jspdf-autotable
// --------------------------------------------------

import NanumGothicTTF from '@assets/fonts/NanumGothic.ttf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { OneGridColumn } from '../types/types';

// =======================================
// 공통 헬퍼: 컬럼/데이터 변환
// =======================================

const INTERNAL_FIELDS = ['__rowNum__', '__rowCheck__', '_onegridRowKey', '__rowStatus__'] as const;

// =======================================
// jsPDF용 한글 폰트 로딩 헬퍼
// =======================================

let nanumFontBase64: string | null = null;

async function loadNanumFontBase64(): Promise<string> {
	if (nanumFontBase64) return nanumFontBase64;

	const res = await fetch(NanumGothicTTF);
	const buf = await res.arrayBuffer();
	const bytes = new Uint8Array(buf);

	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}

	nanumFontBase64 = btoa(binary); // TTF → base64
	return nanumFontBase64;
}

/**
 * children 구조를 가진 OneGridColumn[]에서 실제 데이터 컬럼(leaf)만 펼치기
 */
function flattenLeafColumns(cols: OneGridColumn[]): OneGridColumn[] {
	const result: OneGridColumn[] = [];
	const walk = (list: OneGridColumn[]) => {
		list.forEach(col => {
			if (col.children && col.children.length > 0) {
				walk(col.children);
			} else {
				result.push(col);
			}
		});
	};
	walk(cols);
	return result;
}

/**
 * export 시 셀 값 포맷팅
 * - 배열: "A, B, C"
 * - {label,value} 객체 배열: label 기준으로 "라벨1, 라벨2"
 * - 단일 객체: label 있으면 label, 아니면 JSON
 */
function formatCellForExport(value: any, col: OneGridColumn): any {
	if (value == null) return '';

	// 배열 (멀티 셀렉트 등)
	if (Array.isArray(value)) {
		if (value.length === 0) return '';

		// [{label, value}] 형태라면 label 기준으로 조인
		if (typeof value[0] === 'object' && value[0] !== null) {
			const labelKey = (col as any).labelKey ?? 'label';
			return value
				.map(v => (v && typeof v === 'object' ? v[labelKey] ?? '' : String(v ?? '')))
				.filter(Boolean)
				.join(', ');
		}

		// 원시 배열
		return value
			.map(v => String(v ?? ''))
			.filter(Boolean)
			.join(', ');
	}

	// 단일 객체
	if (typeof value === 'object') {
		const labelKey = (col as any).labelKey ?? 'label';
		if (labelKey in value) {
			return (value as any)[labelKey];
		}
		return JSON.stringify(value);
	}

	return value;
}

/**
 * Export용 공통 Matrix 생성
 * - header: 컬럼 헤더 텍스트 (headerName or field)
 * - data: 2차원 배열 [rowIndex][colIndex]
 * - leaf: 실제 사용된 leaf 컬럼 배열
 */
export function buildExportMatrix(columns: OneGridColumn[], rows: any[]) {
	const leaf = flattenLeafColumns(columns).filter(col => !INTERNAL_FIELDS.includes(col.field as any));

	const header = leaf.map(c => (c.headerName ?? c.field).trim());
	const data = rows.map(row =>
		leaf.map(col => {
			const raw = row[col.field];
			return formatCellForExport(raw, col);
		}),
	);

	return { header, data, leaf };
}

/**
 * CSV 셀 이스케이프 (콤마/쌍따옴표/줄바꿈 처리)
 */
function escapeCsvCell(value: any): string {
	if (value == null) return '';
	const s = String(value);
	if (/[",\r\n]/.test(s)) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

/**
 * 따옴표 처리하는 CSV 파서
 * - "a,b","c" → [ 'a,b', 'c' ]
 */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let curRow: string[] = [];
	let curCell = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const ch = text[i];
		const next = text[i + 1];

		if (ch === '"') {
			if (inQuotes && next === '"') {
				// "" → " 로 이스케이프
				curCell += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			curRow.push(curCell);
			curCell = '';
		} else if ((ch === '\n' || ch === '\r') && !inQuotes) {
			if (ch === '\r' && next === '\n') {
				i += 1; // CRLF 처리
			}
			curRow.push(curCell);
			curCell = '';
			if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
				rows.push(curRow);
			}
			curRow = [];
		} else {
			curCell += ch;
		}
	}

	if (curCell !== '' || curRow.length > 0) {
		curRow.push(curCell);
		rows.push(curRow);
	}

	// 완전 빈 행 제거
	return rows.filter(r => r.some(c => c.trim() !== ''));
}

/**
 * leaf 컬럼 기준으로 header 텍스트 → field 매핑 생성
 */
function buildHeaderToFieldMap(columns: OneGridColumn[]) {
	const leaf = flattenLeafColumns(columns).filter(col => !INTERNAL_FIELDS.includes(col.field as any));
	const headerToField = new Map<string, string>();

	leaf.forEach(col => {
		const field = col.field.trim();
		const header = (col.headerName ?? col.field).trim();

		headerToField.set(header, field);
		headerToField.set(field, field); // 백업 매핑
	});

	return { headerToField, leaf };
}

/**
 * raw object에서 leaf 필드만 남기도록 정리
 */
function sanitizeRowByColumns(raw: any, leaf: OneGridColumn[]): any {
	const allowedFields = new Set(leaf.map(c => c.field));
	const obj: any = {};
	allowedFields.forEach(field => {
		if (Object.prototype.hasOwnProperty.call(raw, field)) {
			obj[field] = raw[field];
		}
	});
	return obj;
}

// =======================================
// Export: XLSX, CSV, PDF, JSON
// =======================================

/**
 * XLSX 다운로드
 */
export function exportToXlsx(options: {
	columns: OneGridColumn[];
	rows: any[];
	fileName?: string;
	sheetName?: string;
}) {
	const { columns, rows, fileName = 'onegrid-export', sheetName = 'Sheet1' } = options;
	const { header, data } = buildExportMatrix(columns, rows);
	const aoa = [header, ...data];

	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName);

	XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * CSV 다운로드
 */
export function exportToCsv(opts: { columns: OneGridColumn[]; rows: any[]; fileName?: string }) {
	const { columns, rows, fileName = 'onegrid-sample.csv' } = opts;

	const { header, data } = buildExportMatrix(columns, rows);

	const headerLine = header.map(h => escapeCsvCell(h)).join(',');
	const bodyLines = data.map(row => row.map(v => escapeCsvCell(v)).join(','));

	const csv = [headerLine, ...bodyLines].join('\r\n');

	// 한글 안 깨지게 UTF-8 BOM 추가
	const blob = new Blob(['\uFEFF' + csv], {
		type: 'text/csv;charset=utf-8;',
	});

	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * JSON 다운로드
 * - rows 전체를 JSON 배열로 저장
 */
export function exportToJson(options: { rows: any[]; fileName?: string }) {
	const { rows, fileName = 'onegrid-export' } = options;

	const json = JSON.stringify(rows, null, 2);
	const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `${fileName}.json`;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * PDF 다운로드
 * - jsPDF + autoTable 기반 간단 테이블
 * - 컬럼 헤더/데이터는 엑셀/CSV와 동일하게 header + data 사용
 */
export async function exportToPdf(options: {
	columns: OneGridColumn[];
	rows: any[];
	fileName?: string;
	title?: string;
}) {
	const { columns, rows, fileName = 'onegrid-export', title = 'OneGrid Export' } = options;
	const { header, data } = buildExportMatrix(columns, rows);

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'pt',
		format: 'a4',
	});

	// NanumGothic 폰트 로딩 & 등록
	try {
		const fontData = await loadNanumFontBase64();
		// jsPDF 인스턴스에 폰트 등록
		(doc as any).addFileToVFS('NanumGothic.ttf', fontData);
		(doc as any).addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
		(doc as any).addFont('NanumGothic.ttf', 'NanumGothic', 'bold');
		doc.setFont('NanumGothic'); // 이후 텍스트는 이 폰트로 출력
	} catch (e) {
		console.error('NanumGothic font load failed, fallback to default font.', e);
	}

	doc.setFontSize(14);
	doc.text(title, 40, 40);

	// autoTable 타입 때문에 any로 캐스팅
	autoTable(doc as any, {
		head: [header],
		body: data,
		startY: 60,
		styles: {
			fontSize: 8,
			font: 'NanumGothic', // 본문도 한글 폰트 지정
			fontStyle: 'normal',
		},
		headStyles: {
			fillColor: [50, 50, 50],
			textColor: [255, 255, 255],
			font: 'NanumGothic',
			fontStyle: 'bold',
		},
	});

	doc.save(`${fileName}.pdf`);
}

// =======================================
// Import: XLSX, CSV, JSON
// (파일 → rows 배열)
// =======================================

/**
 * import 시 셀 값 파싱
 * - multiSelect 컬럼이면 "라벨1, 라벨2" → ['PLN', 'EDIT'] 이런 식으로 매핑
 *   (valueOptions 기준)
 */
/**
 * import 시 셀 값 파싱
 * - multi dropdown:
 *      "관리자, 사용자" 또는 "ADMIN, USER"
 *      → ['ADMIN','USER'] (내부 값)
 * - single dropdown:
 *      "관리자" 또는 "ADMIN" → 'ADMIN'
 * - 그 외: 있는 그대로
 */
function parseCellForImport(raw: any, col: OneGridColumn): any {
	const v = raw ?? '';

	const editor = col.editor;
	const editorType = editor?.type;
	const multiple = editor?.multiple === true;
	const options: any[] = editor?.options ?? col.renderer?.props?.options ?? [];

	// label / value → value 맵핑 준비
	const labelToValue = new Map<string, any>();
	const valueToValue = new Map<string, any>();
	options.forEach(opt => {
		labelToValue.set(String(opt.label), opt.value);
		valueToValue.set(String(opt.value), opt.value);
	});

	// 멀티 드롭다운
	if (editorType === 'dropdown' && multiple) {
		if (typeof v !== 'string') return v;

		const tokens = v
			.split(',')
			.map(s => s.trim())
			.filter(Boolean);

		const result: any[] = [];
		tokens.forEach(token => {
			if (labelToValue.has(token)) {
				result.push(labelToValue.get(token));
			} else if (valueToValue.has(token)) {
				result.push(valueToValue.get(token));
			} else {
				// 매칭 안 되면 그냥 문자열도 남겨둘지 말지는 선택
				result.push(token);
			}
		});

		return result;
	}

	// 단일 드롭다운
	if (editorType === 'dropdown' && !multiple) {
		const token = String(v).trim();
		if (labelToValue.has(token)) return labelToValue.get(token);
		if (valueToValue.has(token)) return valueToValue.get(token);
		return v;
	}

	return v;
}

/**
 * XLSX 업로드 → rows 배열로 변환
 * - 첫 시트를 기준으로 header 행 + body 행 파싱
 * - header 텍스트를 columns.headerName or field와 매핑
 */
export async function importToXlsx(file: File, columns: OneGridColumn[]): Promise<any[]> {
	const buffer = await file.arrayBuffer();
	const wb = XLSX.read(buffer, { type: 'array' });
	if (wb.SheetNames.length === 0) return [];

	const sheetName = wb.SheetNames[0];
	const ws = wb.Sheets[sheetName];

	const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
	if (aoa.length === 0) return [];

	const headerRow = aoa[0].map(h => (h == null ? '' : String(h).trim()));
	const bodyRows = aoa.slice(1);

	const { headerToField, leaf } = buildHeaderToFieldMap(columns);

	const result: any[] = [];
	for (const rowCells of bodyRows) {
		const raw: any = {};
		headerRow.forEach((header, idx) => {
			const field = headerToField.get(header);
			if (!field) return;

			const col = leaf.find(c => c.field === field)!;
			const cellRaw = rowCells[idx] ?? '';

			raw[field] = parseCellForImport(cellRaw, col);
		});
		const sanitized = sanitizeRowByColumns(raw, leaf);
		const hasValue = Object.values(sanitized).some(v => v !== '' && v != null);
		if (hasValue) result.push(sanitized);
	}
	return result;
}

/**
 * CSV 업로드 → rows 배열로 변환
 * - 첫 줄을 header로 보고 columns.headerName or field와 매핑
 */
export async function importToCsv(file: File, columns: OneGridColumn[]): Promise<any[]> {
	const text = await file.text();
	const rows = parseCsv(text);
	if (rows.length === 0) return [];

	const headerRow = rows[0].map(h => h.trim());
	const bodyRows = rows.slice(1);

	const { headerToField, leaf } = buildHeaderToFieldMap(columns);

	const result: any[] = [];
	for (const cells of bodyRows) {
		const raw: any = {};
		headerRow.forEach((header, idx) => {
			const field = headerToField.get(header);
			if (!field) return;

			const col = leaf.find(c => c.field === field)!;
			const cellRaw = cells[idx] ?? '';

			raw[field] = parseCellForImport(cellRaw, col);
		});
		const sanitized = sanitizeRowByColumns(raw, leaf);
		const hasValue = Object.values(sanitized).some(v => v !== '' && v != null);
		if (hasValue) result.push(sanitized);
	}
	return result;
}

/**
 * JSON 업로드 → rows 배열로 변환
 * - JSON Array 또는 단일 Object 지원
 * - columns 기준으로 허용된 필드만 남김
 */
export async function importToJson(file: File, columns: OneGridColumn[]): Promise<any[]> {
	const text = await file.text();
	if (!text.trim()) return [];

	let parsed: any;
	try {
		parsed = JSON.parse(text);
	} catch (err) {
		console.error('[importToJson] JSON parse error:', err);
		return [];
	}

	const { leaf } = buildHeaderToFieldMap(columns);

	let arr: any[] = [];
	if (Array.isArray(parsed)) {
		arr = parsed;
	} else if (parsed && typeof parsed === 'object') {
		arr = [parsed];
	} else {
		return [];
	}

	return arr.map(raw => {
		const converted: any = {};
		leaf.forEach(col => {
			if (Object.prototype.hasOwnProperty.call(raw, col.field)) {
				converted[col.field] = parseCellForImport(raw[col.field], col);
			}
		});
		return sanitizeRowByColumns(converted, leaf);
	});
}
