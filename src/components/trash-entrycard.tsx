import { LucideArrowUpRight, LucideLoader, Trash } from "lucide-react";
import type { R } from "#/lib/libs";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "./ui/context-menu";

export default function TrashEntryCard({ name, content, tags, created_at }: R) {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Card className="p-6 hover:bg-muted rounded-md dark:hover:bg-input/50 cursor-pointer">
					<div className="flex justify-between items-center">
						<div>
							<p className="text-nowrap w-md text-ellipsis font-bold text-lg">
								{name}
							</p>
							<p className="text-nowrap truncate w-sm md:w-2xl">{content}</p>
						</div>
					</div>
					<div className="flex justify-between items-center">
						<div className="flex gap-3">
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
						<p className="text-muted-foreground">created @ {created_at}</p>
					</div>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				<ContextMenuItem>
					<LucideArrowUpRight />
					Open in preview
				</ContextMenuItem>

				<ContextMenuItem variant="default">
					<LucideLoader />
					Restore
				</ContextMenuItem>

				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive">
					<Trash />
					Delete permanently
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
