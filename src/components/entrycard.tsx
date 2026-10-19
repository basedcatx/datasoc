import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowUpRight, Heart, Search, SquarePen, Trash } from "lucide-react";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { updateRecord, type R } from "#/lib/libs";
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

export default function EntryCard({
	name,
	content,
	tags,
	id,
	created_at,
	flags,
	meta,
	content_html,
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

	const handleEdit = () => {
		nav({ to: "/editor/$reportId", params: { reportId: id!.toString() } });
	}

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

	const handleSearchSimilar = () => {
		const search = { query: name };
		nav({ to: "/search", search: { ...search } });
	};

	const flag = createFlags(flags);

	return (
		<ContextMenu>
			<ContextMenuTrigger className="w-full">
				<Link to={"/view/$reportId"} params={{ reportId: id!.toString() }}>
					<Card className="p-6 hover:bg-muted rounded-md dark:hover:bg-input/50 cursor-pointer  mx-1">
						<div className="flex justify-between items-center">
							<div className="max-md-w-[70%]">
								<p className="text-nowrap w-full text-ellipsis font-bold text-lg">
									{name}
								</p>
								<p className="text-wrap truncate w-full text-ellipsis">
									{content.split(" ").slice(0, 20).join(" ")}
								</p>
							</div>
							<ArrowUpRight className="size-5" />
						</div>
						<div className="flex justify-between items-center">
							<div className="flex gap-3">
								<Badge
									className={cn(
										"p-3 bg-input text-input-foreground",
										flag.check(FLAGS.IS_COMPLETED) &&
										"bg-primary text-primary-foreground",
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
								Created @ {new Date(created_at!).toDateString()}
							</p>
						</div>
					</Card>
				</Link>
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				<ContextMenuItem onClick={handlePreview}>
					<ArrowUpRight />
					Open in preview window
					{/* TODO: Open in preview Do some research and return and update our state
					directly... could be a serverfn*/}
				</ContextMenuItem>
				<ContextMenuItem onClick={handleSearchSimilar}>
					<Search />
					Search similar
				</ContextMenuItem>
				<ContextMenuItem onClick={handleAddOrRemoveFav}>
					{flag.check(FLAGS.IS_FAVORITE) ? (
						<div className="flex gap-2">
							<Heart className="fill-primary" />
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
				<ContextMenuItem onClick={handleEdit}>
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
