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
			{/* Kept outside the content so the picker survives the dialog closing. */}
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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add</DialogTitle>
					<DialogDescription>
						Start a new note or upload a PDF to your library.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button
						variant="outline"
						className="h-auto flex-col items-start justify-start gap-2 whitespace-normal p-4 text-left"
						onClick={handleDocument}
					>
						<NotebookPen className="size-6" />
						<span className="font-medium">Document</span>
						<span className="text-muted-foreground text-xs">
							Start a blank note
						</span>
					</Button>
					<Button
						variant="outline"
						className="h-auto flex-col items-start justify-start gap-2 whitespace-normal p-4 text-left"
						onClick={() => fileInputRef.current?.click()}
					>
						<FileText className="size-6" />
						<span className="font-medium">PDF</span>
						<span className="text-muted-foreground text-xs">
							Upload a PDF file
						</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
