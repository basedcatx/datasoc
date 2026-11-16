import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { recordMutations, recordQueries } from "#/lib/features/query";
import type { R, RUpdate } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import { RecordRow } from "./record-row";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

function TrashComponent({
	children,
	data,
}: {
	children: React.ReactNode;
	data?: { record: R }[];
}) {
	const qc = useQueryClient();
	const ids = data?.map((d) => d.record.id).filter((id) => id !== undefined);
	const count = data?.length ?? 0;

	const deleteAllMutation = useMutation(
		recordMutations(qc).permanentDeleteAll(ids),
	);
	const restoreAllMutation = useMutation(
		recordMutations(qc).restoreAllDeleted(),
	);

	const handleDeleteAll = () => deleteAllMutation.mutate();
	const handleRestoreAll = () => {
		if (!data) return;
		const dataUpdates = data
			.filter((d) => d.record.id != null)
			.map((d) => ({
				update: { ...d, id: d.record.id as number },
			})) satisfies { update: RUpdate }[];
		if (dataUpdates.length > 0)
			restoreAllMutation.mutate({ data: dataUpdates });
	};

	return (
		<div className="flex w-full flex-col gap-4 px-4 py-6">
			<div className="flex items-center justify-between gap-3">
				<h1 className="text-xl font-medium tracking-tight text-foreground">
					Trash
				</h1>
				{count > 0 && (
					<div className="flex items-center gap-2">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm" className="gap-2">
									<Trash2 className="size-4" />
									Delete all
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent size="sm">
								<AlertDialogTitle>Delete all records?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete everything in trash.
								</AlertDialogDescription>
								<AlertDialogFooter>
									<AlertDialogCancel size="default" variant="outline">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										size="default"
										variant="destructive"
										onClick={handleDeleteAll}
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRestoreAll}
							className="gap-2 text-muted-foreground hover:text-foreground"
						>
							<RotateCcw className="size-4" />
							Restore all
						</Button>
					</div>
				)}
			</div>
			{children}
		</div>
	);
}

export default function TrashCard() {
	let { data, isError, error, isPending } = useQuery(recordQueries.all());

	if (isPending) {
		return (
			<TrashComponent>
				<div className="flex flex-col">
					<Skeleton className="h-10 w-full rounded-none" />
					<Skeleton className="h-10 w-full rounded-none" />
					<Skeleton className="h-10 w-full rounded-none" />
				</div>
			</TrashComponent>
		);
	}

	if (isError || !data) {
		return (
			<div className="text-sm text-muted-foreground">
				Something went wrong: {error?.message}
			</div>
		);
	}

	data = data.filter((d) =>
		createFlags(d.record.flags).check(FLAGS.IS_DELETED),
	);

	return (
		<TrashComponent data={data}>
			{data.length > 0 ? (
				<ul className="flex flex-col">
					{data.map((e) => (
						<RecordRow
							key={e.record.id ?? e.record.name}
							record={e.record}
							variant="trash"
						/>
					))}
				</ul>
			) : (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
					<p className="text-sm text-muted-foreground">Trash is empty</p>
				</div>
			)}
		</TrashComponent>
	);
}
