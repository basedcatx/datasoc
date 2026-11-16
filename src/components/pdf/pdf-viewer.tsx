import { FileWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fromBase64 } from "#/lib/pdf";

export function PdfViewer({
	content,
	name,
}: {
	content: string;
	name: string;
}) {
	const [error, setError] = useState<string | null>(null);

	const url = useMemo(() => {
		try {
			const bytes = fromBase64(content);
			const blob = new Blob([bytes], { type: "application/pdf" });
			return URL.createObjectURL(blob);
		} catch {
			return null;
		}
	}, [content]);

	useEffect(() => {
		if (!url) {
			setError("This PDF could not be displayed.");
			return;
		}
		setError(null);
		return () => {
			URL.revokeObjectURL(url);
		};
	}, [url]);

	return (
		<div className="flex h-dvh flex-col bg-background">
			<header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
				<div className="min-w-0">
					<p className="truncate font-heading font-semibold text-lg">{name}</p>
					<p className="text-muted-foreground text-xs">PDF document</p>
				</div>
			</header>

			<div className="flex-1 min-h-0">
				{error || !url ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-destructive">
						<FileWarning className="size-6" />
						<p className="text-sm">
							{error ?? "This PDF could not be displayed."}
						</p>
					</div>
				) : (
					<iframe title={name} src={url} className="h-full w-full border-0" />
				)}
			</div>
		</div>
	);
}
