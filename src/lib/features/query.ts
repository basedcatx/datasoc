import {
	mutationOptions,
	QueryClient,
	queryOptions,
} from "@tanstack/react-query";
import {
	getAllRecords,
	getRecord,
	hybridSearch,
	updateRecord,
	type R,
	type RUpdate,
} from "../libs";
import { createFlags, FLAGS } from "../utils";

export const recordKeys = {
	all: ["records"] as const,
	search: (query: string) => [...recordKeys.all, "search", query] as const,
	id: (id: number) => [...recordKeys.all, id] as const,
};

export const recordQueries = {
	all: () =>
		queryOptions({
			queryKey: recordKeys.all,
			queryFn: () => getAllRecords(),
			staleTime: 5 * 60 * 1000,
		}),
	search: (query: string) =>
		queryOptions({
			queryKey: [...recordKeys.search(query)],
			queryFn: () => hybridSearch({ text: query }),
			staleTime: 10 * 60 * 1000,
		}),
	id: (id: number) =>
		queryOptions({
			queryKey: recordKeys.id(id),
			staleTime: 5 * 60 * 1000,
			queryFn: () => getRecord(id),
		}),
};

export const recordMutations = (client: QueryClient) => ({
	changeFlag: (id: number) => ({
		mutationKey: recordKeys.id(id),

		onSuccess: () => {
			client.invalidateQueries({ queryKey: recordKeys.id(id) });
		},

		onMutate: ({ flag, data }: { flag: number; data: RUpdate }) => {
			client.cancelQueries({ queryKey: recordKeys.id(id) });

			const prev = data.flags;
			const f = createFlags(prev);
			let newFlag = 1;

			if (f.check(flag)) {
				newFlag = createFlags(f.value).clear(flag).value;
			} else {
				newFlag = createFlags(f.value).set(flag).value;
			}

			client.setQueryData(recordKeys.id(id), () => ({
				...data,
				flag: newFlag,
			}));

			client.setQueryData(recordKeys.all, (old: R[]) => {
				const record = old.find((r) => r.id === data.id);
				if (record) record.flags = newFlag;
				return old;
			});

			return { data };
		},
		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.id(id) });
			client.invalidateQueries({ queryKey: recordKeys.all });
		},
		mutationFn: async ({ flag, data }: { flag: number; data: RUpdate }) => {
			const prev = data.flags;
			const f = createFlags(prev);
			if (f.check(flag)) {
				f.clear(flag);
				return updateRecord({ ...data, flags: f.value }).then((r) =>
					console.log(r),
				);
			}

			f.set(flag);
			return updateRecord({ ...data, flags: f.value }).then((r) =>
				console.log(r),
			);
		},
	}),
});
