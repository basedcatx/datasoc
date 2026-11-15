import { type ComponentType, useEffect, useState } from "react";
import { Spinner } from "#/components/ui/spinner";

type ViewerProps = {
	content: string;
	name: string;
};

// pdfjs touches document while its module loads, so it must never be part of
// the server bundle's eager imports. Import the viewer only in the browser.
export function PdfViewerClient(props: ViewerProps) {
	const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(null);

	useEffect(() => {
		let active = true;

		import("./pdf-viewer").then((mod) => {
			if (active) setViewer(() => mod.PdfViewer);
		});

		return () => {
			active = false;
		};
	}, []);

	if (!Viewer) {
		return <Spinner className="mx-auto my-auto size-10 h-full" />;
	}

	return <Viewer {...props} />;
}
