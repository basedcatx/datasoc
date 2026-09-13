import { Ghost, Plus } from "lucide-react";
import EntryCard from "./entrycard";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function LibraryCard() {
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

					<Input />
				</div>

				{entryList.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{entryList.slice(0, 5).map((e) => (
							<li key={e.title}>
								<EntryCard {...e} />
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
