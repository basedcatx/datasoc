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
import { Placeholder, Selection, UndoRedo } from "@tiptap/extensions";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
	getHierarchicalIndexes,
	TableOfContents,
} from "@tiptap/extension-table-of-contents";

// --- UI Primitives ---
import { Button } from "#/components/tiptap-ui-primitive/button";
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator,
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
import { ArrowLeftIcon } from "#/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "#/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "#/components/tiptap-icons/link-icon";
// --- Tiptap UI ---
import { BlockquoteButton } from "#/components/tiptap-ui/blockquote-button";
import {
	ColorHighlightPopover,
	ColorHighlightPopoverButton,
	ColorHighlightPopoverContent,
} from "#/components/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "#/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "#/components/tiptap-ui/image-upload-button";
import {
	LinkButton,
	LinkContent,
	LinkPopover,
} from "#/components/tiptap-ui/link-popover";
import { ListDropdownMenu } from "#/components/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "#/components/tiptap-ui/mark-button";
import {
	SearchAndReplace,
	SearchAndReplaceButton,
} from "#/components/tiptap-ui/search-and-replace";
import { TextAlignButton } from "#/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "#/components/tiptap-ui/undo-redo-button";

// --- Hooks ---
import { useCursorVisibility } from "#/hooks/use-cursor-visibility";
import { useIsBreakpoint } from "#/hooks/use-is-breakpoint";
import { useWindowSize } from "#/hooks/use-window-size";

// --- Components ---

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "#/lib/tiptap-utils";

// --- Styles ---
import "#/components/tiptap-templates/simple/simple-editor.scss";

import { Input } from "#/components/ui/input";
import { LucideOption } from "lucide-react";

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
	block: "center",
};

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerTrigger,
} from "#/components/ui/drawer";

import EditorDrawerCard from "#/components/editor-drawer-card";
import { Button as BTN } from "#/components/ui/button";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { useSelector } from "@tanstack/react-store";

const MainToolbarContent = ({
	onHighlighterClick,
	onLinkClick,
	onSearchAndReplaceClick,
	isSearchAndReplaceOpen,
	searchAndReplaceButtonRef,
	isMobile,
	editor,
}: {
	onHighlighterClick: () => void;
	onLinkClick: () => void;
	onSearchAndReplaceClick: () => void;
	isSearchAndReplaceOpen: boolean;
	searchAndReplaceButtonRef: React.RefObject<HTMLButtonElement | null>;
	isMobile: boolean;
	editor: any;
}) => {
	const name = useSelector(appStore, (state) => state.file.name);

	return (
		<div className="flex items-center gap-8 flex-row w-full">
			<Input
				className="ring-0 focus-visible:ring-0 bg-transparent focus-visible:bg-background focus-active:bg-background border-none w-sm rounded-none dark:bg-transparent"
				placeholder="Name..."
				value={name}
				onChange={(e) => {
					appStore.setState((s) => {
						return {
							...s,
							editor: {
								...s,
								file: { ...s.file, name: e.target.value },
							},
						};
					});
				}}
			/>
			<ToolbarGroup>
				<UndoRedoButton action="undo" editor={editor} />
				<UndoRedoButton action="redo" editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
				<ListDropdownMenu
					modal={false}
					types={["bulletList", "orderedList", "taskList"]}
				/>
				<BlockquoteButton />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<MarkButton type="bold" />
				<MarkButton type="italic" />
				<MarkButton type="strike" />
				<MarkButton type="underline" />
				{!isMobile ? (
					<ColorHighlightPopover />
				) : (
					<ColorHighlightPopoverButton onClick={onHighlighterClick} />
				)}
				{!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<MarkButton type="superscript" />
				<MarkButton type="subscript" />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<TextAlignButton align="left" />
				<TextAlignButton align="center" />
				<TextAlignButton align="right" />
				<TextAlignButton align="justify" />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<ImageUploadButton text="Add" />
			</ToolbarGroup>

			<ToolbarGroup>
				<SearchAndReplaceButton
					ref={searchAndReplaceButtonRef}
					aria-expanded={isSearchAndReplaceOpen}
					data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
					onClick={onSearchAndReplaceClick}
				/>
			</ToolbarGroup>

			<ToolbarGroup>
				<Drawer swipeDirection="right" modal={true}>
					<DrawerTrigger
						render={
							<BTN variant="outline" className="p-4">
								<LucideOption className="size-4" />
							</BTN>
						}
					></DrawerTrigger>
					<DrawerContent className={"rounded-sm"}>
						<div className="p-6 h-full">{<EditorDrawerCard />}</div>
					</DrawerContent>
				</Drawer>
			</ToolbarGroup>
		</div>
	);
};

const MobileToolbarContent = ({
	type,
	onBack,
}: {
	type: "highlighter" | "link";
	onBack: () => void;
}) => (
	<>
		<ToolbarGroup>
			<Button variant="ghost" onClick={onBack}>
				<ArrowLeftIcon className="tiptap-button-icon" />
				{type === "highlighter" ? (
					<HighlighterIcon className="tiptap-button-icon" />
				) : (
					<LinkIcon className="tiptap-button-icon" />
				)}
			</Button>
		</ToolbarGroup>

		<ToolbarSeparator />

		{type === "highlighter" ? (
			<ColorHighlightPopoverContent />
		) : (
			<LinkContent />
		)}
	</>
);

export function SimpleEditor() {
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
			Image,
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
			Placeholder.configure({
				placeholder: ({ node }) => {
					if (node.type.name === "heading") {
						return "What's the title?";
					}
					return "Write something";
				},
			}),

			ImageUploadNode.configure({
				accept: "image/*",
				maxSize: MAX_FILE_SIZE,
				limit: 3,
				upload: handleImageUpload,
				onError: (error) => console.error("Upload failed:", error),
			}),
		],
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

	//other configurations
	return (
		<div className="simple-editor-wrapper">
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
					{mobileView === "main" ? (
						<MainToolbarContent
							onHighlighterClick={() => setMobileView("highlighter")}
							onLinkClick={() => setMobileView("link")}
							onSearchAndReplaceClick={toggleSearchAndReplace}
							isSearchAndReplaceOpen={isSearchAndReplaceOpen}
							searchAndReplaceButtonRef={searchAndReplaceButtonRef}
							isMobile={isMobile}
							editor={editor}
						/>
					) : (
						<MobileToolbarContent
							type={mobileView === "highlighter" ? "highlighter" : "link"}
							onBack={() => setMobileView("main")}
						/>
					)}
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
