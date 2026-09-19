import { createFileRoute } from "@tanstack/react-router";
import HomeInfoCard from "#/components/home-infocard";
import RecentlyCreatedCard from "#/components/recently-created-card";
import RecentlyViewedCard from "#/components/recently-viewed-card";
import { useSelector } from "@tanstack/react-store";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import PreviewCard from "#/components/PreviewCard";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { StorageManager } from "#/lib/StorageManager";

export const Route = createFileRoute("/_home/")({
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

function RecentlyCreatedSection() {
	return <RecentlyCreatedCard />;
}

function RecentlyViewedSection() {
	return <RecentlyViewedCard />;
}

function RouteComponent() {
	StorageManager().then();
	return (
		<div className="w-full flex flex-col gap-8 overflow-y-auto h-screen scroll-fade p-4 scrollbar-thin">
			<InfoCardSection />
			<RecentlyCreatedSection />
			<RecentlyViewedSection />
			<PreviewCard />
		</div>
	);
}
