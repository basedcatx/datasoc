import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Copy, Download, RotateCcw, Trash, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

async function htmlToPdfBlob(html: string, title: string): Promise<Blob> {
	const html2pdf = (await import("html2pdf.js")).default as any;
	const container = document.createElement("div");
	const safeTitle = title
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	container.innerHTML = `<div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111; padding: 24px; max-width: 800px;">
		<h1 style="margin: 0 0 1.25rem 0; line-height: 1.3;">${safeTitle}</h1>
		${html}
	</div>`;
	container.style.position = "fixed";
	container.style.left = "-10000vw";
	container.style.top = "0";
	container.style.width = "800px";
	container.style.background = "#fff";
	container.style.opacity = "0";
	container.style.pointerEvents = "none";
	container.style.zIndex = "-1";
	document.body.appendChild(container);
	try {
		const blob: Blob = await html2pdf()
			.set({
				margin: 10,
				filename: `${title || "document"}.pdf`,
				image: { type: "jpeg", quality: 0.98 },
				html2canvas: {
					scale: 2,
					useCORS: true,
					backgroundColor: "#ffffff",
					scrollX: 0,
					scrollY: 0,
				},
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				pagebreak: { mode: ["avoid-all", "css", "legacy"] },
			})
			.from(container)
			.outputPdf("blob");
		return blob;
	} finally {
		container.remove();
	}
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

			const toastId = toast.loading("Preparing PDF...");
			let pdfBlob: Blob;
			try {
				pdfBlob = await htmlToPdfBlob(
					html,
					(baseName || "Document").replace(/[<>]/g, ""),
				);
			} finally {
				toast.dismiss(toastId);
			}

			if (isTauri()) {
				const path = await save({
					defaultPath: `${baseName}.pdf`,
					filters: [{ name: "PDF", extensions: ["pdf"] }],
				});
				if (!path) return;
				const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
				await writeFile(path, bytes);
				toast.success("Saved");
				return;
			}

			triggerDownload(pdfBlob, `${baseName}.pdf`);
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
