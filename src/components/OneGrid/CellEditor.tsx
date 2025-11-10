/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import type { OneGridColumn } from './types';

interface CellEditorProps {
	column: OneGridColumn;
	draft: any;
	rowHeight: number;
	onChangeDraft: (v: any) => void;
	onCommit: () => void;
	onCancel: () => void;
	onTabNav: (shift: boolean) => void;
}

const CellEditor: React.FC<CellEditorProps> = ({
	column,
	draft,
	rowHeight,
	onChangeDraft,
	onCommit,
	onCancel,
	onTabNav,
}) => {
	const editorConfig = column.editor;
	const ref = useRef<any>(null);

	// 공통 focus / select
	useEffect(() => {
		if (ref.current) {
			ref.current.focus();
			if ('select' in ref.current) {
				ref.current.select?.();
			}
		}
	}, []);

	if (!editorConfig) return null;

	const { type } = editorConfig;

	const commonStyle: React.CSSProperties = {
		width: '100%',
		height: rowHeight - 6,
		lineHeight: `${rowHeight - 6}px`,
		fontSize: 12,
		backgroundColor: '#000',
		color: '#fff',
		border: '1px solid #888',
		borderRadius: 3,
		padding: '0 6px',
		outline: 'none',
		boxSizing: 'border-box',
	};

	function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
		if (e.key === 'Enter') {
			e.preventDefault();
			onCommit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onCancel();
		} else if (e.key === 'Tab') {
			e.preventDefault();
			onCommit();
			onTabNav(e.shiftKey);
		}
	}

	// ---------- text ----------
	if (type === 'text') {
		return (
			<input
				ref={ref}
				value={draft ?? ''}
				onChange={e => onChangeDraft(e.target.value)}
				onBlur={onCommit}
				onKeyDown={handleKeyDown}
				style={commonStyle}
			/>
		);
	}

	// ---------- number ----------
	if (type === 'number') {
		const step = editorConfig.step ?? 1;
		const min = editorConfig.min;
		const max = editorConfig.max;

		return (
			<input
				ref={ref}
				type="number"
				value={draft ?? ''}
				step={step}
				min={min}
				max={max}
				onChange={e => onChangeDraft(e.target.value)}
				onBlur={onCommit}
				onKeyDown={handleKeyDown}
				style={commonStyle}
			/>
		);
	}

	// ---------- date ----------
	// input[type=date] + 오른쪽 달력 아이콘 (동작 유지)
	if (type === 'date') {
		const inputRef = ref as React.RefObject<HTMLInputElement>;

		return (
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: rowHeight,
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<input
					ref={inputRef}
					type="date"
					value={draft ?? ''}
					onChange={e => onChangeDraft(e.target.value)}
					onBlur={onCommit}
					onKeyDown={handleKeyDown}
					style={{
						...commonStyle,
						paddingRight: 24,
					}}
				/>
				<button
					type="button"
					tabIndex={-1}
					onMouseDown={e => {
						// 포커스 유지 + showPicker는 유저 제스처로 허용
						e.preventDefault();
						if (inputRef.current) {
							(inputRef.current as any).showPicker?.();
							inputRef.current.focus();
						}
					}}
					style={{
						position: 'absolute',
						right: 4,
						top: 2,
						bottom: 2,
						width: 20,
						border: 'none',
						background: 'transparent',
						color: '#fff',
						cursor: 'pointer',
						padding: 0,
						fontSize: 14,
					}}
				>
					📅
				</button>
			</div>
		);
	}

	// ---------- dropdown (단일 / 멀티 공용) ----------
	if (type === 'dropdown') {
		const options = editorConfig.options ?? column.renderer?.props?.options ?? [];
		const multiple = editorConfig.multiple === true;

		// 멀티
		if (multiple) {
			// 기존처럼 select multiple 쓰되, Ctrl 없이 클릭만으로 토글
			const selectedValues: string[] = Array.isArray(draft)
				? draft.map(v => String(v))
				: draft != null && draft !== ''
				? String(draft)
						.split(',')
						.map((s: string) => s.trim())
						.filter(Boolean)
				: [];

			const handleMouseDown = (e: React.MouseEvent<HTMLSelectElement>) => {
				const target = e.target as HTMLOptionElement;
				if (target && target.tagName === 'OPTION') {
					e.preventDefault(); // 기본 선택 동작 막고 직접 토글
					const value = target.value;
					let next = [...selectedValues];
					if (next.includes(value)) {
						next = next.filter(v => v !== value);
					} else {
						next.push(value);
					}
					onChangeDraft(next);
				}
			};

			return (
				<select
					ref={ref as React.RefObject<HTMLSelectElement>}
					multiple
					value={selectedValues}
					onMouseDown={handleMouseDown}
					onBlur={onCommit}
					onKeyDown={handleKeyDown}
					style={{
						...commonStyle,
						height: rowHeight - 6, // 싱글과 높이 맞추기
					}}
				>
					{options.map((opt: any) => {
						const v = String(opt.value);
						const isSelected = selectedValues.includes(v);
						const label = isSelected ? `✓ ${opt.label}` : opt.label;
						return (
							<option key={v} value={v}>
								{label}
							</option>
						);
					})}
				</select>
			);
		}

		// 싱글: native select
		const valueStr = draft != null ? String(draft) : '';

		return (
			<select
				ref={ref as React.RefObject<HTMLSelectElement>}
				value={valueStr}
				onChange={e => {
					onChangeDraft(e.target.value);
				}}
				onBlur={onCommit}
				onKeyDown={handleKeyDown}
				style={commonStyle}
			>
				{options.map((opt: any) => (
					<option key={String(opt.value)} value={String(opt.value)}>
						{opt.label}
					</option>
				))}
			</select>
		);
	}

	// ---------- combo ----------
	// 입력 + 옵션 제안 (datalist) – 브라우저 기본 드롭다운으로 안정 동작
	if (type === 'combo') {
		const options = editorConfig.options ?? [];
		const listId = `onegrid-combo-${column.field}`;

		return (
			<>
				<input
					ref={ref}
					list={listId}
					value={draft ?? ''}
					placeholder="입력 또는 선택"
					onChange={e => onChangeDraft(e.target.value)}
					onBlur={onCommit}
					onKeyDown={handleKeyDown}
					style={commonStyle}
				/>
				<datalist id={listId}>
					{options.map((opt: any) => (
						<option key={String(opt.value)} value={String(opt.value)}>
							{opt.label}
						</option>
					))}
				</datalist>
			</>
		);
	}

	// ---------- custom ----------
	if (type === 'custom' && editorConfig.renderCustomEditor) {
		return (
			<>
				{editorConfig.renderCustomEditor({
					value: draft,
					row: {}, // 필요하면 OneGrid에서 row도 넘기도록 확장 가능
					rowIndex: 0,
					colIndex: 0,
					column,
					onChange: onChangeDraft,
					onCommit,
					onCancel,
				})}
			</>
		);
	}

	// fallback: text
	return (
		<input
			ref={ref}
			value={draft ?? ''}
			onChange={e => onChangeDraft(e.target.value)}
			onBlur={onCommit}
			onKeyDown={handleKeyDown}
			style={commonStyle}
		/>
	);
};

export default CellEditor;
