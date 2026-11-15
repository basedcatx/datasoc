import { useQuery } from "@tanstack/react-query";
import { Ghost } from "lucide-react";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import EntryCard from "./entrycard";
import { Skeleton } from "./ui/skeleton";

function HomeFilter(data: { record: R }[]) {
	return [...data]
		.sort((a, b) => {
			const aTime = a.record.created_at;
			const bTime = b.record.created_at;
			if (!aTime || !bTime) {
				return 0;
			}
			return new Date(bTime).getTime() - new Date(aTime).getTime();
		})
		.filter((d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED));
}

export default function RecentlyCreatedCard() {
	const { data, isPending, error } = useQuery({
		...recordQueries.all(),
		select: HomeFilter,
	});

	if (isPending) {
		return (
			<div>
				<div className="flex flex-col gap-4 rounded-xl">
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
				</div>
			</div>
		);
	}

	if (!data) {
		return <div>Something went wrong, invalid data: {error?.message}</div>;
	}

	return (
		<div className="flex flex-col h-full gap-3">
			<div className="flex flex-col grow h-full gap-4">
				{data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.slice(0, 5).map((e) => (
							<li key={e.record.name}>
								<EntryCard {...e.record} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center items-center shadow-none gap-4 h-full ">
						<Ghost className="size-30 stroke-muted-foreground" />
						<p className="text-muted-foreground text-lg shimmer">
							No entry found. Click on new to populate
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
