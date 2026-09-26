import {
	ArrowUpRight,
	Heart,
	Pencil,
	Search,
	SquarePen,
	Tags,
	Trash,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { Link } from "@tanstack/react-router";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { htmlContent } from "#/routes/view/$reportId";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import { cn } from "cn";

export default function EntryCard({
	name,
	content,
	tags,
	id,
	created_at,
	flags,
}: R) {
	const handlePreview = (id: string) => {
		//Placeholder
		appStore.setState((prev) => ({
			...prev,
			preview: { content: htmlContent },
		}));
	};

	const flag = createFlags(flags);

	return (
		<ContextMenu>
			<ContextMenuTrigger className="w-full">
				<Link to={"/view/$reportId"} params={{ reportId: id!.toString() }}>
					<Card className="p-6 hover:bg-muted rounded-md dark:hover:bg-input/50 cursor-pointer  mx-1">
						<div className="flex justify-between items-center">
							<div>
								<p className="text-nowrap w-md text-ellipsis font-bold text-lg">
									{name}
								</p>
								<p className="text-nowrap truncate w-sm md:w-2xl">{content}</p>
							</div>
							<ArrowUpRight />
						</div>
						<div className="flex justify-between items-center">
							<div className="flex gap-3">
								<Badge
									className={cn(
										"p-3 bg-input text-input-foreground",
										flag.check(FLAGS.IS_COMPLETED) && "bg-green/30",
									)}
								>
									{flag.check(FLAGS.IS_COMPLETED) ? "Completed" : "In progress"}
								</Badge>
								<ul className="flex gap-1">
									{tags.slice(0, 3).map((tag) => (
										<li key={tag}>
											<Badge variant={"secondary"} className="p-3">
												{tag}
											</Badge>
										</li>
									))}
								</ul>
							</div>
							<p className="text-muted-foreground">
								created on {new Date(created_at!).toDateString().toLowerCase()}
							</p>
						</div>
					</Card>
				</Link>
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				<ContextMenuItem onClick={() => handlePreview(id!.toString())}>
					<ArrowUpRight />
					Open in preview window
					{/* TODO: Open in preview Do some research and return and update our state
					directly... could be a serverfn*/}
				</ContextMenuItem>
				<ContextMenuItem>
					<Search />
					Search similar
				</ContextMenuItem>
				<ContextMenuItem>
					<Heart />
					Add to favorite
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem>
					<SquarePen />
					Edit
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive">
					<Trash />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
