import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { cn } from "cn";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { recordQueries } from "#/lib/features/query";
import { createFlags, FLAGS } from "#/lib/utils";
import RecordCard from "./record-card";

export function RecordListPane() {
	const { data, isPending } = useQuery(recordQueries.all());
	const selectedId = useSelector(appStore, (s) => s.selectedRecordId);

	const selectRecord = (id: number) => {
		appStore.setState((prev) => ({ ...prev, selectedRecordId: id }));
	};

	if (isPending) {
		return (
			<div className="p-4 flex flex-col gap-2">
				<div className="h-20 animate-pulse bg-muted rounded" />
				<div className="h-20 animate-pulse bg-muted rounded" />
				<div className="h-20 animate-pulse bg-muted rounded" />
				<div className="h-20 animate-pulse bg-muted rounded" />
				<div className="h-20 animate-pulse bg-muted rounded" />
			</div>
		);
	}

	const records = (data ?? []).filter(
		(d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED),
	);

	return (
		<div className="flex flex-col h-full overflow-y-auto p-2 bg-background">
			{records.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
					No records
				</div>
			) : (
				<ul className="flex flex-col gap-1">
					{records.map((e) => {
						const recordId = e.record.id;
						if (!recordId) return null;
						return (
							<li key={recordId}>
								<button
									onClick={() => selectRecord(recordId)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											selectRecord(recordId);
										}
									}}
									className={cn(
										"flex w-full",
										selectedId === recordId ? "bg-primary/10 rounded" : "",
									)}
								>
									<RecordCard {...e.record} variant="list" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
