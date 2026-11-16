import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import {
	ArrowUpRight,
	Copy,
	Download,
	Heart,
	RotateCcw,
	Search,
	SquarePen,
	Trash,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#/components/ui/context-menu";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { recordMutations } from "#/lib/features/query";
import { fetchRecordById, type R } from "#/lib/libs";
import { createFlags, FLAGS, isTauri, RecordTypes } from "#/lib/utils";

function formatDate(date?: Date | string | null) {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function printHtmlAsPdf(html: string, name: string) {
	const rawTitle = name || "Document";
	const escapeHtml = (s: string) =>
		s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	const title = escapeHtml(rawTitle);

	const doc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; }
    h1,h2,h3 { line-height: 1.3; }
    img { max-width: 100%; height: auto; }
    pre { background: #f5f5f5; padding: 12px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em; color: #444; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <h1 style="margin-bottom: 1.5rem;">${title}</h1>
  ${html}
</body>
</html>`;

	const iframe = document.createElement("iframe");
	iframe.style.position = "fixed";
	iframe.style.right = "0";
	iframe.style.bottom = "0";
	iframe.style.width = "0";
	iframe.style.height = "0";
	iframe.style.border = "0";
	document.body.appendChild(iframe);

	const frameWindow = iframe.contentWindow;
	if (!frameWindow) {
		document.body.removeChild(iframe);
		return;
	}

	const cleanup = () => {
		setTimeout(() => {
			if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
		}, 1000);
	};

	frameWindow.document.open();
	frameWindow.document.write(doc);
	frameWindow.document.close();

	frameWindow.onafterprint = cleanup;
	setTimeout(() => {
		frameWindow.focus();
		frameWindow.print();
		cleanup();
	}, 300);
}

export function RecordRow({
	record,
	variant = "default",
}: {
	record: R;
	variant?: "default" | "trash";
}) {
	const qc = useQueryClient();
	const nav = useNavigate();
	const flag = createFlags(record.flags);
	const isPdf = record.record_type === RecordTypes.PDF;
	const isCompleted = flag.check(FLAGS.IS_COMPLETED);
	const isFavorite = flag.check(FLAGS.IS_FAVORITE);
	const date = formatDate(record.created_at);
	const isTrash = variant === "trash";

	const changeFlagMutation = useMutation({
		...recordMutations(qc).changeFlag(record.id ?? 0),
	});
	const permanentDeleteMutation = useMutation({
		...recordMutations(qc).permanentDelete(record.id ?? 0),
	});

	const softDelete = () => {
		if (!record.id) return;
		changeFlagMutation.mutate({
			flag: FLAGS.IS_DELETED,
			data: { ...record, id: record.id },
		});
	};

	const permanentDelete = () => {
		if (!record.id) return;
		permanentDeleteMutation.mutate();
	};

	const handleDelete = (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		if (isTrash) permanentDelete();
		else softDelete();
	};

	const handleRestore = (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		softDelete();
	};

	const handleCopy = async (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		try {
			await navigator.clipboard.writeText(record.name ?? "");
			toast.success("Copied");
		} catch {
			toast.error("Could not copy");
		}
	};

	const triggerDownload = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.rel = "noopener";
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	const handleDownload = async (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		if (!record.id) {
			toast.error("Record not available");
			return;
		}
		try {
			const { record: full } = await fetchRecordById(record.id);
			const baseName = full.name || record.name || "document";

			if (isPdf || full.record_type === RecordTypes.PDF) {
				if (!full.content) {
					toast.error("No PDF content to download");
					return;
				}
				const binary = atob(full.content.replace(/\s/g, ""));
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

				if (isTauri()) {
					const path = await save({
						defaultPath: `${baseName}.pdf`,
						filters: [{ name: "PDF", extensions: ["pdf"] }],
					});
					if (!path) return;
					await writeFile(path, bytes);
					toast.success("Saved");
					return;
				}

				const blob = new Blob([bytes], { type: "application/pdf" });
				triggerDownload(blob, `${baseName}.pdf`);
				return;
			}

			const html = full.content_html || full.content || "";
			if (!html.trim()) {
				toast.error("No content to download");
				return;
			}

			printHtmlAsPdf(html, baseName);
		} catch {
			toast.error("Could not download");
		}
	};

	const handlePreview = () => {
		if (!record.content_html) {
			toast.error("No preview available");
			return;
		}
		appStore.setState((prev) => ({
			...prev,
			preview: { content: record.content_html },
		}));
	};

	const handleSearchSimilar = () => {
		nav({ to: "/search", search: { query: record.name || "", page: "all" } });
	};

	const handleFavorite = () => {
		if (!record.id) return;
		changeFlagMutation.mutate({
			flag: FLAGS.IS_FAVORITE,
			data: { ...record, id: record.id },
		});
	};

	const handleEdit = () => {
		if (!record.id) return;
		nav({ to: "/editor/$reportId", params: { reportId: String(record.id) } });
	};

	const title = (
		<>
			<span
				className={`size-1.5 shrink-0 rounded-full ${
					isCompleted ? "bg-primary/70" : "bg-muted-foreground/50"
				}`}
				title={isCompleted ? "Completed" : "Draft"}
			/>
			<span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
				{record.name || "Untitled"}
			</span>
			<span className="shrink-0 text-sm text-muted-foreground/70">
				{isPdf ? "PDF" : "Doc"}
				{date ? ` · ${date}` : ""}
			</span>
		</>
	);

	return (
		<li className="group">
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/40">
						{isTrash ? (
							<div className="flex min-w-0 flex-1 items-center gap-3">
								{title}
							</div>
						) : (
							<Link
								to={"/view/$reportId"}
								params={{ reportId: String(record.id) }}
								className="flex min-w-0 flex-1 items-center gap-3"
							>
								{title}
							</Link>
						)}
						<div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
							{isTrash ? (
								<>
									<button
										type="button"
										onClick={handleRestore}
										className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
										title="Restore"
									>
										<RotateCcw className="size-3.5" />
									</button>
									<button
										type="button"
										onClick={handleDelete}
										className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										title="Delete permanently"
									>
										<Trash2 className="size-3.5" />
									</button>
								</>
							) : (
								<>
									<button
										type="button"
										onClick={handleCopy}
										className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
										title="Copy name"
									>
										<Copy className="size-3.5" />
									</button>
									<button
										type="button"
										onClick={handleDownload}
										className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
										title="Download"
									>
										<Download className="size-3.5" />
									</button>
									<button
										type="button"
										onClick={handleDelete}
										className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										title="Delete"
									>
										<Trash className="size-3.5" />
									</button>
								</>
							)}
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					{!isPdf && !isTrash && (
						<ContextMenuItem onClick={handlePreview}>
							<ArrowUpRight className="size-4" />
							Open in preview window
						</ContextMenuItem>
					)}
					<ContextMenuItem onClick={handleSearchSimilar}>
						<Search className="size-4" />
						Search similar
					</ContextMenuItem>
					{!isTrash && (
						<ContextMenuItem onClick={handleFavorite}>
							<Heart className={`size-4 ${isFavorite ? "fill-primary" : ""}`} />
							{isFavorite ? "Remove from favorite" : "Add to favorite"}
						</ContextMenuItem>
					)}
					{!isPdf && !isTrash && (
						<>
							<ContextMenuSeparator />
							<ContextMenuItem onClick={handleEdit}>
								<SquarePen className="size-4" />
								Edit
							</ContextMenuItem>
						</>
					)}
					<ContextMenuSeparator />
					{isTrash ? (
						<>
							<ContextMenuItem onClick={() => handleRestore()}>
								<RotateCcw className="size-4" />
								Restore
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem
								variant="destructive"
								onClick={() => permanentDelete()}
							>
								<Trash2 className="size-4" />
								Delete permanently
							</ContextMenuItem>
						</>
					) : (
						<ContextMenuItem variant="destructive" onClick={() => softDelete()}>
							<Trash className="size-4" />
							Delete
						</ContextMenuItem>
					)}
				</ContextMenuContent>
			</ContextMenu>
		</li>
	);
}
