import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { readFileSync } from "fs";
import { resolve } from "path";

const pkg = JSON.parse(
	readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"),
);

const config = defineConfig({
	define: { __APP_VERSION: JSON.stringify(pkg.version) },
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({ rollupConfig: { external: [/^@sentry\//] } }),
		tailwindcss(),
		tanstackStart({
			spa: { enabled: true },
			prerender: {
				enabled: true,
				concurrency: 14,
				crawlLinks: false,
				retryCount: 3,
				retryDelay: 1000,
				maxRedirects: 5,
			},
		}),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
	server: {
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});

export default config;
