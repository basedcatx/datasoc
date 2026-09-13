import { ArrowUpRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export default function EntryCard({
	title,
	desc,
	state,
	tags,
	createdAt,
}: {
	title: string;
	desc: string;
	state: string;
	tags: string[];
	createdAt: string;
}) {
	return (
		<Card className="p-3 hover:bg-muted rounded-none dark:hover:bg-input/50 cursor-pointer">
			<div className="flex justify-between items-center">
				<div>
					<p className="text-nowrap w-md text-ellipsis font-bold text-lg">
						{title}
					</p>
					<p className="text-nowrap truncate w-sm md:w-2xl">{desc}</p>
				</div>
				<ArrowUpRight />
			</div>
			<div className="flex justify-between items-center">
				<div className="flex gap-3">
					<Badge className="p-2">{state}</Badge>
					<ul className="flex gap-1">
						{tags.slice(0, 3).map((tag) => (
							<li key={tag}>
								<Badge variant={"secondary"} className="p-2">
									{tag}
								</Badge>
							</li>
						))}
					</ul>
				</div>
				<p className="text-muted-foreground">Created {createdAt}</p>
			</div>
		</Card>
	);
}
