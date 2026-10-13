import type { LucideIcon } from "lucide-react";
import {
	ChevronDown,
	ChevronRight,
	ChevronsRight,
	ChevronsUp,
	ChevronsUpDown,
	ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import type { R } from "#/lib/libs";

export default function NavSection({
	sectionName,
	icon,
	items,
}: {
	queryStr?: string;
	icon: LucideIcon;
	sectionName: string;
	items: { data: R[]; action: (id?: number) => void };
}) {
	const Icon = icon;

	const [isOpen, setIsOpen] = useState(true);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="flex items-center">
				<h3 className="text-sm text-muted-foreground">{sectionName}</h3>
				<CollapsibleTrigger className="ml-1.5 cursor-pointer">
					{isOpen ? (
						<ChevronDown className="stroke-muted-foreground size-4" />
					) : (
						<ChevronRight className="stroke-muted-foreground size-4" />
					)}
				</CollapsibleTrigger>
			</div>

			<CollapsibleContent className="w-full radix-collapsibleContent">
				<ul className="flex flex-col gap-2 items-start my-2 w-full">
					{items.data.map((i) => {
						return (
							<li key={i.name + String(Math.random() * 100)} className="w-full">
								<Button
									variant={"ghost"}
									className="w-full justify-start cursor-pointer transition-all duration-300 dark:hover:bg-input/30"
									onClick={() => items.action(i.id)}
									asChild
								>
									<div>
										<Icon />
										<p>{i.name}</p>
									</div>
								</Button>
							</li>
						);
					})}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
