import { useQuery } from "@tanstack/react-query";
import { Ghost, Plus } from "lucide-react";
import { useState } from "react";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import { AddRecordDialog } from "./add-record-dialog";
import RecordCard from "./record-card";
import { Button } from "./ui/button";
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
	const [addOpen, setAddOpen] = useState(false);
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
								<RecordCard {...e.record} variant="list" />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center items-center gap-4 h-full p-8">
						<Ghost className="size-32 stroke-muted-foreground" />
						<p className="text-muted-foreground text-lg text-center">
							No entries yet. Add your first document or PDF.
						</p>
						<Button
							variant="outline"
							size="lg"
							onClick={() => setAddOpen(true)}
							className="flex items-center gap-2"
						>
							<Plus className="size-4" />
							Add entry
						</Button>
						<p className="text-muted-foreground text-sm text-center max-w-xs">
							Documents are editable notes; PDFs are read-only and always start
							as completed.
						</p>
						<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />
					</div>
				)}
			</div>
		</div>
	);
}
