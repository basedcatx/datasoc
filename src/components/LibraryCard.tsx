import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import {
	ArrowDownAz,
	ChevronDown,
	ChevronUp,
	LayoutGrid,
	List,
	LucideInbox,
	Plus,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { getPreferences, setPreferences } from "#/lib/preferences";
import { createFlags, FLAGS } from "#/lib/utils";
import { AddRecordDialog } from "./add-record-dialog";
import RecordCard from "./record-card";
import { RecordRow } from "./record-row";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

function LibraryFilter(data: { record: R }[], filter: string, sort: string) {
	const sortedData = [...data].sort((a, b) => {
		if (!(a.record.updated_at && b.record.updated_at)) {
			return (a.record.id ?? 0) - (b.record.id ?? 0);
		}

		if (sort === "ASC") {
			return (
				new Date(a.record.updated_at).getTime() -
				new Date(b.record.updated_at).getTime()
			);
		}
		return (
			new Date(b.record.updated_at).getTime() -
			new Date(a.record.updated_at).getTime()
		);
	});

	return sortedData
		.filter((d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED))
		.filter((d) => {
			if (!filter) {
				return d;
			}
			return d.record.name.toLowerCase().startsWith(filter.toLowerCase());
		});
}

function LibraryComponent({
	children,
	onAddClick,
}: {
	children: (
		data: { record: R }[],
		isPending: boolean,
		view: "list" | "grid",
	) => React.ReactNode;
	onAddClick: () => void;
}) {
	const [sortby, setSortby] = useState<"ASC" | "DESC">("ASC");
	const [nameFilter, setNameFilter] = useState("");
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [view, setView] = useState<"list" | "grid">(
		() => getPreferences().defaultView,
	);
	const deferredNameFilter = useDeferredValue(nameFilter);

	const {
		data: rawData,
		isPending,
		isError,
		error,
	} = useQuery(recordQueries.all());

	const allTags = (() => {
		const tags = new Set<string>();
		for (const r of rawData ?? []) {
			for (const t of r.record.tags) {
				tags.add(t);
			}
		}
		return Array.from(tags).sort();
	})();

	const data = (() => {
		let filtered = LibraryFilter(rawData ?? [], deferredNameFilter, sortby);
		if (tagFilter) {
			filtered = filtered.filter((r) => r.record.tags.includes(tagFilter!));
		}
		return filtered;
	})();

	if (isError || !data) {
		return <div>An error occurred: {error?.message}</div>;
	}

	return (
		<div className="h-dvh w-full overflow-y-auto bg-background">
			<div className="flex w-full flex-col gap-4 px-4 py-6">
				<header className="flex items-center justify-between gap-3">
					<h1 className="text-xl font-medium tracking-tight text-foreground">
						Library
					</h1>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-muted-foreground hover:text-foreground"
						onClick={onAddClick}
					>
						<Plus className="size-4" />
						New
					</Button>
				</header>

				<div className="flex flex-wrap items-center gap-2">
					<Input
						className="h-8 max-w-xs text-sm"
						placeholder="Filter by name..."
						value={nameFilter}
						onChange={(e) => setNameFilter(e.target.value)}
					/>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-muted-foreground hover:text-foreground"
						onClick={() => setSortby((old) => (old === "ASC" ? "DESC" : "ASC"))}
					>
						<ArrowDownAz className="size-4" />
						<span className="text-sm">{sortby}</span>
						{sortby === "ASC" ? (
							<ChevronUp className="size-3.5" />
						) : (
							<ChevronDown className="size-3.5" />
						)}
					</Button>
					<div className="ml-auto flex items-center gap-1">
						<Button
							variant={view === "list" ? "secondary" : "ghost"}
							size="icon"
							className="size-8"
							onClick={() => {
								if (view !== "list") {
									setView("list");
									setPreferences({ defaultView: "list" });
								}
							}}
							title="List view"
						>
							<List className="size-4" />
						</Button>
						<Button
							variant={view === "grid" ? "secondary" : "ghost"}
							size="icon"
							className="size-8"
							onClick={() => {
								if (view !== "grid") {
									setView("grid");
									setPreferences({ defaultView: "grid" });
								}
							}}
							title="Grid view"
						>
							<LayoutGrid className="size-4" />
						</Button>
					</div>
				</div>

				{allTags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						<button
							type="button"
							onClick={() => setTagFilter(null)}
							className={cn(
								"rounded-md px-2 py-1 text-sm transition-colors",
								tagFilter === null
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
							)}
						>
							All
						</button>
						{allTags.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
								className={cn(
									"rounded-md px-2 py-1 text-sm transition-colors",
									tagFilter === tag
										? "bg-accent text-foreground"
										: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
								)}
							>
								#{tag}
							</button>
						))}
					</div>
				)}

				{children(data, isPending, view)}
			</div>
		</div>
	);
}

export default function LibraryCard() {
	const [addOpen, setAddOpen] = useState(false);
	const handleAddClick = () => setAddOpen(true);
	return (
		<>
			<LibraryComponent onAddClick={handleAddClick}>
				{(data, isPending, view) => {
					if (isPending) {
						return (
							<div className="flex flex-col ">
								<Skeleton className="h-10 w-full rounded-none" />
								<Skeleton className="h-10 w-full rounded-none" />
								<Skeleton className="h-10 w-full rounded-none" />
							</div>
						);
					}

					if (data.length === 0) {
						return (
							<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
								<LucideInbox />
								<p className="text-sm text-muted-foreground">No records, click to create a new</p>
								<Button
									size="sm"
									onClick={handleAddClick}
									className="gap-2"
								>
									<Plus className="size-4" />
									New record
								</Button>
							</div>
						);
					}

					if (view === "grid") {
						return (
							<ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{data.map((e) => (
									<li key={e.record.id ?? e.record.name} className="min-w-0">
										<RecordCard {...e.record} variant="grid" />
									</li>
								))}
							</ul>
						);
					}

					return (
						<ul className="flex flex-col">
							{data.map((e) => (
								<RecordRow
									key={e.record.id ?? e.record.name}
									record={e.record}
								/>
							))}
						</ul>
					);
				}}
			</LibraryComponent>
			<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />
		</>
	);
}
