// src/components/OneGrid/core/CellEditor.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OneGridColumn, ValidatorFn } from '../../../types/types';
import { runValidators } from '../validator/validator';

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

	// 현재 셀의 에러 메시지 (있으면 title 툴팁 + 빨간 테두리)
	const [error, setError] = useState<string | null>(null);

	// validate에서 쓸 draft 최신값
	const draftRef = useRef<any>(draft);
	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	// 컬럼에 정의된 validator 목록 (없으면 undefined)
	const validators: ValidatorFn[] | undefined = useMemo(() => {
		const colValidators = column.validators;
		if (!colValidators) return undefined;
		return Array.isArray(colValidators) ? colValidators : [colValidators];
	}, [column.validators]);

	// 공통 focus / select
	useEffect(() => {
		if (ref.current) {
			ref.current.focus();
			if ('select' in ref.current) {
				ref.current.select?.();
			}
		}
	}, []);

	// 값 검증 함수 (옵션: tooltip(브라우저 기본 에러 말풍선)을 바로 띄울지 여부)
	const validateCurrent = useCallback(
		(value: any, opts?: { showTooltip?: boolean }): boolean => {
			if (!validators || validators.length === 0) {
				setError(null);
				const el = ref.current as any;
				if (el && typeof el.setCustomValidity === 'function') {
					el.setCustomValidity('');
				}
				return true;
			}

			const msg = runValidators(validators, value);
			setError(msg ?? null);

			const el = ref.current as any;
			if (el && typeof el.setCustomValidity === 'function') {
				el.setCustomValidity(msg ?? '');
				if (msg && opts?.showTooltip && typeof el.reportValidity === 'function') {
					// 브라우저 기본 tooltip을 즉시 표시
					el.reportValidity();
				}
			}

			return !msg;
		},
		[validators],
	);

	// 셀 밖 클릭 시에도 검증 태우기
	useEffect(() => {
		if (!validators || validators.length === 0) return;

		const handlePointerDownCapture = (e: PointerEvent | MouseEvent) => {
			const el = ref.current as HTMLElement | null;
			if (!el) return;

			const target = e.target as Node;

			// 현재 에디터 안을 클릭한 경우는 무시
			if (el === target || el.contains(target)) return;

			// 에디터 밖(=다른 셀 포함)을 클릭했는데 값이 invalid면
			// 클릭을 막고 에러 tooltip 표시
			const ok = validateCurrent(draftRef.current, { showTooltip: true });
			if (!ok) {
				e.preventDefault();
				e.stopPropagation();
			}
			// ok면 그대로 둠 → blur 발생 → tryCommit → 정상 커밋
		};

		// pointerdown + mousedown 둘 다 캡쳐에서 잡기
		document.addEventListener('pointerdown', handlePointerDownCapture as any, true);
		document.addEventListener('mousedown', handlePointerDownCapture as any, true);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDownCapture as any, true);
			document.removeEventListener('mousedown', handlePointerDownCapture as any, true);
		};
	}, [validators, validateCurrent]);

	const type = editorConfig?.type ?? 'text';

	// 공통 스타일 + 에러 시 빨간 테두리
	const commonStyle: React.CSSProperties = {
		width: '100%',
		height: rowHeight - 6,
		lineHeight: `${rowHeight - 6}px`,
		fontSize: 12,
		backgroundColor: 'var(--bg)',
		color: 'var(--fg)',
		border: error ? '1px solid #ff4d4f' : '1px solid #888',
		borderRadius: 3,
		padding: '0 6px',
		outline: 'none',
		boxSizing: 'border-box',
	};

	// 입력값 변경 시: draft 변경 + 즉시 검증(tooltip은 commit 시에만)
	const handleChange = (next: any) => {
		onChangeDraft(next);
		validateCurrent(next, { showTooltip: false });
	};

	// blur / Enter / Tab 전에 검증해서 실패하면 커밋 막기
	const tryCommit = (viaTab?: boolean, shift?: boolean) => {
		const ok = validateCurrent(draft, { showTooltip: true });
		if (!ok) {
			// 에러가 있으면 커밋하지 않고 편집 유지
			return;
		}
		onCommit();
		if (viaTab) {
			onTabNav(!!shift);
		}
	};

	function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
		if (e.key === 'Enter') {
			e.preventDefault();
			tryCommit(false);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onCancel();
		} else if (e.key === 'Tab') {
			e.preventDefault();
			tryCommit(true, e.shiftKey);
		}
	}

	// ---------- text ----------
	if (type === 'text') {
		return (
			<input
				ref={ref}
				value={draft ?? ''}
				onChange={e => handleChange(e.target.value)}
				onBlur={() => tryCommit(false)}
				onKeyDown={handleKeyDown}
				style={commonStyle}
				title={error ?? ''} // 에러 툴팁 (hover용)
			/>
		);
	}

	// ---------- number ----------
	if (type === 'number') {
		const step = editorConfig?.step ?? 1;
		const min = editorConfig?.min;
		const max = editorConfig?.max;

		return (
			<input
				ref={ref}
				type="number"
				value={draft ?? ''}
				step={step}
				min={min}
				max={max}
				onChange={e => handleChange(e.target.value)}
				onBlur={() => tryCommit(false)}
				onKeyDown={handleKeyDown}
				style={commonStyle}
				title={error ?? ''}
			/>
		);
	}

	// ---------- date ----------
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
				title={error ?? ''}
			>
				<input
					ref={inputRef}
					type="date"
					value={draft ?? ''}
					onChange={e => handleChange(e.target.value)}
					onBlur={() => tryCommit(false)}
					onKeyDown={handleKeyDown}
					className="onegrid-date-input"
					style={{
						...commonStyle,
						paddingRight: 4,
					}}
				/>
				<button
					type="button"
					tabIndex={-1}
					onMouseDown={e => {
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
		const options = editorConfig?.options ?? column.renderer?.props?.options ?? [];
		const multiple = editorConfig?.multiple === true;

		// 멀티
		if (multiple) {
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
					e.preventDefault();
					const value = target.value;
					let next = [...selectedValues];
					if (next.includes(value)) {
						next = next.filter(v => v !== value);
					} else {
						next.push(value);
					}
					handleChange(next);
				}
			};

			return (
				<select
					ref={ref as React.RefObject<HTMLSelectElement>}
					multiple
					value={selectedValues}
					onMouseDown={handleMouseDown}
					onBlur={() => tryCommit(false)}
					onKeyDown={handleKeyDown}
					style={{
						...commonStyle,
						height: rowHeight - 6,
					}}
					title={error ?? ''}
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

		// 싱글
		const valueStr = draft != null ? String(draft) : '';

		return (
			<select
				ref={ref as React.RefObject<HTMLSelectElement>}
				value={valueStr}
				onChange={e => handleChange(e.target.value)}
				onBlur={() => tryCommit(false)}
				onKeyDown={handleKeyDown}
				style={commonStyle}
				title={error ?? ''}
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
	if (type === 'combo') {
		const options = editorConfig?.options ?? [];
		const listId = `onegrid-combo-${column.field}`;

		return (
			<>
				<input
					ref={ref}
					list={listId}
					value={draft ?? ''}
					placeholder="입력 또는 선택"
					onChange={e => handleChange(e.target.value)}
					onBlur={() => tryCommit(false)}
					onKeyDown={handleKeyDown}
					style={commonStyle}
					title={error ?? ''}
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
	if (type === 'custom' && editorConfig?.renderCustomEditor) {
		return (
			<>
				{editorConfig.renderCustomEditor({
					value: draft,
					row: {}, // 필요하면 OneGrid에서 row도 넘기도록 확장 가능
					rowIndex: 0,
					colIndex: 0,
					column,
					onChange: (v: any) => {
						handleChange(v);
					},
					onCommit: () => tryCommit(false),
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
			onChange={e => handleChange(e.target.value)}
			onBlur={() => tryCommit(false)}
			onKeyDown={handleKeyDown}
			style={commonStyle}
			title={error ?? ''}
		/>
	);
};

export default CellEditor;
