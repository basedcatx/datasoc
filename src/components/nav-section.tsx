import type { LucideIcon } from "lucide-react";
import { BookOpen, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import type { R } from "#/lib/libs";
import { RecordTypes } from "#/lib/utils";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function NavSection({
	sectionName,
	items,
}: {
	queryStr?: string;
	icon?: LucideIcon;
	sectionName: string;
	items: { data: { record: R }[]; action: (id?: number) => void };
}) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="flex items-center px-2">
				<h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground/70">
					{sectionName}
				</h3>
				<CollapsibleTrigger className="ml-1 cursor-pointer text-muted-foreground/60 hover:text-muted-foreground">
					{isOpen ? (
						<ChevronDown className="size-3.5" />
					) : (
						<ChevronRight className="size-3.5" />
					)}
				</CollapsibleTrigger>
			</div>

			<CollapsibleContent className="w-full radix-collapsibleContent">
				<ul className="mt-1 flex w-full flex-col gap-0.5">
					{items.data.map((i) => {
						const isPdf = i.record.record_type === RecordTypes.PDF;
						const Icon = isPdf ? BookOpen : FileText;
						return (
							<li key={i.record.id ?? i.record.name} className="w-full min-w-0">
								<button
									type="button"
									className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
									onClick={() => items.action(i.record.id)}
									title={i.record.name}
								>
									<Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
									<span className="truncate">{i.record.name}</span>
								</button>
							</li>
						);
					})}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
