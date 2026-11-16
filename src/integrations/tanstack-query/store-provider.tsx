import { createStore } from "@tanstack/react-store";

export const initialStoreState = {
	dirty: false,
	file: {
		name: "",
		content: "",
		content_html: "",
		meta: [] as string[],
		tags: [] as string[],
		id: -1 as number,
		flags: 0 as number,
	},
	preview: {
		content: "" as string,
	},
};
export const appStore = createStore(initialStoreState);
export const resetStore = () =>
	appStore.setState(() => structuredClone(initialStoreState));
