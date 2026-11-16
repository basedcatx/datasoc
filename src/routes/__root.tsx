import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { PdfDropOverlay } from "#/components/pdf/pdf-drop-overlay";
import { PdfUploadDialogClient } from "#/components/pdf/pdf-upload-dialog-client";
import { TooltipProvider } from "#/components/ui/tooltip";
import type { BackupStatus } from "#/lib/backup";
import { isTauri } from "#/lib/utils";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Datasoc",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/** biome-ignore lint/security/noDangerouslySetInnerHtml: Init theme script */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased wrap:anywhere h-full w-full selection:bg-[rgba(79,184,178,0.24)] overflow-hidden">
				<ThemeProvider
					attribute={"class"}
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<BackupNetworkMonitor />
					<Toaster richColors />
					<PdfDropOverlay />
					<PdfUploadDialogClient />
					<SessionProvider>
						<div className="flex h-full w-full bg-background">
							<Sidebar />
							<div className="min-w-0 flex-1">
								<TooltipProvider>
									<Outlet />
								</TooltipProvider>
							</div>
						</div>
					</SessionProvider>
					<Footer />
					{/* Would reactivate this only when needed */}
					{/* <TauriQueryInspector /> */}
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

function BackupNetworkMonitor() {
	useEffect(() => {
		if (!isTauri()) return;
		let active = true;
		let previousError: string | null = null;
		let unlisten: (() => void) | undefined;

		void listen<BackupStatus>("backup-status", ({ payload }) => {
			if (payload.lastError && payload.lastError !== previousError) {
				previousError = payload.lastError;
				toast.error(`Automatic cloud backup failed: ${payload.lastError}`);
			} else if (!payload.lastError && previousError) {
				previousError = null;
				toast.success("Automatic cloud backup has resumed.");
			}
		})
			.then((stopListening) => {
				if (active) unlisten = stopListening;
				else stopListening();
			})
			.catch((error) => {
				toast.error(`Could not monitor cloud backup status: ${String(error)}`);
			});

		const retryOnReconnect = () => {
			void invoke("retry_backup").catch((error) => {
				toast.error(`Could not resume cloud backup: ${String(error)}`);
			});
		};
		window.addEventListener("online", retryOnReconnect);

		return () => {
			active = false;
			unlisten?.();
			window.removeEventListener("online", retryOnReconnect);
		};
	}, []);

	return null;
}
