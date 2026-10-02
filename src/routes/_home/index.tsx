import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	DraftingCompass,
	HeartIcon,
	LibraryBig,
	LucideCheck,
} from "lucide-react";
import HomeInfoCard from "#/components/home-infocard";
import PreviewCard from "#/components/PreviewCard";
import RecentlyCreatedCard from "#/components/recently-created-card";
import { Skeleton } from "#/components/ui/skeleton";
import { recordQueries } from "#/lib/features/query";
import { createFlags, FLAGS } from "#/lib/utils";
import { useEffect } from "react";
import { mockRecords } from "#/lib/mockdata";
import { insertRecord, type R } from "#/lib/libs";

export const Route = createFileRoute("/_home/")({
	component: RouteComponent,
});

function InfoCardSection() {
	const { data, isPending, error } = useQuery(recordQueries.all());

	if (isPending) {
		return (
			<section className="grid grid-cols-4 px-8 gap-3 w-full">
				<Skeleton className="w-full h-40" />
				<Skeleton className="w-full h-40" />
				<Skeleton className="w-full h-40" />
				<Skeleton className="w-full h-40" />
			</section>
		);
	}

	if (!data) {
		return (
			<div>Something went wrong: Invalid data received: {error?.message}</div>
		);
	}

	return (
		<section className="grid grid-cols-4 gap-3">
			<HomeInfoCard
				type="Saved Records"
				value={data.length.toString()}
				icon={<LibraryBig />}
			></HomeInfoCard>
			<HomeInfoCard
				type="Draft"
				value={data
					.filter((d: R) => !createFlags(d.flags).check(FLAGS.IS_COMPLETED))
					.length.toString()}
				icon={<DraftingCompass />}
			></HomeInfoCard>
			<HomeInfoCard
				type="Completed"
				value={data
					.filter((d: R) => createFlags(d.flags).check(FLAGS.IS_COMPLETED))
					.length.toString()}
				icon={<LucideCheck />}
			></HomeInfoCard>
			<HomeInfoCard
				type="Starred"
				value={data
					.filter((d: R) => createFlags(d.flags).check(FLAGS.IS_FAVORITE))
					.length.toString()}
				icon={<HeartIcon className="fill-red-200" />}
			></HomeInfoCard>
		</section>
	);
}

function RouteComponent() {
	return (
		<div className="w-full flex flex-col gap-8 overflow-y-auto h-dvh py-4 px-8 scroll-fade scrollbar-thin bg-background">
			<InfoCardSection />
			<RecentlyCreatedCard />
			<PreviewCard />
		</div>
	);
}
