import type { LucideIcon } from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

export default function NavSection({
	queryStr,
	sectionName,
	icon,
	items,
}: {
	queryStr?: string;
	icon: LucideIcon;
	sectionName: string;
	items: { name: string; action: () => void }[];
}) {
	const Icon = icon;

	const [isOpen, setIsOpen] = useState(true);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="flex items-center">
				<h3 className="text-sm text-muted-foreground">{sectionName}</h3>
				<CollapsibleTrigger className="ml-1.5">
					<ChevronsUpDown className="stroke-muted-foreground size-4" />
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent>
				<ul className="flex flex-col gap-2 items-start my-2">
					{items.map((i) => {
						return (
							<li key={i.name + String(Math.random() * 100)}>
								<Button variant={"ghost"} onClick={i.action}>
									<Icon />
									<p>{i.name}</p>
								</Button>
							</li>
						);
					})}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
