import { mergeAttributes, Node, nodeInputRule } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageUploadNode as ImageUploadNodeComponent } from "#/components/tiptap-node/image-upload-node/image-upload-node";
import type { NodeType } from "@tiptap/pm/model";
import { properties } from "zod";
import { Plugin } from "@tiptap/pm/state";

const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export type UploadFunction = (
	file: File,
	onProgress?: (event: { progress: number }) => void,
	abortSignal?: AbortSignal,
) => Promise<string>;

export interface ImageUploadNodeOptions {
	/**
	 * The type of the node.
	 * @default 'image'
	 */
	type?: string | NodeType | undefined;
	/**
	 * Acceptable file types for upload.
	 * @default 'image/*'
	 */
	accept?: string;
	/**
	 * Maximum number of files that can be uploaded.
	 * @default 1
	 */
	limit?: number;
	/**
	 * Maximum file size in bytes (0 for unlimited).
	 * @default 0
	 */
	maxSize?: number;
	/**
	 * Function to handle the upload process.
	 */
	upload?: UploadFunction;
	/**
	 * Callback for upload errors.
	 */
	onError?: (error: Error) => void;
	/**
	 * Callback for successful uploads.
	 */
	onSuccess?: (url: string) => void;
	/**
	 * HTML attributes to add to the image element.
	 * @default {}
	 * @example { class: 'foo' }
	 */
	HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/react" {
	interface Commands<ReturnType> {
		imageUpload: {
			setImage: (options?: ImageUploadNodeOptions) => ReturnType;
		};
	}
}

/**
 * A Tiptap node extension that creates an image upload component.
 * @see registry/tiptap-node/image-upload-node/image-upload-node
 */
export const ImageUploadNode = Node.create<ImageUploadNodeOptions>({
	name: "imageUpload",

	group: "block",

	draggable: true,

	selectable: true,

	atom: true,

	addOptions() {
		return {
			type: "image",
			accept: "image/*",
			limit: 1,
			maxSize: 0,
			upload: undefined,
			onError: undefined,
			onSuccess: undefined,
			HTMLAttributes: {},
		};
	},

	addAttributes() {
		return {
			accept: {
				default: this.options.accept,
			},
			limit: {
				default: this.options.limit,
			},
			maxSize: {
				default: this.options.maxSize,
			},
			src: {},
			alt: { default: null },
			title: { default: null },
			width: { default: "100%" },
			align: { default: "center" },
			caption: { default: "" },
		};
	},

	parseHTML() {
		return [
			{
				tag: "img[src]",
				getAttrs: (dom) => {
					if (typeof dom === "string") return {};
					const el = dom as HTMLImageElement;
					return {
						...el,
						src: el.getAttribute("src"),
						alt: el.getAttribute("alt"),
						title: el.getAttribute("title"),
					};
				},
			},
		];
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: IMAGE_INPUT_REGEX,
				type: this.type,
				getAttributes: (match) => {
					const [, alt, src, title] = match;
					return { src, alt, title };
				},
			}),
		];
	},

	renderHTML(node) {
		return [
			"img",
			{
				...node.HTMLAttributes,
				style: "width: 100%; max-height: 200px; object-fit: cover;",
			},
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(ImageUploadNodeComponent);
	},

	addCommands() {
		return {
			setImage:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options,
					});
				},
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handlePaste(view, event) {
						const items = Array.from(event.clipboardData?.items || []);
						if (items.length === 0) return false;
						const imageItem = items.find((i) => i.type.includes("image"));
						const file = imageItem?.getAsFile();
						if (!file) return false;
						event.preventDefault();
						const { from } = view.state.selection;
						const node = view.state.schema.nodes.imageUpload.create();
						const tr = view.state.tr.insert(from, node);
						view.dispatch(tr);
						return true;
					},
					handleDOMEvents: {
						dragover(view, event) {
							event.preventDefault();
							return false;
						},
						drop(view, event) {
							const hasFile = event.dataTransfer?.files?.length;
							if (!hasFile) return false;
							const images = Array.from(event.dataTransfer.files).filter(
								(file) => /image/i.test(file.type),
							);

							if (images.length === 0) return false;

							event.preventDefault();
							const coords = view.posAtCoords({
								left: event.clientX,
								top: event.clientY,
							});
							images.forEach((i) => {
								const reader = new FileReader();
								reader.onload = (revent) => {
									const b64 = revent.target?.result;
									const imgNode = view.state.schema.nodes.imageUpload.create({
										src: b64,
									});
									const tr = view.state.tr.insert(
										coords?.pos ?? view.state.selection.from,
										imgNode,
									);
									view.dispatch(tr);
								};

								console.log("Here");
								reader.readAsDataURL(i);
							});
							return true;
						},
					},
				},
			}),
		];
	},

	/**
	 * Adds Enter key handler to trigger the upload component when it's selected.
	 */
	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				const { selection } = editor.state;
				const { nodeAfter } = selection.$from;

				if (
					nodeAfter &&
					nodeAfter.type.name === "imageUpload" &&
					editor.isActive("imageUpload")
				) {
					const nodeEl = editor.view.nodeDOM(selection.$from.pos);
					if (nodeEl && nodeEl instanceof HTMLElement) {
						// Since NodeViewWrapper is wrapped with a div, we need to click the first child
						const firstChild = nodeEl.firstChild;
						if (firstChild && firstChild instanceof HTMLElement) {
							firstChild.click();
							return true;
						}
					}
				}
				return false;
			},
		};
	},
});

export default ImageUploadNode;
