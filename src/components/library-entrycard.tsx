import {
	BookOpen,
	FileText,
	Heart,
	LucideArrowUpRight,
	Search,
	SquarePen,
	Trash,
} from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordMutations } from "#/lib/features/query";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { Link, useNavigate } from "@tanstack/react-router";

export default function LibraryEntryCard({
	name,
	content,
	tags,
	created_at,
	flags,
	content_html,
	id,
	meta,
	record_type,
}: R) {
	const qc = useQueryClient();
	const nav = useNavigate();
	const isPdf = record_type === RecordTypes.PDF;

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

	const handleEdit = () => {
		nav({ to: "/editor/$reportId", params: { reportId: id!.toString() } });
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
				record_type,
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
				record_type,
			},
		});
	};

	const flag = createFlags(flags);

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Link to="/view/$reportId" params={{ reportId: id!.toString() }}>
					<Card className="p-6 hover:bg-muted rounded-md dark:hover:bg-input/50 cursor-pointer">
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
											{isPdf
												? "PDF document, view only"
												: "Text document, editable"}
										</TooltipContent>
									</Tooltip>
								</div>
								<p className="text-wrap truncate w-full text-ellipsis">
									{isPdf
										? "PDF document · view only"
										: content.split(" ").slice(0, 20).join(" ")}
								</p>
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
							<p className="text-muted-foreground">
								Created @ {new Date(created_at!).toDateString()}
							</p>
						</div>
					</Card>
				</Link>
			</ContextMenuTrigger>
			<ContextMenuContent className="px-2 text-xl">
				{!isPdf && (
					<ContextMenuItem onClick={handlePreview}>
						<LucideArrowUpRight />
						Open in preview
					</ContextMenuItem>
				)}

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
				{!isPdf && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={handleEdit}>
							<SquarePen />
							Edit
						</ContextMenuItem>
					</>
				)}
				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive" onClick={handleDelete}>
					<Trash />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
