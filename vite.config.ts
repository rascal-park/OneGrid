// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	base: '/OneGrid/', // ✅ 레포 이름이랑 똑같이!
	build: {
		outDir: 'docs', // ✅ main/docs 로 배포할 거면 이렇게 (아래 설명 참고)
	},
});
