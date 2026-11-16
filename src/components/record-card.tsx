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
import { useEffect, useState } from "react";
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

const COVER_WIDTH = 160;

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

	// Reading progress for PDFs: last page read persisted by the viewer.
	let lastReadPage: number | null = null;
	if (isPdf) {
		const saved = localStorage.getItem(`datasoc.pdf-page-${name}`);
		if (saved) {
			const savedPage = parseInt(saved, 10);
			if (!Number.isNaN(savedPage) && savedPage > 0) {
				lastReadPage = savedPage;
			}
		}
	}

	const fileBadge = (
		<Badge variant="outline" className="shrink-0 gap-1 p-2">
			{isPdf ? <BookOpen /> : <FileText />}
			{isPdf ? "PDF" : "Doc"}
		</Badge>
	);

	const fileTooltip = isPdf
		? "PDF document, view only"
		: "Text document, editable";

	const previewText = isPdf
		? "PDF document · view only"
		: content.split(" ").slice(0, 20).join(" ");

	const createdText = new Date(created_at!).toDateString();

	return (
		<ContextMenu>
			<ContextMenuTrigger className="w-full">
				{!isTrash ? (
					<Link to={"/view/$reportId"} params={{ reportId: id!.toString() }}>
						<Card className={cardClass}>
							{isPdf && <PdfCover />}
							<div className="flex justify-between items-center">
								<div className="max-md-w-[70%] min-w-0">
									<div className="flex min-w-0 items-center gap-2">
										<p className="truncate font-bold text-lg">{name}</p>
										<Tooltip>
											<TooltipTrigger asChild>{fileBadge}</TooltipTrigger>
											<TooltipContent>{fileTooltip}</TooltipContent>
										</Tooltip>
									</div>
									<p className="text-wrap truncate w-full text-ellipsis">
										{previewText}
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
								<p className="text-muted-foreground">Created @ {createdText}</p>
							</div>
							{lastReadPage !== null && (
								<p className="mt-2 text-xs text-muted-foreground">
									Last read: page {lastReadPage}
								</p>
							)}
						</Card>
					</Link>
				) : (
					<Card className={cardClass}>
						{isPdf && <PdfCover />}
						<div className="flex justify-between items-center">
							<div className="max-md-w-[70%] min-w-0">
								<div className="flex min-w-0 items-center gap-2">
									<p className="truncate font-bold text-lg">{name}</p>
									<Tooltip>
										<TooltipTrigger asChild>{fileBadge}</TooltipTrigger>
										<TooltipContent>{fileTooltip}</TooltipContent>
									</Tooltip>
								</div>
								<p className="text-wrap truncate w-full text-ellipsis">
									{previewText}
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
							<p className="text-muted-foreground">Created @ {createdText}</p>
						</div>
						{lastReadPage !== null && (
							<p className="mt-2 text-xs text-muted-foreground">
								Last read: page {lastReadPage}
							</p>
						)}
					</Card>
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

	function PdfCover() {
		const [Page, setPage] = useState<React.ComponentType<any> | null>(null);

		useEffect(() => {
			if (typeof window === "undefined") return;
			import("react-pdf").then((mod) => setPage(mod.Page));
		}, []);

		if (!Page) return null;

		return (
			<div className="flex justify-center mb-3" style={{ width: COVER_WIDTH }}>
				<div
					className="overflow-hidden rounded-md border border-input shadow-sm"
					style={{
						width: COVER_WIDTH,
						height: COVER_WIDTH * (792 / 612),
					}}
				>
					<Page
						pageNumber={1}
						width={COVER_WIDTH}
						renderAnnotationLayer={false}
						renderTextLayer={false}
					/>
				</div>
			</div>
		);
	}
}
