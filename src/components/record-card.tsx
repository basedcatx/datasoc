import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowUpRight,
	BookOpen,
	FileText,
	Heart,
	Search,
	SquarePen,
	Trash,
} from "lucide-react";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { recordMutations } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { createFlags, FLAGS, RecordTypes } from "#/lib/utils";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type RecordCardVariant = "list" | "grid" | "trash" | "search";

export default function RecordCard({
	name,
	content,
	tags,
	id,
	created_at,
	flags,
	meta,
	content_html,
	record_type,
	variant = "list",
}: R & { variant?: RecordCardVariant }) {
	const qc = useQueryClient();
	const nav = useNavigate();
	const isPdf = record_type === RecordTypes.PDF;
	const isTrash = variant === "trash";

	const addToFavMutation = useMutation({
		...recordMutations(qc).changeFlag(id!),
	});

	const handlePreview = () => {
		appStore.setState((prev) => ({
			...prev,
			preview: { content: content_html },
		}));
	};

	const handleAddOrRemoveFav = () => {
		if (!id) return;
		addToFavMutation.mutate({
			flag: FLAGS.IS_FAVORITE,
			data: {
				name,
				content,
				tags,
				id,
				flags,
				created_at,
				content_html,
				meta,
				record_type,
			},
		});
	};

	const handleEdit = () => {
		nav({ to: "/editor/$reportId", params: { reportId: id!.toString() } });
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
				record_type,
			},
		});
	};

	const handleRestore = () => {
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
				record_type,
			},
		});
	};

	const handleSearchSimilar = () => {
		const search = { query: name };
		nav({ to: "/search", search: { ...search } });
	};

	const flag = createFlags(flags);

	const cardClass = cn(
		"p-6 hover:bg-muted rounded-md dark:hover:bg-input/50 cursor-pointer mx-1",
		variant === "grid" && "h-full",
	);

	const isCompleted = flag.check(FLAGS.IS_COMPLETED);
	const isFavorite = flag.check(FLAGS.IS_FAVORITE);
	const badgeClass = cn(
		"p-3 bg-input text-input-foreground",
		isCompleted && "bg-primary text-primary-foreground",
	);

	const cardContent = (
		<Card className={cardClass}>
			<div className="flex justify-between items-center">
				<div className="max-md-w-[70%] min-w-0">
					<div className="flex min-w-0 items-center gap-2">
						<p className="truncate font-bold text-lg">{name}</p>
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge variant="outline" className="shrink-0 gap-1 p-2">
									{isPdf ? <BookOpen /> : <FileText />}
									{isPdf ? "PDF" : "Doc"}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								{isPdf ? "PDF document, view only" : "Text document, editable"}
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="text-wrap truncate w-full text-ellipsis">
						{isPdf
							? "PDF document · view only"
							: content.split(" ").slice(0, 20).join(" ")}
					</p>
				</div>
				<ArrowUpRight className="size-5" />
			</div>
			<div className="flex justify-between items-center">
				<div className="flex gap-3">
					<Badge className={badgeClass}>
						{isCompleted ? "Completed" : "Draft"}
					</Badge>
					<ul className="flex gap-1">
						{tags.slice(0, 3).map((tag) => (
							<li key={tag}>
								<Badge variant="secondary" className="p-3">
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
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger className="w-full">
				{!isTrash ? (
					<Link to={"/view/$reportId"} params={{ reportId: id!.toString() }}>
						{cardContent}
					</Link>
				) : (
					cardContent
				)}
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				{!isPdf && !isTrash && (
					<ContextMenuItem onClick={handlePreview}>
						<ArrowUpRight />
						Open in preview window
					</ContextMenuItem>
				)}
				<ContextMenuItem onClick={handleSearchSimilar}>
					<Search />
					Search similar
				</ContextMenuItem>
				{!isTrash && (
					<ContextMenuItem onClick={handleAddOrRemoveFav}>
						{isFavorite ? (
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
				)}
				{!isPdf && !isTrash && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={handleEdit}>
							<SquarePen />
							Edit
						</ContextMenuItem>
					</>
				)}
				<ContextMenuSeparator />
				{isTrash ? (
					<>
						<ContextMenuItem onClick={handleRestore}>Restore</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem variant="destructive" onClick={handleDelete}>
							<Trash />
							Delete permanently
						</ContextMenuItem>
					</>
				) : (
					<ContextMenuItem variant="destructive" onClick={handleDelete}>
						<Trash />
						Delete
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
