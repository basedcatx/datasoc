import { useQuery } from "@tanstack/react-query";
import { FilePlus2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import { AddRecordDialog } from "./add-record-dialog";
import { RecordRow } from "./record-row";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export type HomeFilter = "all" | "drafts" | "completed" | "starred";

function matchesFilter(record: R, filter: HomeFilter) {
	const flag = createFlags(record.flags);
	if (filter === "drafts") return !flag.check(FLAGS.IS_COMPLETED);
	if (filter === "completed") return flag.check(FLAGS.IS_COMPLETED);
	if (filter === "starred") return flag.check(FLAGS.IS_FAVORITE);
	return true;
}

export default function RecentlyCreatedCard({
	filter = "all",
}: {
	filter?: HomeFilter;
}) {
	const [addOpen, setAddOpen] = useState(false);
	const { data, isPending, error } = useQuery(recordQueries.all());

	const items = useMemo(() => {
		if (!data) return [];
		return [...data]
			.filter((d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED))
			.filter((d) => matchesFilter(d.record, filter))
			.sort((a, b) => {
				const aTime = a.record.created_at
					? new Date(a.record.created_at).getTime()
					: 0;
				const bTime = b.record.created_at
					? new Date(b.record.created_at).getTime()
					: 0;
				return bTime - aTime;
			});
	}, [data, filter]);

	if (isPending) {
		return (
			<div className="flex flex-col divide-y divide-border/60">
				<Skeleton className="h-10 w-full rounded-none" />
				<Skeleton className="h-10 w-full rounded-none" />
				<Skeleton className="h-10 w-full rounded-none" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-sm text-muted-foreground">
				Something went wrong: {error.message}
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<FilePlus2 className="size-5" />
				</div>
				<p className="text-sm text-muted-foreground">No records</p>
				{filter === "all" && (
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setAddOpen(true)}
						className="gap-2 text-muted-foreground"
					>
						<Plus className="size-4" />
						New record
					</Button>
				)}
				<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />
			</div>
		);
	}

	return (
		<ul className="flex flex-col">
			{items.map((e) => (
				<RecordRow key={e.record.id ?? e.record.name} record={e.record} />
			))}
		</ul>
	);
}
