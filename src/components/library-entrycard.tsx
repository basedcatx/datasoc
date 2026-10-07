import {
	Heart,
	LucideArrowUpRight,
	Pencil,
	Search,
	SquarePen,
	Tags,
	Trash,
} from "lucide-react";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS } from "#/lib/utils";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordMutations } from "#/lib/features/query";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { useNavigate } from "@tanstack/react-router";

export default function LibraryEntryCard({
	name,
	content,
	tags,
	created_at,
	flags,
	content_html,
	id,
	meta,
}: R) {
	const qc = useQueryClient();
	const nav = useNavigate();

	const addToFavMutation = useMutation({
		...recordMutations(qc).changeFlag(id!),
	});

	const handlePreview = () => {
		//Placeholder
		appStore.setState((prev) => ({
			...prev,
			preview: { content: content_html },
		}));
	};

	const handleSearchSimilar = () => {
		const search = { query: name };
		nav({ to: "/search", search: { ...search } });
	};

	const handleAddOrRemoveFav = () => {
		addToFavMutation.mutate({
			flag: FLAGS.IS_FAVORITE,
			data: {
				name,
				content,
				tags,
				id: id!,
				flags,
				created_at,
				content_html,
				meta,
			},
		});
	};

	const handleDelete = () => {
		addToFavMutation.mutate({
			flag: FLAGS.IS_DELETED,
			data: {
				name,
				content,
				tags,
				id: id!,
				flags,
				created_at,
				content_html,
				meta,
			},
		});
	};

	const flag = createFlags(flags);

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
							<Badge className="p-2">
								{createFlags(flags).check(FLAGS.IS_COMPLETED)
									? "Completed"
									: "Draft"}
							</Badge>
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
						<p className="text-muted-foreground">created at {created_at}</p>
					</div>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				<ContextMenuItem onClick={handlePreview}>
					<LucideArrowUpRight />
					Open in preview
				</ContextMenuItem>

				<ContextMenuItem onClick={handleSearchSimilar}>
					<Search />
					Search similar
				</ContextMenuItem>
				<ContextMenuItem onClick={handleAddOrRemoveFav}>
					{flag.check(FLAGS.IS_FAVORITE) ? (
						<div className="flex gap-2">
							<Heart className="fill-red-500" />
							Remove from favorite
						</div>
					) : (
						<div className="flex gap-2">
							<Heart />
							Add to favorite
						</div>
					)}
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem>
					<SquarePen />
					Edit
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive" onClick={handleDelete}>
					<Trash />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
