import { QueryClient } from "@tanstack/react-query";
import {
	BaseDirectory,
	readFile,
	writeFile,
	remove,
} from "@tauri-apps/plugin-fs";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
	persistQueryClient,
	PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { getVersion } from "@tauri-apps/api/app";

const TauriAsyncStorage = {
	getItem: async (_: string) => {
		try {
			return new TextDecoder().decode(
				await readFile("query-cache.json", {
					baseDir: BaseDirectory.AppLocalData,
				}),
			);
		} catch (noop) {
			return null;
		}
	},

	setItem: async (_: string, value: string) => {
		const encoder = new TextEncoder();
		return await writeFile("query-cache.json", encoder.encode(value), {
			baseDir: BaseDirectory.AppLocalData,
		});
	},

	removeItem: async (_: string) =>
		await remove("query-cache.json", { baseDir: BaseDirectory.AppLocalData }),
};

export function getContext() {
	const persistor = createAsyncStoragePersister({
		storage: TauriAsyncStorage,
	});

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
		},
	});

	return { queryClient, persistor };
}

export default function TanstackQueryProvider() {}
