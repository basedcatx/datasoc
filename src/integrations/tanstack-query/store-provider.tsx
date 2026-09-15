import { createStore } from "@tanstack/react-store";

export const appStore = createStore({
	file: {
		name: "",
		content: "",
		meta: [{}],
		tags: [] as string[],
	},
});
