"use client";

// --- Tiptap Core Extensions ---
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { LineHeight, TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Placeholder, Selection } from "@tiptap/extensions";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
// --- UI Primitives ---

import {
	Toolbar,
	ToolbarGroup,
} from "#/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import "#/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "#/components/tiptap-node/code-block-node/code-block-node.scss";
import "#/components/tiptap-node/heading-node/heading-node.scss";
import { HorizontalRule } from "#/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "#/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "#/components/tiptap-node/image-node/image-node.scss";
import { ImageUploadNode } from "#/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "#/components/tiptap-node/list-node/list-node.scss";
import "#/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Icons ---
// --- Tiptap UI ---
import {
	SearchAndReplace,
	SearchAndReplaceButton,
} from "#/components/tiptap-ui/search-and-replace";

// --- Hooks ---
import { useCursorVisibility } from "#/hooks/use-cursor-visibility";
import { useIsBreakpoint } from "#/hooks/use-is-breakpoint";
import { useWindowSize } from "#/hooks/use-window-size";

// --- Components ---

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "#/lib/tiptap-utils";

// --- Styles ---
import "#/components/tiptap-templates/simple/simple-editor.scss";

import { Download } from "lucide-react";
import { Button } from "#/components/tiptap-ui-primitive/button";
import { Input } from "#/components/ui/input";

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
	block: "center",
};

import EditorDrawerCard from "#/components/editor-drawer-card";
import { Drawer, DrawerContent, DrawerTrigger } from "#/components/ui/drawer";

const MainToolbarContent = ({
	onSearchAndReplaceClick,
	isSearchAndReplaceOpen,
	searchAndReplaceButtonRef,
	name,
	onExportClick,
}: {
	onHighlighterClick: () => void;
	onLinkClick: () => void;
	onSearchAndReplaceClick: () => void;
	isSearchAndReplaceOpen: boolean;
	searchAndReplaceButtonRef: React.RefObject<HTMLButtonElement | null>;
	isMobile: boolean;
	name: string;
	editor: any;
	onExportClick: () => void;
}) => {
	return (
		<div className="flex items-center justify-between flex-row w-full">
			<Input
				disabled={true}
				className="ring-0 focus-visible:ring-0 bg-transparent focus-visible:bg-background focus-active:bg-background border-none w-sm rounded-none dark:bg-transparent"
				placeholder="Name..."
				value={name}
			/>
			<ToolbarGroup>
				<SearchAndReplaceButton
					ref={searchAndReplaceButtonRef}
					aria-expanded={isSearchAndReplaceOpen}
					data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
					onClick={onSearchAndReplaceClick}
				/>
				<Button
					data-style="ghost"
					onClick={onExportClick}
					aria-label="Export to PDF"
					tooltip="Export to PDF"
				>
					<Download className="tiptap-button-icon" />
				</Button>
			</ToolbarGroup>
		</div>
	);
};

export function SimpleEditorView({
	name,
	content,
}: {
	name: string;
	content: string;
}) {
	const isMobile = useIsBreakpoint();
	const { height } = useWindowSize();
	const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
		"main",
	);
	const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const searchAndReplaceButtonRef = useRef<HTMLButtonElement>(null);

	const editor = useEditor({
		immediatelyRender: true,
		editorProps: {
			attributes: {
				autocomplete: "on",
				autocorrect: "on",
				autocapitalize: "off",
				"aria-label": "Main content area, start typing to enter text.",
				class: "simple-editor",
			},
		},
		extensions: [
			StarterKit.configure({
				horizontalRule: false,
				link: {
					openOnClick: false,
					enableClickSelection: true,
				},
			}),
			HorizontalRule,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			TaskList,
			TaskItem.configure({ nested: true }),
			Highlight.configure({ multicolor: true }),
			Image.configure({ allowBase64: true }),
			Typography,
			TextStyle,
			LineHeight,
			Superscript,
			Subscript,
			Selection,
			FindAndReplace.configure({
				searchDebounceMs: 500,
				injectCSS: false,
			}),
		],
		content,
	});

	const rect = useCursorVisibility({
		editor,
		overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
	});

	useEffect(() => {
		if (!isMobile && mobileView !== "main") {
			setMobileView("main");
		}
	}, [isMobile, mobileView]);

	const openSearchAndReplace = useCallback(() => {
		setMobileView("main");
		setIsSearchAndReplaceOpen(true);
	}, []);

	const closeSearchAndReplace = useCallback(() => {
		setIsSearchAndReplaceOpen(false);
		searchAndReplaceButtonRef.current?.focus();
	}, []);

	const toggleSearchAndReplace = useCallback(() => {
		if (isSearchAndReplaceOpen) {
			closeSearchAndReplace();
			return;
		}

		openSearchAndReplace();
	}, [closeSearchAndReplace, isSearchAndReplaceOpen, openSearchAndReplace]);

	const exportToPdf = useCallback(() => {
		const html = editor?.getHTML() ?? content ?? "";
		const rawTitle = name || "Document";
		const escapeHtml = (s: string) =>
			s
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;");
		const title = escapeHtml(rawTitle);

		const doc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; }
    h1,h2,h3 { line-height: 1.3; }
    img { max-width: 100%; height: auto; }
    pre { background: #f5f5f5; padding: 12px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em; color: #444; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <h1 style="margin-bottom: 1.5rem;">${title}</h1>
  ${html}
</body>
</html>`;

		const iframe = document.createElement("iframe");
		iframe.style.position = "fixed";
		iframe.style.right = "0";
		iframe.style.bottom = "0";
		iframe.style.width = "0";
		iframe.style.height = "0";
		iframe.style.border = "0";
		document.body.appendChild(iframe);

		const frameWindow = iframe.contentWindow;
		if (!frameWindow) {
			document.body.removeChild(iframe);
			return;
		}

		const cleanup = () => {
			setTimeout(() => {
				if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
			}, 1000);
		};

		frameWindow.document.open();
		frameWindow.document.write(doc);
		frameWindow.document.close();

		frameWindow.onafterprint = cleanup;
		setTimeout(() => {
			frameWindow.focus();
			frameWindow.print();
			cleanup();
		}, 300);
	}, [editor, content, name]);

	//other configurations
	editor.setEditable(false);
	return (
		<div className="simple-editor-wrapper simple-editor-viewer">
			<EditorContext.Provider value={{ editor }}>
				<Toolbar
					ref={toolbarRef}
					style={{
						...(isMobile
							? {
									bottom: `calc(100% - ${height - rect.y}px)`,
								}
							: {}),
					}}
				>
					<MainToolbarContent
						onHighlighterClick={() => setMobileView("highlighter")}
						onLinkClick={() => setMobileView("link")}
						onSearchAndReplaceClick={toggleSearchAndReplace}
						isSearchAndReplaceOpen={isSearchAndReplaceOpen}
						searchAndReplaceButtonRef={searchAndReplaceButtonRef}
						isMobile={isMobile}
						editor={editor}
						name={name}
						onExportClick={exportToPdf}
					/>
				</Toolbar>

				<SearchAndReplace
					className="simple-editor-search-and-replace"
					open={isSearchAndReplaceOpen}
					onOpen={openSearchAndReplace}
					onClose={closeSearchAndReplace}
					scrollIntoViewOptions={SEARCH_AND_REPLACE_SCROLL_OPTIONS}
				/>
				<EditorContent
					editor={editor}
					role="presentation"
					className="simple-editor-content"
				/>
			</EditorContext.Provider>
		</div>
	);
}
