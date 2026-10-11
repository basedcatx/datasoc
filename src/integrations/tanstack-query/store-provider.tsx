import { createStore } from "@tanstack/react-store";

export const appStore = createStore({
	file: {
		name: "",
		content: "",
		meta: [] as string[],
		tags: [] as string[],
	},
	preview: {
		content: "" as string,
	},
});
