import { FileWarning } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { fromBase64 } from "#/lib/pdf";
import { Spinner } from "../ui/spinner";
import "./pdf-worker";

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const PAGE_GAP = 24;
const DEFAULT_ASPECT = 792 / 612;
// Mount a page before it scrolls into view so the next one is ready to read.
const OVERSCAN = 1;

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
	const [width, setWidth] = useState(initialWidth);
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
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
			setViewportHeight(entry.contentRect.height);
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Reset the reading state when a different document is opened. The setters
	// are stable; content is the only real input, even though it is not read.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on content change
	useEffect(() => {
		setPages(0);
		setAspect(DEFAULT_ASPECT);
		setScrollTop(0);
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

	const pageHeight = width * aspect;
	const stride = pageHeight + PAGE_GAP;
	const firstPage = Math.max(0, Math.floor(scrollTop / stride) - OVERSCAN);
	const lastPage = Math.min(
		pages - 1,
		Math.ceil((scrollTop + viewportHeight) / stride) + OVERSCAN,
	);

	return (
		<div className="flex h-dvh flex-col bg-muted/30">
			<header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
				<div className="min-w-0">
					<p className="truncate font-heading font-semibold text-lg">{name}</p>
					<p className="text-muted-foreground text-xs">
						PDF document · view only
					</p>
				</div>

				<p className="shrink-0 text-muted-foreground text-sm">
					{pages > 0 ? `${pages} pages` : "Loading..."}
				</p>
			</header>

			<div
				ref={containerRef}
				onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
				className="flex-1 overflow-auto p-6"
			>
				<div className="mx-auto flex w-fit flex-col" style={{ gap: PAGE_GAP }}>
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
							onLoadSuccess={async (pdf) => {
								setLoadError(null);

								// All pages in a PDF usually share a size. Measuring the
								// first one keeps the placeholders the same height as the
								// rendered canvases, so scrolling does not jump.
								try {
									const first = await pdf.getPage(1);
									const viewport = first.getViewport({ scale: 1 });
									setAspect(viewport.height / viewport.width);
									first.cleanup();
								} catch {
									// Keep the letter-size estimate.
								}

								setPages(pdf.numPages);
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
							{/* All pages keep a placeholder so the scroll length is stable,
							    but only the pages around the viewport mount a canvas. */}
							{Array.from({ length: pages }, (_, index) => {
								const pageNumber = index + 1;
								const mounted = index >= firstPage && index <= lastPage;

								return (
									<div
										key={pageNumber}
										className="overflow-hidden rounded-md bg-white shadow-lg"
										style={{ width, height: pageHeight }}
									>
										{mounted ? (
											<Page
												pageNumber={pageNumber}
												width={width}
												loading={
													<div className="flex h-full items-center justify-center">
														<Spinner className="size-10 text-muted-foreground" />
													</div>
												}
												renderAnnotationLayer={false}
												renderTextLayer={false}
											/>
										) : null}
									</div>
								);
							})}
						</Document>
					)}
				</div>
			</div>
		</div>
	);
}
