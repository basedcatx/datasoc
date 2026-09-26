import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Ghost, Plus } from "lucide-react";
import { recordQueries } from "#/lib/features/query";
import EntryCard from "./entrycard";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export default function RecentlyCreatedCard() {
	const { data, isPending } = useSuspenseQuery(recordQueries.all());

	data.sort(
		(a, b) =>
			new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
	);

	if (isPending) {
		return (
			<div>
				<Card className="flex flex-col gap-4 p-8 rounded-none ring-0">
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-between flex-row-reverse items-center ">
				<Button
					size={"lg"}
					asChild
					className="flex gap-4 rounded-full cursor-pointer"
				>
					<Link to={"/editor"}>
						<Plus className="size-6" />
						<p className="text-xl">New</p>
					</Link>
				</Button>
			</div>
			<Card className="flex flex-col grow-1 h-full gap-4 rounded-none shadow-none ring-0">
				{data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.slice(0, 5).map((e) => (
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
			</Card>
		</div>
	);
}
