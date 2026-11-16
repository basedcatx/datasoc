import { useSelector } from "@tanstack/react-store";
import { type ComponentType, useEffect, useState } from "react";
import { pdfUploadStore } from "#/lib/pdf";

export function PdfUploadDialogClient() {
	const candidate = useSelector(pdfUploadStore, (s) => s.candidate);
	const [Dialog, setDialog] = useState<ComponentType | null>(null);

	useEffect(() => {
		if (!candidate || Dialog) return;

		let active = true;
		import("./pdf-upload-dialog").then((mod) => {
			if (active) setDialog(() => mod.PdfUploadDialog);
		});

		return () => {
			active = false;
		};
	}, [candidate, Dialog]);

	return candidate && Dialog ? <Dialog /> : null;
}
