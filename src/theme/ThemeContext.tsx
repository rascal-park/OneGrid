// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window !== 'undefined') {
			const saved = window.localStorage.getItem('onegrid-theme');
			if (saved === 'dark' || saved === 'light') return saved;

			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
				return 'light';
			}
		}
		return 'dark';
	});

	useEffect(() => {
		if (typeof document === 'undefined') return;
		const body = document.body;
		body.classList.remove('theme-dark', 'theme-light');
		body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

		try {
			window.localStorage.setItem('onegrid-theme', theme);
		} catch {
			// ignore
		}
	}, [theme]);

	const toggleTheme = () => {
		setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return ctx;
};
