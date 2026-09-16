import { Ghost, LoaderIcon, LucideTrash, Plus, Trash2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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

export default function TrashCard() {
	return (
		<div>
			<Card className="flex flex-col gap-4 p-8 rounded-none h-screen overflow-y-auto bg-background">
				<div className="flex justify-between items-center my-2">
					<div className="flex gap-4 items-center justify-between w-full">
						<h6 className="text-xl text-muted-foreground">Trash</h6>
						<div className="flex gap-3">
							<AlertDialog>
								<AlertDialogTrigger>
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

				{entryList.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{entryList.slice(0, 5).map((e) => (
							<li key={e.title}>
								<TrashEntryCard {...e} />
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
