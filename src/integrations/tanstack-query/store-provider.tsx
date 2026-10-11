import { createStore } from "@tanstack/react-store";

export const appStore = createStore({
	file: {
		name: "",
		content: "",
		content_html: "",
		meta: [] as string[],
		tags: [] as string[],
		id: -1 as number,
	},
	preview: {
		content: "" as string,
	},
});
