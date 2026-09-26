import {
	ArrowDownAz,
	ChevronDown,
	ChevronUp,
	Filter,
	Ghost,
	Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

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
import { useState } from "react";
import LibraryEntryCard from "./library-entrycard";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import { Skeleton } from "./ui/skeleton";
import type { R } from "#/lib/libs";

export default function LibraryCard() {
	const [sortby, setSortby] = useState<"ASC" | "DESC">("ASC");
	const [nameFilter, setNameFilter] = useState("");

	let { data, isPending, isError, error } = useQuery(recordQueries.all());

	if (isError || !data) {
		return <div>An error occurred: {error?.message}</div>;
	}

	if (!data) {
		return (
			<div className="text-destructive">
				Error: something went wrong invalid data in Library
			</div>
		);
	}

	const sortedData = data.sort((a, b) => {
		if (!(a.updated_at && b.updated_at)) {
			return (a.id ?? 0) - (b.id ?? 0);
		}

		if (sortby === "ASC") {
			return (
				new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
			);
		}
		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});

	const nameFiltered = sortedData.filter((d) => {
		if (!nameFilter) {
			return d;
		}
		return d.name.startsWith(nameFilter);
	});

	data = nameFiltered;

	if (isPending) {
		return (
			<div>
				<Card className="flex flex-col gap-4 p-8 rounded-none h-screen overflow-y-auto bg-background">
					<div className="flex justify-between items-center my-2">
						<div className="flex gap-4 items-center">
							<h6 className="text-xl text-muted-foreground">Library</h6>
							<Link to={"/editor"}>
								<Button className="flex p-4 cursor-pointer rounded-full">
									<Plus />
									<p className="text-lg">New</p>
								</Button>
							</Link>
						</div>
					</div>

					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
				</Card>
			</div>
		);
	}

	return (
		<div>
			<Card className="flex flex-col gap-4 p-8 rounded-none h-screen overflow-y-auto bg-background">
				<div className="flex justify-between items-center my-2">
					<div className="flex gap-4 items-center mx-2">
						<h6 className="text-xl text-muted-foreground">Library</h6>
						<Link to={"/editor"}>
							<Button className="flex p-4 cursor-pointer rounded-full">
								<Plus />
								<p className="text-lg">New</p>
							</Button>
						</Link>
					</div>

					<div className="flex gap-2">
						<Input
							className="max-w-xs"
							placeholder="Type to filter..."
							onChange={(e) => setNameFilter(e.target.value)}
						/>
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

				{data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.map((e) => (
							<li key={e.name}>
								<LibraryEntryCard {...e} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center h-screen items-center gap-4">
						<Ghost className="size-30 stroke-muted-foreground" />

						<p className="text-muted-foreground shimmer text-lg">
							No record found. Click on new to create one
						</p>

						<Button className="flex items-center w-xs p-4 cursor-pointer rounded-full">
							<Plus />
							<p className="text-lg">New</p>
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
}

const filters = [
	{
		value: "Status",
		items: ["Completed", "Drafted"],
	},
] as const;

export function ComboxboxInputGroup({
	dispatch,
}: {
	dispatch: (action: any) => void;
}) {
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
