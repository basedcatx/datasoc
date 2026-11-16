import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Copy, Download, RotateCcw, Trash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { recordMutations } from "#/lib/features/query";
import { fetchRecordById, type R } from "#/lib/libs";
import { createFlags, FLAGS, RecordTypes } from "#/lib/utils";

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

export function RecordRow({
	record,
	variant = "default",
}: {
	record: R;
	variant?: "default" | "trash";
}) {
	const qc = useQueryClient();
	const flag = createFlags(record.flags);
	const isPdf = record.record_type === RecordTypes.PDF;
	const isCompleted = flag.check(FLAGS.IS_COMPLETED);
	const date = formatDate(record.created_at);
	const isTrash = variant === "trash";

	const changeFlagMutation = useMutation({
		...recordMutations(qc).changeFlag(record.id ?? 0),
	});
	const permanentDeleteMutation = useMutation({
		...recordMutations(qc).permanentDelete(record.id ?? 0),
	});

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!record.id) return;
		if (isTrash) {
			permanentDeleteMutation.mutate();
			return;
		}
		changeFlagMutation.mutate({
			flag: FLAGS.IS_DELETED,
			data: { ...record, id: record.id },
		});
	};

	const handleRestore = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!record.id) return;
		changeFlagMutation.mutate({
			flag: FLAGS.IS_DELETED,
			data: { ...record, id: record.id },
		});
	};

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
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

	const handleDownload = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!record.id) {
			toast.error("Record not available");
			return;
		}
		try {
			const { record: full } = await fetchRecordById(record.id);
			if (isPdf || full.record_type === RecordTypes.PDF) {
				if (!full.content) {
					toast.error("No PDF content to download");
					return;
				}
				const binary = atob(full.content.replace(/\s/g, ""));
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
				const blob = new Blob([bytes], { type: "application/pdf" });
				triggerDownload(blob, `${full.name || record.name || "document"}.pdf`);
				return;
			}
			const text = full.content_html || full.content || "";
			if (!text.trim()) {
				toast.error("No content to download");
				return;
			}
			const blob = new Blob([text], { type: "text/html;charset=utf-8" });
			triggerDownload(blob, `${full.name || record.name || "document"}.html`);
		} catch {
			toast.error("Could not download");
		}
	};

	const title = (
		<>
			<span
				className={`size-1.5 shrink-0 rounded-full ${
					isCompleted ? "bg-primary/70" : "bg-muted-foreground/50"
				}`}
				title={isCompleted ? "Completed" : "Draft"}
			/>
			<span className="min-w-0 flex-1 truncate text-[14px] text-foreground/90">
				{record.name || "Untitled"}
			</span>
			<span className="shrink-0 text-[12px] text-muted-foreground/70">
				{isPdf ? "PDF" : "Doc"}
				{date ? ` · ${date}` : ""}
			</span>
		</>
	);

	return (
		<li className="group">
			<div className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/40">
				{isTrash ? (
					<div className="flex min-w-0 flex-1 items-center gap-3">{title}</div>
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
		</li>
	);
}
