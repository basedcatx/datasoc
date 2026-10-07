import {
	mutationOptions,
	QueryClient,
	queryOptions,
} from "@tanstack/react-query";
import {
	deleteRecord,
	fetchRecord,
	fetchRecords,
	hybridSearchRecords,
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
			queryFn: () => fetchRecords(),
			staleTime: 5 * 60 * 1000,
		}),
	search: (query: string) =>
		queryOptions({
			queryKey: [...recordKeys.search(query)],
			queryFn: () => hybridSearchRecords({ text: query }),
			staleTime: 10 * 60 * 1000,
		}),
	id: (id: number) =>
		queryOptions({
			queryKey: recordKeys.id(id),
			staleTime: 5 * 60 * 1000,
			queryFn: () => fetchRecord(id),
		}),
};

export const recordMutations = (client: QueryClient) => ({
	permanentDelete: (id: number) => ({
		mutationKey: recordKeys.id(id),

		onMutate: () => {
			client.cancelQueries({ queryKey: [recordKeys.id(id), recordKeys.all] });

			const data = client.getQueryData<R[]>(recordKeys.all);
			if (!data) return {};

			client.setQueryData(recordKeys.all, () =>
				data.filter((d) => d.id !== id),
			);

			client.removeQueries({ queryKey: recordKeys.id(id) });

			return { data };
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.id(id) });
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async () => {
			return deleteRecord(id).then((r) => console.log(r));
		},
	}),

	permanentDeleteAll: (ids?: number[]) => ({
		mutationKey: recordKeys.all,

		onMutate: () => {
			client.cancelQueries({ queryKey: recordKeys.all });
			if (!ids) return {};

			const data = client
				.getQueryData<R[]>(recordKeys.all)
				?.filter((i) => !ids.includes(i.id!));

			if (!data) return {};

			client.setQueryData(recordKeys.all, () => data);

			client.removeQueries({ queryKey: recordKeys.all });

			return { data };
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async () => {
			if (!ids) return Promise.reject(false);
			for (const id of ids) {
				await deleteRecord(id);
			}
			return Promise.resolve(true);
		},
	}),

	changeFlag: (id: number) => ({
		mutationKey: recordKeys.id(id),

		onMutate: ({ flag, data }: { flag: number; data: RUpdate }) => {
			client.cancelQueries({ queryKey: [recordKeys.id(id), recordKeys.all] });

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
			} else {
				f.set(flag);
			}

			return updateRecord({ ...data, flags: f.value }).then((r) =>
				console.log(r),
			);
		},
	}),

	changeFlagAll: () => ({
		mutationKey: recordKeys.all,

		onMutate: ({ flag, data }: { flag: number; data?: RUpdate[] }) => {
			client.cancelQueries({ queryKey: recordKeys.all });
			if (!data) return {};

			data.forEach(({ id, flags }) => {
				const prev = flags;
				const f = createFlags(prev);

				//  Just to create a new flag obj with the default flag 1
				//  Could also be let flag;
				let newFlag = FLAGS.NONE_CLEAR_ALL;

				// Checks  if a flag exists and toggles otherwise
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
					const record = old.find((r) => r.id === id);
					if (record) record.flags = newFlag;
					return old;
				});
			});

			return { data };
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async ({ flag, data }: { flag: number; data?: RUpdate[] }) => {
			if (!data) return Promise.reject(false);
			for (const d of data) {
				const prev = d.flags;
				const f = createFlags(prev);

				if (f.check(flag)) {
					f.clear(flag);
				} else {
					f.set(flag);
				}

				await updateRecord({ ...d, flags: f.value }).then((r) =>
					console.log(r),
				);
			}
			return Promise.resolve(true);
		},
	}),
});
