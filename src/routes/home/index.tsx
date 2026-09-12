import { createFileRoute } from "@tanstack/react-router";
import HomeInfoCard from "#/components/home-infocard";

export const Route = createFileRoute("/home/")({
	component: RouteComponent,
});

function InfoCardSection() {
	return (
		<section className="grid grid-cols-4 gap-3 w-full">
			<HomeInfoCard type="Saved Records" value="30"></HomeInfoCard>
			<HomeInfoCard type="Draft" value="30"></HomeInfoCard>
			<HomeInfoCard type="Completed" value="30"></HomeInfoCard>
			<HomeInfoCard type="Starred" value="30"></HomeInfoCard>
		</section>
	);
}

function RouteComponent() {
	return (
		<div className="px-4 min-w-full">
			<InfoCardSection />
		</div>
	);
}
