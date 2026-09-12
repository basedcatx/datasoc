import { Ghost, Plus } from "lucide-react";
import EntryCard from "./entrycard";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function RecentlyCreatedCard() {
	return (
		<div>
			<Card className="flex flex-col gap-4 p-4 rounded-xs">
				<div className="flex justify-between items-center my-2">
					<h6 className="text-sm text-muted-foreground">Recently created</h6>
					<Button size={"lg"} className="flex gap-4 rounded-full p-4">
						<Plus className="size-6" />
						<p className="text-xl">New</p>
					</Button>
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
					<div className="flex flex-col justify-center items-center gap-4 my-8">
						<Ghost className="size-18 stroke-muted-foreground" />
						<p className="text-muted-foreground">
							No entry found. Click on new to populate
						</p>
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
