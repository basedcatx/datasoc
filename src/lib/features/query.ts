import {
	mutationOptions,
	QueryClient,
	queryOptions,
} from "@tanstack/react-query";
import {
	deleteRecord,
	fetchRecordById,
	fetchRecordByName,
	fetchRecords,
	hybridSearchRecords,
	insertRecord,
	updateRecord,
	type R,
	type RUpdate,
} from "../libs";
import { createFlags, FLAGS } from "../utils";
import { appStore } from "#/integrations/tanstack-query/store-provider";

export const recordKeys = {
	all: ["records"] as const,
	search: (query: string) => [...recordKeys.all, "search", query] as const,
	id: (id: number) => [...recordKeys.all, "id", id] as const,
	name: (name: string) => [...recordKeys.all, "name", name] as const,
};

export const recordQueries = {
	all: () =>
		queryOptions<R[]>({
			queryKey: recordKeys.all,
			queryFn: () => fetchRecords(),
			staleTime: 5 * 60 * 1000,
		}),
	search: (query: string) =>
		queryOptions<R[]>({
			queryKey: [...recordKeys.search(query)],
			queryFn: () => hybridSearchRecords({ text: query }),
			staleTime: 10 * 60 * 1000,
		}),
	id: (id: number) =>
		queryOptions<R>({
			queryKey: recordKeys.id(id),
			staleTime: 5 * 60 * 1000,
			queryFn: () => fetchRecordById(id),
		}),
	name: (str: string) =>
		queryOptions<R>({
			queryKey: recordKeys.name(str),
			staleTime: 5 * 60 * 1000,
			queryFn: () => fetchRecordByName(str),
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
				// biome-ignore lint/style/noNonNullAssertion: i.id wouldl always be defined from it's source
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
			let newFlag = FLAGS.NONE_CLEAR_ALL;

			if (f.check(flag)) {
				newFlag = createFlags(f.value).clear(flag).value;
			} else {
				newFlag = createFlags(f.value).set(flag).value;
			}

			client.setQueryData(recordKeys.id(id), () => ({
				...data,
				flags: newFlag,
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

	restoreAllDeleted: () => ({
		mutationKey: recordKeys.all,

		onMutate: ({ data }: { data: RUpdate[] }) => {
			client.cancelQueries({ queryKey: [recordKeys.all] });

			for (const d of data) {
				if (!d) continue;

				const newFlag = createFlags(d.flags).clear(FLAGS.IS_DELETED).value;

				client.setQueryData(recordKeys.id(d.id), () => ({
					...d,
					flags: newFlag,
				}));

				d.flags = newFlag;

				client.setQueryData(recordKeys.all, (old: R[]) => {
					const record = old.find((r) => r.id === d.id);
					if (record) record.flags = d.flags;
					return old;
				});
			}

			return { data };
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async ({ data }: { data: RUpdate[] }) => {
			for (const d of data) {
				await updateRecord({
					...d,
					flags: createFlags(d.flags).clear(FLAGS.IS_DELETED).value,
				});
			}
			return true;
		},
	}),

	createNewRecord: () => ({
		onMutate: ({ record }: { record: R }) => {
			client.setQueryData(recordKeys.name(record.name), record);
			return { record };
		},

		onSettled: (_, __, { record }: { record: R }) => {
			client.invalidateQueries({ queryKey: recordKeys.name(record.name) });
		},

		onSuccess: (data: { record: R }) => {
			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, id: data.record.id ?? -1 },
			}));
		},

		mutationFn: async ({ record }: { record: R }) => {
			await insertRecord(record);
			const temp = await fetchRecordByName(record.name);
			// This is a very silly check btw. Temp would always have an id, thanks to ts
			if (temp.id) client.setQueryData(recordKeys.id(temp.id), temp);
			return { record: temp };
		},
	}),

	updateRecord: () => ({
		onMutate: ({ record }: { record: R }) => {
			const { id } = record;
			if (!id) {
				console.log("Error(updateRecord): Invalid id");
				return;
			}
			client.setQueryData(recordKeys.id(id), record);
			client.setQueryData(recordKeys.name(record.name), record);
			return { record };
		},
		mutationFn: async ({ record }: { record: R }) => {
			const id = record.id;
			if (!id) return undefined;
			const rUpdate: RUpdate = { ...record, id };
			await updateRecord(rUpdate);
			return rUpdate;
		},
	}),
});
