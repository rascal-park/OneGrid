import React, { type JSX } from 'react';
import type { OneGridColumn, OneGridRenderParams } from './types';

interface CellRendererProps {
	column: OneGridColumn;
	value: any;
	row: any;
	rowIndex: number;
	colIndex: number;
	rowHeight: number;
}

const CellRenderer: React.FC<CellRendererProps> = ({ column, value, row, rowIndex, colIndex, rowHeight }) => {
	const renderParams: OneGridRenderParams = {
		value,
		row,
		rowIndex,
		colIndex,
		column,
	};

	const formattedValue = column.formatter?.format?.(value, row, rowIndex, colIndex) ?? value;
	const align = column.align ?? 'left';

	if (column.formatter?.render) {
		const node = column.formatter.render({
			...renderParams,
			formattedValue,
		});
		return wrapBase(node, rowHeight, align);
	}

	if (column.renderer) {
		const { type, props } = column.renderer;
		const node = renderByType(type, {
			...renderParams,
			formattedValue,
			rowHeight,
			rendererProps: props ?? {},
		});
		return wrapBase(node, rowHeight, align);
	}

	if (column.renderCell) {
		const node = column.renderCell(renderParams);
		return wrapBase(node, rowHeight, align);
	}

	return wrapBase(<span>{formattedValue != null ? String(formattedValue) : ''}</span>, rowHeight, align);
};

export default CellRenderer;

function hAlignToJustify(align: 'left' | 'center' | 'right') {
	switch (align) {
		case 'center':
			return 'center';
		case 'right':
			return 'flex-end';
		default:
			return 'flex-start';
	}
}

function wrapBase(
	content: React.ReactNode,
	rowHeight: number,
	align: 'left' | 'center' | 'right' = 'left',
): JSX.Element {
	return (
		<span
			style={{
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
				fontSize: 12,
				lineHeight: `${rowHeight}px`,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: hAlignToJustify(align),
				textAlign: align,
				width: '100%',
				gap: 4,
			}}
		>
			{content}
		</span>
	);
}

interface RenderByTypeParams extends OneGridRenderParams {
	formattedValue: any;
	rowHeight: number;
	rendererProps: Record<string, any>;
}

function renderByType(type: string, params: RenderByTypeParams): React.ReactNode {
	const { value, formattedValue, rendererProps } = params;

	switch (type) {
		// 1) 텍스트
		case 'text': {
			return formattedValue != null ? String(formattedValue) : '';
		}

		// 2) 이미지
		case 'image': {
			const src = String(formattedValue ?? value ?? '');
			if (!src) return '';

			const alt = rendererProps.alt ?? rendererProps.label ?? String(rendererProps.field ?? '');

			const fit = rendererProps.fit ?? 'contain';
			const align = rendererProps.align ?? 'left';
			const width = rendererProps.width as number | undefined;
			const height = rendererProps.height as number | undefined;

			const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

			const onClick = rendererProps.onClick as ((p: OneGridRenderParams) => void) | undefined;

			return (
				<span
					style={{
						display: 'inline-flex',
						justifyContent,
						alignItems: 'center',
						width: '100%',
					}}
				>
					<img
						src={src}
						alt={alt}
						style={{
							maxHeight: height ?? params.rowHeight - 4,
							maxWidth: width ?? '100%',
							objectFit: fit,
							borderRadius: 2,
							cursor: onClick ? 'pointer' : 'default',
						}}
						onClick={e => {
							if (!onClick) return;
							e.stopPropagation();
							onClick(params);
						}}
					/>
				</span>
			);
		}

		// 3) 아이콘
		//    - rendererProps.icon 기준으로 아이콘 표시
		//    - value / formattedValue 는 라벨 텍스트로만 사용
		case 'icon': {
			const onClick = rendererProps.onClick as ((p: OneGridRenderParams) => void) | undefined;

			const position: 'left' | 'right' = rendererProps.position === 'right' ? 'right' : 'left';
			const size = rendererProps.size ?? 14;

			// 셀 value는 텍스트 라벨 용도
			const text = formattedValue != null ? String(formattedValue) : String(value ?? '');

			const iconFromProps = rendererProps.icon;
			let iconNode: React.ReactNode = null;

			if (React.isValidElement(iconFromProps)) {
				// 1) SVG ReactComponent 같은 경우
				iconNode = iconFromProps;
			} else if (typeof iconFromProps === 'string') {
				// 2) 문자열인 경우 → 이미지 URL or 텍스트 아이콘 구분
				const isImageUrl = /\.(svg|png|jpe?g|gif|webp)$/i.test(iconFromProps) || iconFromProps.startsWith('data:image');

				if (isImageUrl) {
					// 이미지 경로 → <img>
					iconNode = (
						<img
							src={iconFromProps}
							alt={rendererProps.alt ?? ''}
							style={{
								width: size,
								height: size,
								objectFit: 'contain',
								display: 'block',
							}}
						/>
					);
				} else {
					// 이모지/텍스트 아이콘
					iconNode = (
						<span
							style={{
								fontSize: size,
								lineHeight: 1,
							}}
						>
							{iconFromProps}
						</span>
					);
				}
			}

			const iconEl = iconNode ? (
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{iconNode}
				</span>
			) : null;

			const body = (
				<>
					{position === 'left' && iconEl}
					{text && <span style={{ margin: iconEl ? '0 4px' : 0 }}>{text}</span>}
					{position === 'right' && iconEl}
				</>
			);

			if (!onClick) return body;

			return (
				<span
					style={{
						cursor: 'pointer',
						display: 'inline-flex',
						alignItems: 'center',
					}}
					onClick={e => {
						e.stopPropagation();
						onClick(params);
					}}
				>
					{body}
				</span>
			);
		}

		// 4) 체크박스
		case 'checkbox': {
			const checkValue = rendererProps.checkValue !== undefined ? rendererProps.checkValue : true;
			const uncheckValue = rendererProps.uncheckValue !== undefined ? rendererProps.uncheckValue : false;

			const current = formattedValue ?? value;
			const checked = current === checkValue;

			const onToggle = rendererProps.onToggle as ((p: OneGridRenderParams & { nextValue: any }) => void) | undefined;

			const handleClick = (e: React.MouseEvent) => {
				e.stopPropagation();
				if (!onToggle) return;
				const nextValue = checked ? uncheckValue : checkValue;
				onToggle({
					...params,
					nextValue,
				});
			};

			return (
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 16,
						height: 16,
						borderRadius: 2,
						border: '1px solid #666',
						backgroundColor: checked ? '#2d8cff' : 'transparent',
						fontSize: 10,
						cursor: onToggle ? 'pointer' : 'default',
					}}
					onClick={handleClick}
				>
					{checked && '✔'}
				</span>
			);
		}

		// 5) 버튼
		case 'button': {
			const label = formattedValue != null ? formattedValue : value ?? '';
			const onClick = rendererProps.onClick as ((p: OneGridRenderParams) => void) | undefined;

			return (
				<button
					type="button"
					style={{
						padding: '2px 8px',
						fontSize: 11,
						borderRadius: 4,
						border: '1px solid #555',
						backgroundColor: '#333',
						color: '#fff',
						cursor: 'pointer',
					}}
					onClick={e => {
						e.stopPropagation();
						onClick?.(params);
					}}
				>
					{label}
				</button>
			);
		}

		// 6) 드롭다운 리스트
		case 'dropdown': {
			const options = rendererProps.options as { value: any; label: string }[] | undefined;

			if (!options || options.length === 0) {
				return formattedValue ?? value ?? '';
			}

			const mapToLabel = (v: any): string => {
				const found = options.find(o => o.value === v);
				if (!found) return String(v ?? '');
				return found.label;
			};

			if (Array.isArray(value)) {
				const labels = value.map(v => mapToLabel(v));
				return labels.join(', ');
			}

			return mapToLabel(value);
		}

		// 7) 커스텀
		case 'custom': {
			const renderCustom = params.column.renderer?.renderCustom;
			if (renderCustom) {
				return renderCustom({
					value,
					row: params.row,
					rowIndex: params.rowIndex,
					colIndex: params.colIndex,
					column: params.column,
				});
			}
			return formattedValue != null ? String(formattedValue) : '';
		}

		default:
			return formattedValue != null ? String(formattedValue) : '';
	}
}
