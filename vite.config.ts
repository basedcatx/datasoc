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
	readFileSync(resolve(__dirname, "package.json"), "utf-8"),
);

const config = defineConfig({
	define: { __APP_VERSION: JSON.stringify(pkg.version) },
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({ rollupConfig: { external: [/^@sentry\//] } }),
		tailwindcss(),
		tanstackStart(),
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
