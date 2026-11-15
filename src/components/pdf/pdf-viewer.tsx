import { ChevronLeft, ChevronRight, FileWarning } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { fromBase64 } from "#/lib/pdf";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import "./pdf-worker";

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;

const initialWidth = () =>
	typeof window === "undefined"
		? MAX_WIDTH
		: Math.max(MIN_WIDTH, Math.min(window.innerWidth - 480, MAX_WIDTH));

export function PdfViewer({
	content,
	name,
}: {
	content: string;
	name: string;
}) {
	const [pages, setPages] = useState(0);
	const [page, setPage] = useState(1);
	const [width, setWidth] = useState(initialWidth);
	const [loadError, setLoadError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const file = useMemo(() => {
		try {
			return { data: fromBase64(content) };
		} catch {
			return null;
		}
	}, [content]);

	// Follow the width of the reading area so the page always fits.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const next = Math.floor(entry.contentRect.width - 48);
			setWidth(Math.max(MIN_WIDTH, Math.min(next, MAX_WIDTH)));
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Reset pagination when a different document is opened. The setters are
	// stable; content is the only real input, even though it is not read.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on content change
	useEffect(() => {
		setPage(1);
		setPages(0);
		setLoadError(null);
	}, [content]);

	if (!file) {
		return (
			<div className="flex h-dvh flex-col items-center justify-center gap-4 text-muted-foreground">
				<FileWarning className="size-10" />
				<p>This PDF could not be read.</p>
			</div>
		);
	}

	return (
		<div className="flex h-dvh flex-col bg-muted/30">
			<header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
				<div className="min-w-0">
					<p className="truncate font-heading font-semibold text-lg">{name}</p>
					<p className="text-muted-foreground text-xs">
						PDF document · view only
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						aria-label="Previous page"
						disabled={page <= 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
					>
						<ChevronLeft />
					</Button>
					<p className="min-w-24 text-center text-muted-foreground text-sm">
						{pages > 0 ? `Page ${page} of ${pages}` : "Loading..."}
					</p>
					<Button
						variant="outline"
						size="icon"
						aria-label="Next page"
						disabled={pages === 0 || page >= pages}
						onClick={() => setPage((p) => Math.min(pages, p + 1))}
					>
						<ChevronRight />
					</Button>
				</div>
			</header>

			<div ref={containerRef} className="flex-1 overflow-auto p-6">
				<div className="mx-auto w-fit overflow-hidden rounded-md bg-white shadow-lg">
					{loadError ? (
						<div
							className="flex flex-col items-center gap-2 p-10 text-destructive"
							style={{ width }}
						>
							<FileWarning className="size-6" />
							<p className="text-sm">This PDF could not be displayed.</p>
							<p className="max-w-full break-words text-center text-muted-foreground text-xs">
								{loadError}
							</p>
						</div>
					) : (
						<Document
							file={file}
							// react-pdf loads through React suspense by default. Without a
							// boundary fallback that commits nothing, so the viewer showed
							// a blank screen. The flags below only render when suspense is
							// off.
							suspense={false}
							loading={
								<div
									className="flex items-center justify-center py-24"
									style={{ width }}
								>
									<Spinner className="size-10 text-muted-foreground" />
								</div>
							}
							error={
								<div className="flex flex-col items-center gap-2 p-10 text-destructive">
									<FileWarning className="size-6" />
									<p className="text-sm">This PDF could not be displayed.</p>
								</div>
							}
							onLoadSuccess={({ numPages }) => {
								setPages(numPages);
								setLoadError(null);
							}}
							onLoadError={(err) => {
								setPages(0);
								setLoadError(err.message);
							}}
							onSourceError={(err) => {
								setPages(0);
								setLoadError(err.message);
							}}
						>
							<Page
								pageNumber={page}
								width={width}
								loading={
									<div
										className="flex items-center justify-center py-24"
										style={{ width }}
									>
										<Spinner className="size-10 text-muted-foreground" />
									</div>
								}
								renderAnnotationLayer={false}
								renderTextLayer={false}
							/>
						</Document>
					)}
				</div>
			</div>
		</div>
	);
}
