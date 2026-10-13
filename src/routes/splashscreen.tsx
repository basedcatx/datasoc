import { Spinner } from "#/components/ui/spinner";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/splashscreen")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col items-center justify-center h-full w-full border">
			<Spinner className="size-10" />
			<p>App is starting...</p>
		</div>
	);
}
