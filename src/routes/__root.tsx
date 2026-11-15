import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PdfDropOverlay } from "#/components/pdf/pdf-drop-overlay";
import { PdfUploadDialogClient } from "#/components/pdf/pdf-upload-dialog-client";
import { RecordDetailPane } from "#/components/record-detail-pane";
import { RecordListPane } from "#/components/record-list-pane";
import { TooltipProvider } from "#/components/ui/tooltip";
import { TauriQueryInspector } from "#/integrations/tanstack-query/tauri-query-inspector";
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
					<Toaster richColors />
					<PdfDropOverlay />
					<PdfUploadDialogClient />
					<SessionProvider>
						<div className="h-full w-full flex">
							<Sidebar />
							{/* Three-pane layout on wide screens: list + detail */}
							<div className="hidden lg:flex lg:w-1/3 border-r border-border min-w-0">
								<RecordListPane />
							</div>
							<div className="flex-1 min-w-0 relative">
								{/* On wide screens, show detail pane; on narrow, show full page route */}
								<div className="hidden lg:flex flex-col h-full">
									<RecordDetailPane />
								</div>
								<div className="lg:hidden">
									<TooltipProvider>
										<Outlet />
									</TooltipProvider>
								</div>
							</div>
						</div>
					</SessionProvider>
					<Footer />
					{/* Would reactivate this only when needed */}
					<TauriQueryInspector />
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
