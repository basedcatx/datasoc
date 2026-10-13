import { createStore } from "@tanstack/react-store";

export const initialStoreState = {
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
};
export const appStore = createStore(initialStoreState);
