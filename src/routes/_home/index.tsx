import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AddRecordDialog } from "#/components/add-record-dialog";
import PreviewCard from "#/components/PreviewCard";
import RecentlyCreatedCard, {
	type HomeFilter,
} from "#/components/recently-created-card";
import { Button } from "#/components/ui/button";
import { recordQueries } from "#/lib/features/query";
import { createFlags, FLAGS } from "#/lib/utils";

export const Route = createFileRoute("/_home/")({
	component: RouteComponent,
});

const filters: { key: HomeFilter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "drafts", label: "Drafts" },
	{ key: "completed", label: "Completed" },
	{ key: "starred", label: "Starred" },
];

function RouteComponent() {
	const [addOpen, setAddOpen] = useState(false);
	const [filter, setFilter] = useState<HomeFilter>("all");
	const { data } = useQuery(recordQueries.all());

	const counts = useMemo(() => {
		const active = (data ?? []).filter(
			(d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED),
		);
		return {
			all: active.length,
			drafts: active.filter(
				(d) => !createFlags(d.record.flags).check(FLAGS.IS_COMPLETED),
			).length,
			completed: active.filter((d) =>
				createFlags(d.record.flags).check(FLAGS.IS_COMPLETED),
			).length,
			starred: active.filter((d) =>
				createFlags(d.record.flags).check(FLAGS.IS_FAVORITE),
			).length,
		};
	}, [data]);

	return (
		<div className="h-dvh w-full overflow-y-auto bg-background">
			<div className="flex w-full flex-col px-4 py-6 gap-4">
				<header className="mb-6 flex items-center justify-between gap-3">
					<h1 className="text-xl font-medium tracking-tight text-foreground">
						Home
					</h1>
					<Button
						variant="secondary"
						size="sm"
						className="gap-1.5 text-muted-foreground hover:text-foreground"
						onClick={() => setAddOpen(true)}
					>
						<Plus className="size-4" />
						New
					</Button>
				</header>

				<div className="mb-2 flex items-center gap-1">
					{filters.map((f) => {
						const active = filter === f.key;
						return (
							<button
								key={f.key}
								type="button"
								onClick={() => setFilter(f.key)}
								className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${active
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
									}`}
							>
								<span>{f.label}</span>
								<span className="text-muted-foreground/70">
									{counts[f.key]}
								</span>
							</button>
						);
					})}
				</div>

				<section className="pb-6">
					<RecentlyCreatedCard filter={filter} />
				</section>
			</div>
			<PreviewCard />
			<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
