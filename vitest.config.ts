import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		exclude: ['src/**/*'],
		include: ['tests/**/*.test.ts'],
	},
})
