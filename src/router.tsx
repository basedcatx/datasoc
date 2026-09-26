import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		Wrap: ({ children }) => (
			<PersistQueryClientProvider
				client={context.queryClient}
				persistOptions={{
					persister: context.persistor,
					maxAge: 24 * 60 * 60 * 1000,
					buster: __APP_VERSION,
				}}
			>
				{children}
			</PersistQueryClientProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient,
		wrapQueryClient: false,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}

declare const __APP_VERSION: string;
