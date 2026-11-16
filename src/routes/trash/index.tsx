import { createFileRoute } from "@tanstack/react-router";
import PreviewCard from "#/components/PreviewCard";
import TrashCard from "#/components/TrashCard";

export const Route = createFileRoute("/trash/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="h-dvh w-full overflow-y-auto bg-background">
			<TrashCard />
			<PreviewCard />
		</div>
	);
}
