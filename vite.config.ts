// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	base: '/OneGrid/',
	build: {
		outDir: 'docs',
	},
	resolve: {
		alias: {
			'@assets': path.resolve(__dirname, 'src/assets'),
		},
	},
});
