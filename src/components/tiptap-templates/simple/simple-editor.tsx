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
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

// --- UI Primitives ---
import { Button } from "#/components/tiptap-ui-primitive/button";
import {
	ToolbarGroup,
	ToolbarSeparator,
} from "#/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import "#/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "#/components/tiptap-node/code-block-node/code-block-node.scss";
import "#/components/tiptap-node/heading-node/heading-node.scss";
import "#/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "#/components/tiptap-node/image-node/image-node.scss";
import { ImageUploadNode } from "#/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "#/components/tiptap-node/list-node/list-node.scss";
import "#/components/tiptap-node/paragraph-node/paragraph-node.scss";
import MetadataDialog from "#/components/metadata-dialog";

// --- Icons ---
// --- Tiptap UI ---
import { BlockquoteButton } from "#/components/tiptap-ui/blockquote-button";
import {
	ColorHighlightPopover,
	ColorHighlightPopoverButton,
} from "#/components/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "#/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "#/components/tiptap-ui/image-upload-button";
import { LinkButton, LinkPopover } from "#/components/tiptap-ui/link-popover";
import { ListDropdownMenu } from "#/components/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "#/components/tiptap-ui/mark-button";
import {
	SearchAndReplace,
	SearchAndReplaceButton,
} from "#/components/tiptap-ui/search-and-replace";
import { TextAlignButton } from "#/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "#/components/tiptap-ui/undo-redo-button";

// --- Hooks ---
import { useIsBreakpoint } from "#/hooks/use-is-breakpoint";

// --- Components ---

// --- Lib ---
import { MAX_FILE_SIZE } from "#/lib/tiptap-utils";

// --- Styles ---
import "#/components/tiptap-templates/simple/simple-editor.scss";

import { LucidePencilLine } from "lucide-react";
import { Input } from "#/components/ui/input";
import { Badge } from "#/components/ui/badge";

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
	block: "center",
};

import { useSelector } from "@tanstack/react-store";
import { compressAndConvertBase64 } from "#/components/tiptap-node/image-upload-node";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import {
	appStore,
	initialStoreState,
} from "#/integrations/tanstack-query/store-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordMutations, recordQueries } from "#/lib/features/query";
import { RecordTypes, snapshot } from "#/lib/utils";
import { Spinner } from "#/components/ui/spinner";
import { toast } from "sonner";
import type { R } from "#/lib/libs";
import { cn } from "cn";

const MainToolbarContent = ({
	onHighlighterClick,
	onLinkClick,
	onSearchAndReplaceClick,
	isSearchAndReplaceOpen,
	searchAndReplaceButtonRef,
	isMobile,
	editor,
	onSaveClick,
}: {
	onHighlighterClick: () => void;
	onLinkClick: () => void;
	onSearchAndReplaceClick: () => void;
	isSearchAndReplaceOpen: boolean;
	searchAndReplaceButtonRef: React.RefObject<HTMLButtonElement | null>;
	isMobile: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: This is unecessary
	editor: any;
	onSaveClick?: () => void;
}) => {
	const state = useSelector(appStore, (s) => s.file);
	const name = state.name;
	const [_, startTransition] = useTransition();
	const bp = useIsBreakpoint("max", 1280);
	const handleNameChange = (value: string) => {
		startTransition(() => {
			appStore.setState((s) => {
				return {
					...s,
					file: { ...s.file, name: value },
				};
			});
		});
	};

	return (
		<div
			className={cn(
				"xl:w-full z-50 max-xl:max-h-dvh flex overflow-x-auto sticky top-0 overflow-auto",
				bp && "no-scrollbar",
			)}
		>
			<div className="flex items-center gap-2 justify-between max-xl:flex-col max-xl:gap-4 max-xl:p-2 xl:w-full">
				{bp ? (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant={"ghost"}
								className="flex p-6 cursor-pointer font-medium rounded-full bg-destructive hover:bg-destructive"
							>
								<LucidePencilLine className="size-4" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent size="sm">
							<form
								className="flex flex-col gap-6"
								onSubmit={(e) => {
									e.preventDefault();
									//@ts-expect-error
									const value = e.target.elements.name.value;
									if (value) handleNameChange(value);
								}}
							>
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="name-id">Name</FieldLabel>
										<Input
											className="ring-0 focus-visible:ring-0 bg-transparent focus-visible:bg-background focus-active:bg-background border-none rounded-none dark:bg-transparent"
											placeholder="Name..."
											defaultValue={name}
											name="name"
											id="name-id"
										/>
										<FieldDescription>
											Change the document's name
										</FieldDescription>
									</Field>
								</FieldGroup>
								<AlertDialogFooter>
									<AlertDialogCancel variant="outline">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction type="submit">OK</AlertDialogAction>
								</AlertDialogFooter>
							</form>
						</AlertDialogContent>
					</AlertDialog>
				) : (
					<Input
						className="ring-0 focus-visible:ring-0 shrink bg-transparent focus-visible:bg-background focus-active:bg-background border-none rounded-none dark:bg-transparent"
						placeholder="Name..."
						value={name}
						onChange={(e) => {
							handleNameChange(e.target.value);
						}}
					/>
				)}

				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<UndoRedoButton action="undo" editor={editor} />
					<UndoRedoButton action="redo" editor={editor} />
					<MarkButton
						disabled={false}
						data-disabled={false}
						type="save"
						editor={editor}
						onClick={onSaveClick}
					/>
				</ToolbarGroup>
				<ToolbarSeparator orientation={bp ? "horizontal" : "vertical"} />
				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4, 5, 6]} />
					<ListDropdownMenu
						modal={false}
						types={["bulletList", "orderedList", "taskList"]}
					/>
					<BlockquoteButton />
				</ToolbarGroup>
				<ToolbarSeparator orientation={bp ? "horizontal" : "vertical"} />
				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<MarkButton type="bold" editor={editor} />
					<MarkButton type="italic" editor={editor} />
					<MarkButton type="strike" editor={editor} />
					<MarkButton type="underline" editor={editor} />
					{!isMobile ? (
						<ColorHighlightPopover />
					) : (
						<ColorHighlightPopoverButton onClick={onHighlighterClick} />
					)}
					{!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
				</ToolbarGroup>
				<ToolbarSeparator orientation={bp ? "horizontal" : "vertical"} />
				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<MarkButton type="superscript" editor={editor} />
					<MarkButton type="subscript" editor={editor} />
				</ToolbarGroup>
				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<TextAlignButton align="left" />
					<TextAlignButton align="center" />
					<TextAlignButton align="right" />
					<TextAlignButton align="justify" />
				</ToolbarGroup>
				<ToolbarGroup>
					<ImageUploadButton text={!bp ? "Add" : ""} />
				</ToolbarGroup>
				<ToolbarGroup className="max-xl:flex max-xl:flex-col">
					<SearchAndReplaceButton
						ref={searchAndReplaceButtonRef}
						aria-expanded={isSearchAndReplaceOpen}
						data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
						onClick={onSearchAndReplaceClick}
					/>

					<MetadataDialog />
				</ToolbarGroup>
			</div>
		</div>
	);
};

export function SimpleEditor({ data }: { data?: R }) {
	const isMobile = useIsBreakpoint();
	const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
		"main",
	);
	const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false);
	const searchAndReplaceButtonRef = useRef<HTMLButtonElement>(null);

	const qc = useQueryClient();
	const [s, setS] = useState({ loading: false, msg: "" });
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const savingRef = useRef(false);
	const saveRef = useRef<() => Promise<boolean>>(async () => false);
	const lastSavedRef = useRef(snapshot(initialStoreState.file));

	const state = useSelector(appStore, (s) => s);

	const createNewRecordMutation = useMutation({
		...recordMutations(qc).createNewRecord(),
	});

	const updateRecordMutation = useMutation({
		...recordMutations(qc).updateRecord(),
	});

	const AUTOSAVE_INTERVAL_MS = 3000;

	// Loading previous data
	useEffect(() => {
		if (!data) return;
		appStore.setState((prev) => ({
			...prev,
			file: { ...prev.file, ...data },
			dirty: false,
		}));
		lastSavedRef.current = snapshot(data);
	}, [data]);

	const scheduleSave = () => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			void saveRef.current();
		}, AUTOSAVE_INTERVAL_MS);
	};

	const handleAutoSave = async () => {
		if (savingRef.current) return false;

		// Read the store here instead of closing over the render's state, so the
		// timer always saves what the user has actually typed.
		const file = appStore.state.file;

		if (!file.name) {
			setS({ loading: false, msg: "Idling..." });
			toast.error("Unable to save, please set the record's name first");
			return false;
		}

		savingRef.current = true;
		let saved = false;

		try {
			if (file.id === -1) {
				setS({ loading: true, msg: "Creating new record..." });

				const sent = { ...file };
				const result = await createNewRecordMutation.mutateAsync({
					data: {
						record: {
							name: sent.name,
							content: sent.content,
							content_html: sent.content_html,
							flags: sent.flags,
							meta: sent.meta,
							tags: sent.tags,
							record_type: RecordTypes.DOCUMENT,
						},
					},
				});

				if (result.record.id) {
					appStore.setState((prev) => ({
						...prev,
						file: { ...prev.file, id: result.record.id ?? -1 },
					}));
				}

				lastSavedRef.current = snapshot(sent);
			} else {
				setS({ loading: true, msg: "Updating record..." });

				const current = await qc.ensureQueryData(recordQueries.id(file.id));
				const sent = { ...file };

				await updateRecordMutation.mutateAsync({
					data: {
						record: {
							...current.record,
							name: sent.name,
							content: sent.content,
							content_html: sent.content_html,
							flags: sent.flags,
							meta: sent.meta,
							tags: sent.tags,
						},
					},
				});

				lastSavedRef.current = snapshot(sent);
			}

			saved = true;
			setS({ loading: false, msg: "Saved to database" });
		} catch (e) {
			setS({ loading: false, msg: "Failed to save..." });
			toast.error(`Failed to save record: ${e}`);
		} finally {
			savingRef.current = false;

			const stillDirty = snapshot(appStore.state.file) !== lastSavedRef.current;

			appStore.setState((prev) => ({
				...prev,
				dirty: stillDirty,
			}));

			// If the user typed while the request was in flight, save again.
			if (saved && stillDirty) {
				scheduleSave();
			}
		}

		return saved;
	};

	saveRef.current = handleAutoSave;

	useEffect(() => {
		const store = appStore.state;
		const hasChanged = snapshot(store.file) !== lastSavedRef.current;

		if (!hasChanged) return;

		if (!store.dirty) {
			appStore.setState((prev) => ({
				...prev,
				dirty: true,
			}));
		}

		if (savingRef.current) return;

		scheduleSave();
	}, [
		state.file.name,
		state.file.content,
		state.file.content_html,
		state.file.flags,
		state.file.meta,
		state.file.tags,
	]);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

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
				upload: (file) => compressAndConvertBase64(file),
				onError: (error) => console.error("Upload failed:", error),
			}),
		],
		content: data?.content_html ?? "",
		onUpdate({ editor }) {
			const plainText = editor.getText({ blockSeparator: "\n" });
			const html = editor.getHTML();

			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, content: plainText, content_html: html },
			}));
		},
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
				<div className="max-xl:flex">
					<MainToolbarContent
						onHighlighterClick={() => setMobileView("highlighter")}
						onLinkClick={() => setMobileView("link")}
						onSearchAndReplaceClick={toggleSearchAndReplace}
						isSearchAndReplaceOpen={isSearchAndReplaceOpen}
						searchAndReplaceButtonRef={searchAndReplaceButtonRef}
						isMobile={isMobile}
						editor={editor}
						onSaveClick={async () => {
							const res = await handleAutoSave();
							if (res) toast.success("Saved successfully!");
						}}
					/>

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

					<div
						className="absolute bottom-1 right-1 autosave-badge"
						data-state={s.loading ? "open" : "closed"}
					>
						<Badge
							className="flex items-center gap-3 p-2 [--radius:1.2rem]"
							variant="secondary"
						>
							<Spinner data-icon="inline-start" />
							{s.msg}
						</Badge>
					</div>
				</div>
			</EditorContext.Provider>
		</div>
	);
}
