import { createStore } from "@tanstack/react-store";

export const appStore = createStore({
	editor: {
		file: {
			name: "",
			content: "",
			meta: {},
			tags: [],
		},
	},
});
