import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { recordQueries } from "#/lib/features/query";
import EntryCard from "./entrycard";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { createFlags, FLAGS } from "#/lib/utils";
import type { R } from "#/lib/libs";
import { Ghost, Plus } from "lucide-react";

function HomeFilter(data: R[]) {
	return data
		.toSorted(
			(a: R, b: R) =>
				new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
		)
		.filter((d: R) => !createFlags(d.flags).check(FLAGS.IS_DELETED));
}

export default function RecentlyCreatedCard() {
	const { data, isPending, error } = useQuery({
		...recordQueries.all(),
		select: HomeFilter,
	});

	if (!data) {
		return <div>Something went wrong, invalid data: {error?.message}</div>;
	}

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

	return (
		<div className="flex flex-col h-full gap-3">
			<div className="flex justify-between flex-row-reverse items-center ">
				<Button
					size={"lg"}
					asChild
					className="flex gap-2 rounded-full cursor-pointer"
				>
					<Link to={"/editor"}>
						<Plus className="size-4" />
						<p className="text-lg">New</p>
					</Link>
				</Button>
			</div>
			<div className="flex flex-col grow-1 h-full gap-4">
				{data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.slice(0, 5).map((e: R) => (
							<li key={e.name}>
								<EntryCard {...e} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col h-full justify-center items-center shadow-none gap-4 h-full ">
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
