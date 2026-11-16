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
import { useEffect, useState, useSyncExternalStore } from "react";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { recordMutations } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import {
	defaultPreferences,
	getPreferences,
	subscribePreferences,
} from "#/lib/preferences";
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
	const prefs = useSyncExternalStore(
		subscribePreferences,
		getPreferences,
		getPreferences,
	);
	const isPdf = record_type === RecordTypes.PDF;
	const isTrash = variant === "trash";
	const dense = prefs.density === "compact";
	const showPdfCover = isPdf && prefs.showPdfCovers;

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

	const isGrid = variant === "grid";
	const cardClass = cn(
		"group relative w-full overflow-hidden border bg-card/60 text-card-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 hover:bg-card",
		dense ? "p-4 gap-3" : "p-5 gap-4",
		isGrid && "h-full",
	);

	const isCompleted = flag.check(FLAGS.IS_COMPLETED);
	const isFavorite = flag.check(FLAGS.IS_FAVORITE);
	const statusBadgeClass = cn(
		"rounded-md font-medium",
		dense ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
		isCompleted
			? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
			: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
	);

	let lastReadPage: number | null = null;
	if (isPdf) {
		const saved = localStorage.getItem(`datasoc.pdf-page-${name}`);
		if (saved) {
			const savedPage = parseInt(saved, 10);
			if (!Number.isNaN(savedPage) && savedPage > 0) lastReadPage = savedPage;
		}
	}

	const fileBadge = (
		<Badge
			variant="outline"
			className={cn(
				"shrink-0 gap-1.5 rounded-md border-muted-foreground/20 bg-background/60",
				dense ? "px-2 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
			)}
		>
			{isPdf ? (
				<BookOpen className={dense ? "size-3" : "size-3.5"} />
			) : (
				<FileText className={dense ? "size-3" : "size-3.5"} />
			)}
			{isPdf ? "PDF" : "Doc"}
		</Badge>
	);

	const fileTooltip = isPdf
		? "PDF document, view only"
		: "Text document, editable";
	const previewText = isPdf
		? "PDF document · view only"
		: (content || "")
				.replace(/\s+/g, " ")
				.trim()
				.split(" ")
				.slice(0, isGrid ? 18 : 24)
				.join(" ") || "No content yet";
	const createdText = created_at
		? new Date(created_at).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: "";

	const CardBody = (
		<Card className={cardClass}>
			{showPdfCover && <PdfCover />}
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1 space-y-1.5">
					<div className="flex min-w-0 items-center gap-2">
						<p
							className={cn(
								"truncate font-semibold tracking-tight",
								dense ? "text-base" : "text-lg",
							)}
						>
							{name || "Untitled"}
						</p>
						<Tooltip>
							<TooltipTrigger asChild>{fileBadge}</TooltipTrigger>
							<TooltipContent>{fileTooltip}</TooltipContent>
						</Tooltip>
						{isFavorite && (
							<Heart className="size-4 shrink-0 fill-rose-500 text-rose-500" />
						)}
					</div>
					<p
						className={cn(
							"text-muted-foreground leading-relaxed",
							dense ? "text-xs line-clamp-2" : "text-sm line-clamp-2",
						)}
					>
						{previewText}
					</p>
				</div>
				{!isTrash && (
					<ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				)}
			</div>
			<div
				className={cn(
					"flex flex-wrap items-center justify-between gap-2",
					dense ? "pt-0" : "pt-1",
				)}
			>
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<Badge variant="outline" className={statusBadgeClass}>
						{isCompleted ? "Completed" : "Draft"}
					</Badge>
					{tags.slice(0, isGrid ? 2 : 3).map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className={cn(
								"rounded-md bg-muted/70",
								dense ? "px-2 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
							)}
						>
							#{tag}
						</Badge>
					))}
					{tags.length > (isGrid ? 2 : 3) && (
						<span className="text-xs text-muted-foreground">
							+{tags.length - (isGrid ? 2 : 3)}
						</span>
					)}
				</div>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					{lastReadPage !== null && <span>p. {lastReadPage}</span>}
					{createdText && <span>{createdText}</span>}
				</div>
			</div>
		</Card>
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger className="block w-full">
				{!isTrash ? (
					<Link
						to={"/view/$reportId"}
						params={{ reportId: id!.toString() }}
						className="block w-full"
					>
						{CardBody}
					</Link>
				) : (
					CardBody
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
		const [Pdf, setPdf] = useState<{
			Document: React.ComponentType<any>;
			Page: React.ComponentType<any>;
		} | null>(null);

		const file = (() => {
			if (!content || typeof content !== "string") return null;
			try {
				const clean = content.replace(/\s/g, "");
				if (!clean) return null;
				const binary = atob(clean);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
				return { data: bytes };
			} catch {
				return null;
			}
		})();

		const ready = !!file;
		useEffect(() => {
			if (typeof window === "undefined" || !ready) return;
			let cancelled = false;
			Promise.all([import("react-pdf"), import("#/components/pdf/pdf-worker")])
				.then(([mod]) => {
					if (!cancelled) setPdf({ Document: mod.Document, Page: mod.Page });
				})
				.catch(() => {});
			return () => {
				cancelled = true;
			};
		}, [ready]);

		if (!Pdf || !file) return null;
		const { Document, Page } = Pdf;

		return (
			<div className="mb-3 flex justify-center">
				<div
					className="overflow-hidden rounded-md border border-input bg-muted/20"
					style={{
						width: COVER_WIDTH,
						height: COVER_WIDTH * (792 / 612),
					}}
				>
					<Document
						file={file}
						loading={null}
						error={null}
						onLoadError={() => {}}
					>
						<Page
							pageNumber={1}
							width={COVER_WIDTH}
							renderAnnotationLayer={false}
							renderTextLayer={false}
						/>
					</Document>
				</div>
			</div>
		);
	}
}
