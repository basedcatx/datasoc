import { FileWarning } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";
import { Spinner } from "#/components/ui/spinner";

type ViewerProps = {
	content: string;
	name: string;
};

export function PdfViewerClient(props: ViewerProps) {
	const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		import("./pdf-viewer")
			.then((mod) => {
				if (active) setViewer(() => mod.PdfViewer);
			})
			.catch((reason: unknown) => {
				if (!active) return;
				setError(reason instanceof Error ? reason.message : String(reason));
			});

		return () => {
			active = false;
		};
	}, []);

	if (error) {
		return (
			<div className="flex h-dvh flex-col items-center justify-center gap-4 text-muted-foreground">
				<FileWarning className="size-10" />
				<p>This PDF viewer could not be loaded.</p>
				<p className="max-w-md wrap-break-word text-center text-xs">{error}</p>
			</div>
		);
	}

	if (!Viewer) {
		return (
			<div className="flex h-dvh items-center justify-center">
				<Spinner className="size-10 text-muted-foreground" />
			</div>
		);
	}

	return <Viewer {...props} />;
}
