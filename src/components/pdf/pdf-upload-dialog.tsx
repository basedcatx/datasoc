import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Document, Page } from "react-pdf";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Spinner } from "#/components/ui/spinner";
import { recordMutations } from "#/lib/features/query";
import {
	closePdfUpload,
	formatBytes,
	pdfTitleFromFileName,
	pdfUploadStore,
	toBase64,
} from "#/lib/pdf";
import { FLAGS, RecordTypes } from "#/lib/utils";
import "./pdf-worker";

export function PdfUploadDialog() {
	const candidate = useSelector(pdfUploadStore, (s) => s.candidate);
	const qc = useQueryClient();
	const nav = useNavigate();

	const [name, setName] = useState("");
	const [pages, setPages] = useState(0);
	const [previewFailed, setPreviewFailed] = useState(false);

	const createRecordMutation = useMutation({
		...recordMutations(qc).createNewRecord(),
	});

	useEffect(() => {
		if (!candidate) return;
		setName(pdfTitleFromFileName(candidate.fileName));
		setPages(0);
		setPreviewFailed(false);
	}, [candidate]);

	// pdf.js transfers the buffer it is given to its worker, so preview a copy.
	// Without this, candidate.bytes would be detached before toBase64 runs.
	const file = useMemo(
		() => (candidate ? { data: candidate.bytes.slice() } : null),
		[candidate],
	);

	const handleUpload = async () => {
		if (!candidate || !name.trim()) return;

		try {
			const result = await createRecordMutation.mutateAsync({
				data: {
					record: {
						name: name.trim(),
						content: toBase64(candidate.bytes),
						content_html: "",
						flags: FLAGS.NONE_CLEAR_ALL,
						tags: [],
						meta: [],
						record_type: RecordTypes.PDF,
					},
				},
			});

			closePdfUpload();
			toast.success("PDF uploaded");

			const id = result.record.id;
			if (id) {
				nav({
					to: "/view/$reportId",
					params: { reportId: id.toString() },
				});
			}
		} catch (e) {
			toast.error(`Failed to upload PDF: ${e}`);
		}
	};

	return (
		<AlertDialog
			open={!!candidate}
			onOpenChange={(open) => {
				if (!open && !createRecordMutation.isPending) closePdfUpload();
			}}
		>
			<AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Upload PDF</AlertDialogTitle>
					<AlertDialogDescription>
						This file will be stored as a read-only PDF record.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{candidate && (
					<div className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="pdf-name">Name</Label>
							<Input
								id="pdf-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										void handleUpload();
									}
								}}
								placeholder="PDF title"
								autoFocus
							/>
						</div>

						<div className="grid grid-cols-3 gap-3 rounded-md border p-3 text-sm">
							<div className="col-span-3 min-w-0">
								<p className="text-muted-foreground text-xs">File</p>
								<p className="truncate">{candidate.fileName}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Size</p>
								<p>{formatBytes(candidate.bytes.length)}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Pages</p>
								<p>{previewFailed ? "Unknown" : pages || "Reading..."}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Type</p>
								<p>PDF</p>
							</div>
						</div>

						<div className="max-h-[40vh] overflow-auto rounded-md border bg-muted/30 p-3">
							{previewFailed ? (
								<div className="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm">
									<FileText className="size-4" />
									Preview unavailable
								</div>
							) : (
								<div className="mx-auto w-fit overflow-hidden bg-white shadow-sm">
									<Document
										file={file}
										// Same default as the viewer: suspense renders nothing
										// until the promise resolves.
										suspense={false}
										loading={
											<div
												className="flex items-center justify-center py-16"
												style={{ width: 280 }}
											>
												<Spinner className="size-8 text-muted-foreground" />
											</div>
										}
										onLoadSuccess={({ numPages }) => setPages(numPages)}
										onLoadError={() => setPreviewFailed(true)}
									>
										<Page
											pageNumber={1}
											width={280}
											renderAnnotationLayer={false}
											renderTextLayer={false}
										/>
									</Document>
								</div>
							)}
						</div>
					</div>
				)}

				<AlertDialogFooter>
					<Button
						variant="outline"
						onClick={closePdfUpload}
						disabled={createRecordMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUpload}
						disabled={
							!candidate || !name.trim() || createRecordMutation.isPending
						}
					>
						{createRecordMutation.isPending ? "Uploading..." : "Upload"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
