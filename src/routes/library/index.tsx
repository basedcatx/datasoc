import { createFileRoute } from "@tanstack/react-router";
import LibraryCard from "#/components/LibraryCard";
import PreviewCard from "#/components/PreviewCard";

export const Route = createFileRoute("/library/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="h-dvh w-full overflow-y-auto bg-background">
			<LibraryCard />
			<PreviewCard />
		</div>
	);
}
