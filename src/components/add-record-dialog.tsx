import { useNavigate } from "@tanstack/react-router";
import { FileText, NotebookPen } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { isPdfBuffer, openPdfUpload } from "#/lib/pdf";

export function AddRecordDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDocument = () => {
		onOpenChange(false);
		navigate({ to: "/editor" });
	};

	const handleFile = async (list: FileList | null) => {
		const file = list?.[0];
		if (!file) return;

		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			if (!isPdfBuffer(bytes)) {
				toast.error("Only PDF files can be uploaded");
				return;
			}

			openPdfUpload({ fileName: file.name, bytes });
			onOpenChange(false);
		} catch (e) {
			toast.error(`Could not read the selected file: ${e}`);
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/pdf,.pdf"
				className="hidden"
				onChange={(e) => {
					e.preventDefault();
					void handleFile(e.target.files);
				}}
			/>
			<DialogContent className="sm:max-w-md gap-6 p-6 rounded-xl">
				<DialogHeader className="space-y-2">
					<DialogTitle>New document</DialogTitle>
					<DialogDescription>
						Start a new note or upload a PDF to your library.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-2 my-5">
					<Button
						variant="outline"
						className="h-auto flex-col items-start justify-start gap-3 whitespace-normal p-5 text-left"
						onClick={handleDocument}
					>
						<NotebookPen className="size-6" />
						<div className="space-y-1">
							<span className="block font-medium">Document</span>
							<span className="block text-muted-foreground text-xs">
								Start a blank document with the built-in editor
							</span>
						</div>
					</Button>
					<Button
						variant="outline"
						className="h-auto flex-col items-start justify-start gap-3 whitespace-normal p-5 text-left"
						onClick={() => fileInputRef.current?.click()}
					>
						<FileText className="size-6" />
						<div className="space-y-1">
							<span className="block font-medium">PDF</span>
							<span className="block text-muted-foreground text-xs">
								Upload a PDF file
							</span>
						</div>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
