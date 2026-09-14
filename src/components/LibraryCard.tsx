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
import { useReducer } from "react";
import LibraryEntryCard from "./library-entrycard";

function handleStateReducer(state: any, action: any) {
	switch (action.type) {
		case "togglesort": {
			if (state.sortby === "Ascending") {
				return { ...state, sortby: "Descending" };
			}
			return { ...state, sortby: "Ascending" };
		}

		case "changefilter": {
			return { ...state, filterby: action.filterby };
		}

		default:
			throw new Error("Invalid action type");
	}
}

export default function LibraryCard() {
	const [state, dispatch] = useReducer(handleStateReducer, {
		sortby: "Ascending",
		filterby: "Name",
	});

	return (
		<div>
			<Card className="flex flex-col gap-4 p-8 rounded-none h-screen overflow-y-auto bg-background">
				<div className="flex justify-between items-center my-2">
					<div className="flex gap-4 items-center">
						<h6 className="text-xl text-muted-foreground">Library</h6>
						<Button className="flex p-4 cursor-pointer rounded-full">
							<Plus />
							<p className="text-lg">New</p>
						</Button>
					</div>

					<div className="flex gap-2">
						<Input className="max-w-xs" placeholder="Type to filter..." />
						<ComboxboxInputGroup dispatch={dispatch} />
						<Button
							variant={"secondary"}
							onClick={(e) => {
								e.preventDefault();
								dispatch({ type: "togglesort" });
							}}
						>
							<ArrowDownAz />
							<p>Sort by</p>
							{state.sortby === "Ascending" ? <ChevronUp /> : <ChevronDown />}
						</Button>
					</div>
				</div>

				{entryList.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{entryList.slice(0, 5).map((e) => (
							<li key={e.title}>
								<LibraryEntryCard {...e} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center h-screen items-center gap-4">
						<Ghost className="size-22 stroke-muted-foreground" />

						<p className="text-muted-foreground text-lg">
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
	{
		value: "Info",
		items: ["Tags", "Name"],
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
				<InputGroupAddon>
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

const entryList = [
	{
		title: "Hydraulic Pump Noise Troubleshooting",
		desc: "Step-by-step diagnostic process for identifying cavitation and air ingress in high-pressure hydraulic pumps.",
		tags: ["pump", "maintenance", "hydraulics"],
		state: "completed",
		createdAt: new Date().toDateString(),
	},
	{
		title: "Transmission Fluid Leak Inspection",
		desc: "Guide to locating pinhole leaks around the transmission casing and replacing damaged torque converter seals. asdkjflasdjflasdjfkasdjflkajsdlfkajsdlfasfdddddddddddddddddddasdkfasdjfasdlfkajsldfkajsldkfjalsdkfjalsdjflasdjflasdjf",
		tags: ["car", "transmission", "fluid"],
		state: "in-progress",
		createdAt: new Date().toDateString(),
	},
	{
		title: "Brake Caliper Piston Overhaul",
		desc: "Procedure for disassembling sticking brake calipers, replacing rubber dust boots, and bleeding the brake lines.",
		tags: ["car", "brakes", "repair"],
		state: "completed",
		createdAt: new Date().toDateString(),
	},
	{
		title: "Centrifugal Pump Impeller Alignment",
		desc: "Instructions for verifying shaft runout, replacing worn bearings, and setting correct impeller clearance.",
		tags: ["pump", "industrial", "alignment"],
		state: "pending",
		createdAt: new Date().toDateString(),
	},
	{
		title: "Engine Overheating Diagnostic Flow",
		desc: "Systematic check covering thermostat operation, radiator airflow restriction, and coolant flow rates.",
		tags: ["car", "engine", "cooling"],
		state: "in-progress",
		createdAt: new Date().toDateString(),
	},
];
