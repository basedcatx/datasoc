import {
	ChevronDown,
	ChevronUp,
	FileWarning,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
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
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
// Thumbnail width in the left rail.
const THUMBNAIL_WIDTH = 72;

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
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [fitWidth, setFitWidth] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchMatches, setSearchMatches] = useState<number[]>([]);
	const [searchIndex, setSearchIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const thumbnailRailRef = useRef<HTMLDivElement>(null);

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

	// Reset the reading state when a different document is opened.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on content change
	useEffect(() => {
		setPages(0);
		setPage(1);
		setAspect(DEFAULT_ASPECT);
		setScrollTop(0);
		setLoadError(null);
		setSearchQuery("");
		setSearchMatches([]);
		setSearchIndex(-1);
	}, [content]);

	// Zoom control: fit width scales pages to container; otherwise fixed zoom.
	// biome-ignore lint/correctness/useExhaustiveDependencies: width is intentional
	useEffect(() => {
		if (fitWidth) {
			setZoom(1);
		}
	}, [fitWidth, width]);

	// Remember last page: restore scroll position from localStorage on mount,
	// and persist it as the user reads.
	useEffect(() => {
		if (!pages) return;
		const saved = localStorage.getItem(`datasoc.pdf-page-${name}`);
		if (saved) {
			const savedPage = parseInt(saved, 10);
			if (!Number.isNaN(savedPage) && savedPage >= 1 && savedPage <= pages) {
				setPage(savedPage);
				if (scrollContainerRef.current) {
					const stride = Math.floor(width * aspect) + PAGE_GAP;
					scrollContainerRef.current.scrollTo({
						top: (savedPage - 1) * stride,
						behavior: "smooth",
					});
				}
			}
		}
	}, [name, pages, width, aspect]);

	const savePage = useCallback(() => {
		if (page > 0 && pages > 0) {
			localStorage.setItem(`datasoc.pdf-page-${name}`, String(page));
		}
	}, [page, pages, name]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: page is intentional
	useEffect(() => {
		const timer = setTimeout(savePage, 300);
		return () => clearTimeout(timer);
	}, [page, savePage]);

	const pageScale = fitWidth ? 1 : zoom;
	const pageWidth = Math.floor(width * pageScale);
	const pageHeight = pageWidth * aspect;
	const stride = pageHeight + PAGE_GAP;
	const firstPage = Math.max(0, Math.floor(scrollTop / stride) - OVERSCAN);
	const lastPage = Math.min(
		pages - 1,
		Math.ceil((scrollTop + viewportHeight) / stride) + OVERSCAN,
	);

	const handleZoomIn = () => {
		setFitWidth(false);
		setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
	};

	const handleZoomOut = () => {
		setFitWidth(false);
		setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
	};

	const handleFitWidth = () => {
		setFitWidth(true);
	};

	const handleSearchKey = async (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			await runSearch();
		}
	};

	const runSearch = async () => {
		if (!searchQuery.trim() || !file) {
			setSearchMatches([]);
			setSearchIndex(-1);
			return;
		}

		const matches: number[] = [];
		try {
			const loadingTask = pdfjs.getDocument({ data: file.data });
			const doc = await loadingTask.promise;
			for (let i = 1; i <= doc.numPages; i++) {
				const pageObj = await doc.getPage(i);
				const textContent = await pageObj.getTextContent();
				const text = textContent.items
					.map((item) => ("str" in item ? item.str : ""))
					.join(" ")
					.toLowerCase();
				if (text.includes(searchQuery.toLowerCase())) {
					matches.push(i);
				}
				pageObj.cleanup();
			}
			await loadingTask.destroy().catch(() => undefined);
		} catch {
			// ignore search errors
		}

		setSearchMatches(matches);
		setSearchIndex(matches.length > 0 ? 0 : -1);
	};

	const jumpToPage = useCallback(
		(targetPage: number) => {
			const pageNum = Math.max(1, Math.min(pages, targetPage));
			setPage(pageNum);
			const targetStride = (pageNum - 1) * stride;
			if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTo({
					top: targetStride,
					behavior: "smooth",
				});
			}
			if (thumbnailRailRef.current) {
				const thumbHeight = THUMBNAIL_WIDTH * aspect;
				const thumbStride = thumbHeight + 4;
				thumbnailRailRef.current.scrollTo({
					top: (pageNum - 1) * thumbStride,
					behavior: "smooth",
				});
			}
		},
		[pages, stride, aspect],
	);

	const handleKeyboard = useCallback(
		(e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" || target.tagName === "TEXTAREA")
			) {
				return;
			}

			switch (e.key) {
				case "ArrowDown":
				case "j":
					e.preventDefault();
					setPage((p) => Math.min(pages, p + 1));
					break;
				case "ArrowUp":
				case "k":
					e.preventDefault();
					setPage((p) => Math.max(1, p - 1));
					break;
				case "Home":
					e.preventDefault();
					jumpToPage(1);
					break;
				case "End":
					e.preventDefault();
					jumpToPage(pages);
					break;
				case "g":
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						jumpToPage(1);
					}
					break;
			}
		},
		[pages, jumpToPage],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyboard);
		return () => document.removeEventListener("keydown", handleKeyboard);
	}, [handleKeyboard]);

	const searchResults =
		searchMatches.length > 0 ? (
			<div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-lg border border-input">
				<button
					type="button"
					onClick={() => {
						const next =
							(searchIndex - 1 + searchMatches.length) % searchMatches.length;
						setSearchIndex(next);
						jumpToPage(searchMatches[next]);
					}}
					className="p-1 hover:bg-accent rounded"
					disabled={searchIndex <= 0}
				>
					<ChevronUp className="size-4" />
				</button>
				<span className="text-xs text-muted-foreground">
					{searchIndex + 1} of {searchMatches.length}
				</span>
				<button
					type="button"
					onClick={() => {
						const next = (searchIndex + 1) % searchMatches.length;
						setSearchIndex(next);
						jumpToPage(searchMatches[next]);
					}}
					className="p-1 hover:bg-accent rounded"
					disabled={searchIndex >= searchMatches.length - 1}
				>
					<ChevronDown className="size-4" />
				</button>
				<button
					type="button"
					onClick={() => {
						setSearchQuery("");
						setSearchMatches([]);
						setSearchIndex(-1);
					}}
					className="p-1 hover:bg-destructive/10 rounded text-destructive"
				>
					✕
				</button>
			</div>
		) : null;

	const thumbnailHeight = THUMBNAIL_WIDTH * aspect;

	return (
		<div className="flex h-dvh flex-col bg-muted/30">
			<header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
				<div className="min-w-0">
					<p className="truncate font-heading font-semibold text-lg">{name}</p>
					<p className="text-muted-foreground text-xs">
						PDF document · view only
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{searchResults}
					<input
						type="text"
						placeholder="Search in document..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleSearchKey}
						className="hidden sm:flex w-32 border border-input rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
					/>
					<button
						type="button"
						onClick={handleZoomOut}
						className="p-1.5 hover:bg-accent rounded"
						title="Zoom out"
					>
						<ZoomOut className="size-4" />
					</button>
					<button
						type="button"
						onClick={handleFitWidth}
						className={`p-1.5 rounded ${fitWidth ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
						title={fitWidth ? "Fit width (active)" : "Fit width"}
					>
						<ChevronDown className="size-4" />
					</button>
					<button
						type="button"
						onClick={handleZoomIn}
						className="p-1.5 hover:bg-accent rounded"
						title="Zoom in"
					>
						<ZoomIn className="size-4" />
					</button>
					<p className="text-xs text-muted-foreground shrink-0">
						{Math.round(pageScale * 100)}%
					</p>
					<p className="text-xs text-muted-foreground shrink-0">
						{page} / {pages}
					</p>
				</div>
			</header>

			<div className="flex-1 overflow-hidden flex">
				{/* Thumbnail rail */}
				<aside
					ref={thumbnailRailRef}
					className="w-20 overflow-y-auto border-r border-border p-1 bg-background flex-shrink-0"
				>
					{Array.from({ length: pages }, (_, index) => {
						const pageNumber = index + 1;
						const isActive = pageNumber === page;
						const isMatch = searchMatches.includes(pageNumber);
						return (
							<button
								key={pageNumber}
								type="button"
								onClick={() => jumpToPage(pageNumber)}
								className={`
									flex flex-col items-center gap-1 mb-1 p-1 rounded
									${isActive ? "bg-primary/20 ring-2 ring-primary" : ""}
									${isMatch ? "bg-accent/20" : ""}
								`}
							>
								<div
									className="overflow-hidden rounded-sm border border-input"
									style={{
										width: THUMBNAIL_WIDTH,
										height: thumbnailHeight,
									}}
								>
									<Page
										pageNumber={pageNumber}
										width={THUMBNAIL_WIDTH}
										renderAnnotationLayer={false}
										renderTextLayer={false}
									/>
								</div>
								<span className="text-[10px] text-muted-foreground truncate w-full text-center">
									{pageNumber}
								</span>
							</button>
						);
					})}
				</aside>

				{/* Main page viewer */}
				<div
					ref={scrollContainerRef}
					onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
					className="flex-1 overflow-auto p-6"
				>
					<div
						className="mx-auto flex w-fit flex-col"
						style={{ gap: PAGE_GAP }}
					>
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
								{Array.from({ length: pages }, (_, index) => {
									const pageNumber = index + 1;
									const mounted = index >= firstPage && index <= lastPage;

									return (
										<div
											key={pageNumber}
											className="overflow-hidden rounded-md bg-white shadow-lg"
											style={{ width: pageWidth, height: pageHeight }}
										>
											{mounted ? (
												<Page
													pageNumber={pageNumber}
													width={pageWidth}
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
		</div>
	);
}
