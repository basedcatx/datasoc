import { createFileRoute } from "@tanstack/react-router";
import LibraryCard from "#/components/LibraryCard";
import PreviewCard from "#/components/PreviewCard";

export const Route = createFileRoute("/library/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<LibraryCard />
			<PreviewCard />
		</div>
	);
}
