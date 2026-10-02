import { useQuery } from "@tanstack/react-query";
import { Ghost, LoaderIcon, LucideTrash, Plus, Trash2Icon } from "lucide-react";
import { recordQueries } from "#/lib/features/query";

import TrashEntryCard from "./trash-entrycard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { readonly } from "zod";
import { Skeleton } from "./ui/skeleton";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";

function TrashComponent({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<Card className="flex flex-col gap-4 p-8 rounded-none h-screen overflow-y-auto bg-background">
				<div className="flex justify-between items-center my-2">
					<div className="flex gap-4 items-center justify-between w-full">
						<h6 className="text-xl text-muted-foreground">Trash</h6>
						<div className="flex gap-3">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant={"default"}
										className="flex p-6 cursor-pointer font-medium rounded-full bg-destructive hover:bg-destructive"
									>
										<LucideTrash className="size-6" />
										<p className="text-lg">Delete all</p>
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent size="sm">
									<AlertDialogTrigger>
										<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
											<Trash2Icon />
										</AlertDialogMedia>
										<AlertDialogTitle>Delete records?</AlertDialogTitle>
										<AlertDialogDescription>
											This would parmanently delete all records in the trash
										</AlertDialogDescription>
									</AlertDialogTrigger>
									<AlertDialogFooter>
										<AlertDialogCancel variant="outline">
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction variant="destructive">
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							<Button
								variant={"default"}
								className="flex p-6 cursor-pointer font-medium rounded-full"
							>
								<LoaderIcon />
								<p className="text-lg">Restore all</p>
							</Button>
						</div>
					</div>
				</div>

				{children}
			</Card>
		</div>
	);
}

export default function TrashCard() {
	let { data, isError, error, isPending } = useQuery(recordQueries.all());

	if (isError || !data) {
		return <div>An error occurred (Trash): {error?.message}</div>;
	}

	if (isPending) {
		return (
			<TrashComponent>
				<Skeleton className="w-full h-30" />
				<Skeleton className="w-full h-30" />
				<Skeleton className="w-full h-30" />
				<Skeleton className="w-full h-30" />
			</TrashComponent>
		);
	}

	if (!data) {
		return (
			<div className="text-destructive">
				Error: something went wrong invalid data in Library
			</div>
		);
	}

	data = (data as R[]).filter((d) =>
		createFlags(d.flags).check(FLAGS.IS_DELETED),
	);

	return (
		<TrashComponent>
			{data.length > 0 ? (
				<ul className="flex gap-4 flex-col">
					{data.slice(0, 5).map((e) => (
						<li key={e.id}>
							<TrashEntryCard {...e} />
						</li>
					))}
				</ul>
			) : (
				<div className="flex flex-col justify-center h-screen items-center gap-8">
					<Ghost className="size-30 stroke-muted-foreground" />

					<p className="text-muted-foreground shimmer text-lg text-wrap w-80 text-center">
						No record found in the trash. Click on new to create one
					</p>

					<Button className="flex items-center w-xs p-4 cursor-pointer rounded-full">
						<Plus />
						<p className="text-lg">New</p>
					</Button>
				</div>
			)}
		</TrashComponent>
	);
}
