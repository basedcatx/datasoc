// src/routes/api/auth/$.ts
import { createFileRoute } from "@tanstack/react-router";
import { handlers } from "@/server/auth";

const handleAuth = async ({ request }: { request: Request; context: any }) => {
	const url = new URL(request.url);

	if (url.pathname.endsWith("/_log")) {
		return new Response(null, { status: 200 });
	}

	return request.method === "GET"
		? handlers.GET(request as any)
		: handlers.POST(request as any);
};

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: handleAuth,
			POST: handleAuth,
		},
	},
});
