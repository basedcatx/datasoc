import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { basename } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isPdfBuffer, openPdfUpload } from "#/lib/pdf";
import { isTauri } from "#/lib/utils";

export function PdfDropOverlay() {
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		if (!isTauri()) return;

		let unlisten: (() => void) | undefined;
		let disposed = false;

		const handleDrop = async (path: string) => {
			try {
				const bytes = await readFile(path);
				if (!isPdfBuffer(bytes)) {
					toast.error("Only PDF files can be uploaded");
					return;
				}

				openPdfUpload({
					fileName: await basename(path),
					bytes,
				});
			} catch (e) {
				toast.error(`Could not read the dropped file: ${e}`);
			}
		};

		getCurrentWebviewWindow()
			.onDragDropEvent(({ payload }) => {
				if (payload.type === "enter" || payload.type === "over") {
					setDragging(true);
					return;
				}

				if (payload.type === "leave") {
					setDragging(false);
					return;
				}

				setDragging(false);
				if (payload.paths.length > 1) {
					toast.info("Only the first dropped file will be uploaded");
				}

				const path = payload.paths[0];
				if (path) void handleDrop(path);
			})
			.then((stop) => {
				if (disposed) {
					stop();
					return;
				}
				unlisten = stop;
			})
			.catch((e) => toast.error(`Could not listen for dropped files: ${e}`));

		return () => {
			disposed = true;
			unlisten?.();
		};
	}, []);

	if (!dragging) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-[100] flex animate-in items-center justify-center bg-background/80 backdrop-blur-sm fade-in-0">
			<div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-16 py-12 shadow-lg">
				<Upload className="size-10 text-muted-foreground" />
				<p className="font-heading font-semibold text-xl">
					Release to upload file
				</p>
				<p className="text-muted-foreground text-sm">PDF documents only</p>
			</div>
		</div>
	);
}
