import { createFileRoute } from "@tanstack/react-router";
import LibraryCard from "#/components/LibraryCard";

export const Route = createFileRoute("/library/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<LibraryCard />
		</div>
	);
}
