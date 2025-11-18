import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs['recommended-latest'],
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		rules: {
			// any 허용
			'@typescript-eslint/no-explicit-any': 'off',
			'react-refresh/only-export-components': 'off',

			// JS 기본 no-unused-vars 끄기 (TS 버전이 대신함)
			'no-unused-vars': 'off',

			// TS unused-vars 설정
			// - 언더스코어로 시작하면(_undoStack, _foo) 무시
			// - 에러 말고 경고로만 보고 싶으면 'warn'
			//   완전 끄고 싶으면 'off'
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
]);
