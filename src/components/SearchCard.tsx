import { Link } from "@tanstack/react-router";
import {
	ArrowDownAz,
	ChevronDown,
	ChevronUp,
	Filter,
	Ghost,
	Plus,
	SearchSlash,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import LibraryEntryCard from "./library-entrycard";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import type { R } from "#/lib/libs";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import { createFlags, FLAGS } from "#/lib/utils";

function Component({
	children,
	query,
	page,
}: {
	children: (data: R[], isPending: boolean) => React.ReactNode;
	query: string;
	page: string;
}) {
	const [sortby, setSortby] = useState<"ASC" | "DESC">("ASC");

	const { data, isPending, isError, error } = useQuery({
		...recordQueries.search(query),
		select: (data) => {
			switch (page) {
				case "starred": {
					return data.filter((r) => {
						const flag = createFlags(r.flags);

						return (
							!flag.check(FLAGS.IS_DELETED) && flag.check(FLAGS.IS_FAVORITE)
						);
					});
				}
				case "deleted": {
					return data.filter((r) =>
						createFlags(r.flags).check(FLAGS.IS_DELETED),
					);
				}
				default:
					return data.filter(
						(r) => !createFlags(r.flags).check(FLAGS.IS_DELETED),
					);
			}
		},
	});

	if (isError || !data) {
		return <div>An error occurred: {error?.message}</div>;
	}

	return (
		<div>
			<Card className="flex flex-col gap-4 p-8 rounded-none h-dvh overflow-y-auto bg-background">
				<div className="flex justify-between items-center my-2">
					<div className="flex gap-4 items-center mx-2">
						<h6 className="text-xl text-muted-foreground max-w-xs max-md:text-md truncate text-nowrap">
							Search: {query}
						</h6>
					</div>

					<div className="flex gap-2">
						<Button
							variant={"secondary"}
							onClick={(e) => {
								e.preventDefault();
								setSortby((old) => {
									if (old === "ASC") {
										return "DESC";
									}
									return "ASC";
								});
							}}
						>
							<ArrowDownAz />
							<p>Sort by: {sortby}</p>
							{sortby === "ASC" ? <ChevronUp /> : <ChevronDown />}
						</Button>
					</div>
				</div>
				{children(data, isPending)}
			</Card>
		</div>
	);
}

export default function SearchCard({
	query,
	page,
}: {
	query: string;
	page: string;
}) {
	return (
		<Component query={query} page={page}>
			{(data, isPending) => {
				if (isPending) {
					return (
						<>
							<Skeleton className="w-full h-30" />
							<Skeleton className="w-full h-30" />
							<Skeleton className="w-full h-30" />
							<Skeleton className="w-full h-30" />
							<Skeleton className="w-full h-30" />
							<Skeleton className="w-full h-30" />
						</>
					);
				}

				return data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.map((e) => (
							<li key={e.name} className="cv-list-item">
								<LibraryEntryCard {...e} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center h-screen items-center gap-4">
						<SearchSlash className="size-30 stroke-muted-foreground" />

						<p className="text-muted-foreground shimmer text-lg">
							No record found. Click on new to create one
						</p>

						<Button className="flex items-center w-xs p-4 cursor-pointer rounded-full">
							<Plus />
							<p className="text-lg">New</p>
						</Button>
					</div>
				);
			}}
		</Component>
	);
}

export function ComboxboxInputGroup({
	dispatch,
}: {
	dispatch: (action: any) => void;
}) {
	const filters = [
		{
			value: "Status",
			items: ["Completed", "Drafted"],
		},
	] as const;

	return (
		<Combobox
			items={filters}
			onInputValueChange={(value) => {
				dispatch({ type: "changefilter", filterby: value });
			}}
		>
			<ComboboxInput placeholder="Filter list by">
				<InputGroupAddon contentEditable={false}>
					<Filter />
				</InputGroupAddon>
			</ComboboxInput>
			<ComboboxContent alignOffset={-28} className="w-60">
				<ComboboxEmpty>No filter selected</ComboboxEmpty>
				<ComboboxList className={"flex flex-col gap-4"}>
					{(group) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(item) => (
									<ComboboxItem key={item} value={item} className={"px-4"}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxCollection>
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
