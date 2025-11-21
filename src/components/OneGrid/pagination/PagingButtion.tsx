// src/components/OneGrid/PagingButton.tsx
import React from 'react';

export interface PagingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
}

const PagingButton: React.FC<PagingButtonProps> = ({ children, style, ...rest }) => {
	const baseStyle: React.CSSProperties = {
		padding: '2px 4px',
		minWidth: 24,
		fontSize: 11,
		borderRadius: 4,
		border: '1px solid var(--grid-footer-button-border, #444)',
		backgroundColor: 'var(--grid-footer-button-bg, #222)',
		color: 'var(--grid-footer-button-fg, #f5f5f5)',
		cursor: rest.disabled ? 'default' : 'pointer',
		opacity: rest.disabled ? 0.4 : 1,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	};

	const mergedStyle = { ...baseStyle, ...style };

	return (
		<button type="button" {...rest} style={mergedStyle}>
			{children}
		</button>
	);
};

export default PagingButton;
