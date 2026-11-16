import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import {
	ArrowDownAz,
	Check,
	ChevronDown,
	ChevronUp,
	Filter,
	LayoutGrid,
	List,
	LucideInbox,
	Plus,
	Search,
	X,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { getPreferences, setPreferences } from "#/lib/preferences";
import { createFlags, FLAGS } from "#/lib/utils";
import { AddRecordDialog } from "./add-record-dialog";
import RecordCard from "./record-card";
import { RecordRow } from "./record-row";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./ui/popover";
import { Skeleton } from "./ui/skeleton";

function FilterOption({
	label,
	selected,
	onSelect,
}: {
	label: string;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onSelect}
			className={cn(
				"flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
				selected
					? "bg-accent text-accent-foreground"
					: "text-foreground hover:bg-accent/60",
			)}
		>
			<span className="truncate">{label}</span>
			{selected && <Check aria-hidden="true" className="size-4 shrink-0" />}
		</button>
	);
}

function formatMetaOption(entry: string) {
	const separator = entry.indexOf(":");
	if (separator === -1) return entry;
	return `${entry.slice(0, separator)}: ${entry.slice(separator + 1)}`;
}

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
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedMeta, setSelectedMeta] = useState<string[]>([]);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [filterSearch, setFilterSearch] = useState("");
	const [view, setView] = useState<"list" | "grid">(
		() => getPreferences().defaultView,
	);
	const deferredNameFilter = useDeferredValue(nameFilter);
	const deferredFilterSearch = useDeferredValue(filterSearch);

	const {
		data: rawData,
		isPending,
		isError,
		error,
	} = useQuery(recordQueries.all());

	const allTags = (() => {
		const tags = new Set<string>();
		for (const r of rawData ?? []) {
			if (createFlags(r.record.flags).check(FLAGS.IS_DELETED)) continue;
			for (const t of r.record.tags) {
				tags.add(t);
			}
		}
		return Array.from(tags).sort();
	})();
	const allMeta = (() => {
		const meta = new Set<string>();
		for (const r of rawData ?? []) {
			if (createFlags(r.record.flags).check(FLAGS.IS_DELETED)) continue;
			for (const entry of r.record.meta) {
				if (entry.trim()) meta.add(entry);
			}
		}
		return Array.from(meta).sort();
	})();
	const normalizedFilterSearch = deferredFilterSearch.trim().toLowerCase();
	const visibleTags = allTags.filter((tag) =>
		tag.toLowerCase().includes(normalizedFilterSearch),
	);
	const visibleMeta = allMeta.filter((entry) =>
		formatMetaOption(entry).toLowerCase().includes(normalizedFilterSearch),
	);

	const data = (() => {
		let filtered = LibraryFilter(rawData ?? [], deferredNameFilter, sortby);
		if (selectedTags.length > 0) {
			filtered = filtered.filter((r) =>
				selectedTags.some((tag) => r.record.tags.includes(tag)),
			);
		}
		if (selectedMeta.length > 0) {
			filtered = filtered.filter((r) =>
				selectedMeta.some((entry) => r.record.meta.includes(entry)),
			);
		}
		return filtered;
	})();
	const hasActiveFilters = Boolean(
		nameFilter.trim() || selectedTags.length || selectedMeta.length,
	);
	const clearFilters = () => {
		setNameFilter("");
		setSelectedTags([]);
		setSelectedMeta([]);
		setFilterSearch("");
	};
	const toggleTag = (tag: string) => {
		setSelectedTags((current) =>
			current.includes(tag)
				? current.filter((value) => value !== tag)
				: [...current, tag],
		);
	};
	const toggleMeta = (entry: string) => {
		setSelectedMeta((current) =>
			current.includes(entry)
				? current.filter((value) => value !== entry)
				: [...current, entry],
		);
	};

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
						aria-label="Filter by record name"
						value={nameFilter}
						onChange={(e) => setNameFilter(e.target.value)}
					/>
					<Popover
						open={filtersOpen}
						onOpenChange={(open) => {
							setFiltersOpen(open);
							if (!open) setFilterSearch("");
						}}
					>
						<PopoverTrigger asChild>
							<Button
								variant={selectedTags.length + selectedMeta.length > 0 ? "secondary" : "outline"}
								size="sm"
								className="gap-2"
								aria-label={`Filters${selectedTags.length + selectedMeta.length > 0 ? `, ${selectedTags.length + selectedMeta.length} selected` : ""}`}
							>
								<Filter className="size-4" />
								Filters
								{selectedTags.length + selectedMeta.length > 0 && (
									<Badge variant="outline" className="h-5 px-1.5">
										{selectedTags.length + selectedMeta.length}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="start"
							sideOffset={8}
							className="w-[min(22rem,calc(100vw-1rem))] overflow-hidden p-0"
						>
							<div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
								<div>
									<p className="text-sm font-medium">Filter records</p>
									<p className="text-xs text-muted-foreground">
										Match any selected value in each group.
									</p>
								</div>
								{selectedTags.length + selectedMeta.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearFilters}
									>
										Clear
									</Button>
								)}
							</div>
							<div className="border-b border-border p-3">
								<div className="relative">
									<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={filterSearch}
										onChange={(event) => setFilterSearch(event.target.value)}
										placeholder="Search tags and metadata..."
										aria-label="Search filter options"
										className="h-8 pl-8 text-sm"
									/>
								</div>
							</div>
							<div className="max-h-[min(60dvh,24rem)] space-y-4 overflow-y-auto p-3">
								<section aria-labelledby="library-tag-filters">
									<h2
										id="library-tag-filters"
										className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
									>
										Tags
									</h2>
									{visibleTags.length > 0 ? (
										<div className="space-y-0.5">
											{visibleTags.map((tag) => (
												<FilterOption
													key={tag}
													label={`#${tag}`}
													selected={selectedTags.includes(tag)}
													onSelect={() => toggleTag(tag)}
												/>
											))}
										</div>
									) : (
										<p className="px-2 py-2 text-xs text-muted-foreground">
											{allTags.length === 0 ? "No tags available." : "No matching tags."}
										</p>
									)}
								</section>
								<section aria-labelledby="library-meta-filters">
									<h2
										id="library-meta-filters"
										className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
									>
										Metadata
									</h2>
									{visibleMeta.length > 0 ? (
										<div className="space-y-0.5">
											{visibleMeta.map((entry) => (
												<FilterOption
													key={entry}
													label={formatMetaOption(entry)}
													selected={selectedMeta.includes(entry)}
													onSelect={() => toggleMeta(entry)}
												/>
											))}
										</div>
									) : (
										<p className="px-2 py-2 text-xs text-muted-foreground">
											{allMeta.length === 0
												? "No metadata available."
												: "No matching metadata."}
										</p>
									)}
								</section>
							</div>
						</PopoverContent>
					</Popover>
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

				{(selectedTags.length > 0 ||
					selectedMeta.length > 0 ||
					nameFilter.trim()) && (
					<fieldset className="flex min-w-0 flex-wrap items-center gap-1.5">
						<legend className="sr-only">Active filters</legend>
						{selectedTags.map((tag) => (
							<Badge key={tag} variant="secondary" className="gap-1">
								#{tag}
								<button
									type="button"
									aria-label={`Remove tag filter ${tag}`}
									className="rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onClick={() => toggleTag(tag)}
								>
									<X className="size-3" />
								</button>
							</Badge>
						))}
						{selectedMeta.map((entry) => (
							<Badge key={entry} variant="outline" className="gap-1">
								Metadata: {formatMetaOption(entry)}
								<button
									type="button"
									aria-label={`Remove metadata filter ${formatMetaOption(entry)}`}
									className="rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onClick={() => toggleMeta(entry)}
								>
									<X className="size-3" />
								</button>
							</Badge>
						))}
						{nameFilter.trim() && (
							<Badge variant="outline" className="gap-1">
								Name: {nameFilter.trim()}
								<button
									type="button"
									aria-label="Clear name filter"
									className="rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onClick={() => setNameFilter("")}
								>
									<X className="size-3" />
								</button>
							</Badge>
						)}
						<Button variant="ghost" size="sm" onClick={clearFilters}>
							Clear all
						</Button>
					</fieldset>
				)}

				{!isPending && data.length === 0 && hasActiveFilters ? (
					<div className="flex flex-col items-center gap-2 py-12 text-center">
						<p className="text-sm text-muted-foreground">
							No records match these filters.
						</p>
						<Button variant="ghost" size="sm" onClick={clearFilters}>
							Clear filters
						</Button>
					</div>
				) : (
					children(data, isPending, view)
				)}
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
