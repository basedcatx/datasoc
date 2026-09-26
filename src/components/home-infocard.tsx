import { Card } from "./ui/card";
import type { ReactNode } from "react";

export default function HomeInfoCard({
	icon,
	value,
	type,
}: {
	icon: ReactNode;
	value: string;
	type: string;
}) {
	return (
		<Card className="flex flex-col gap-14 rounded-none w-full p-5">
			{icon}
			{/* TODO: Add real api */}
			<div>
				<p className="text-3xl font-bold">{value}</p>
				<p>{type}</p>
			</div>
		</Card>
	);
}
