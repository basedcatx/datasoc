import { GalleryVerticalEnd } from "lucide-react";
import { Card } from "./ui/card";

export default function HomeInfoCard({
	value,
	type,
}: {
	value: string;
	type: string;
}) {
	return (
		<Card className="flex flex-col gap-14 w-full p-5">
			<GalleryVerticalEnd />
			{/* TODO: Add real api */}
			<div>
				<p className="text-3xl font-bold">{value}</p>
				<p>{type}</p>
			</div>
		</Card>
	);
}
