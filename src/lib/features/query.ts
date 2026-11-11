import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import {
	deleteRecord,
	fetchRecordById,
	fetchRecordByName,
	fetchRecords,
	hybridSearchRecords,
	insertRecord,
	type R,
	type RInsert,
	type RSearchResult,
	type RUpdate,
	updateRecord,
} from "../libs";
import { createFlags, FLAGS, RecordTypes } from "../utils";

export const recordKeys = {
	all: ["records"] as const,
	search: (query: string) => [...recordKeys.all, "search", query] as const,
	id: (id: number) => [...recordKeys.all, "id", id] as const,
	name: (name: string) => [...recordKeys.all, "name", name] as const,
};

export const recordQueries = {
	all: () =>
		queryOptions<{ record: R }[]>({
			queryKey: recordKeys.all,
			queryFn: () => fetchRecords(),
			staleTime: 5 * 60 * 1000,
		}),
	search: (query: string) =>
		queryOptions<RSearchResult[]>({
			queryKey: [...recordKeys.search(query)],
			queryFn: () => hybridSearchRecords({ text: query }),
			staleTime: 10 * 60 * 1000,
		}),
	id: (id: number) =>
		queryOptions<{ record: R }>({
			queryKey: recordKeys.id(id),
			staleTime: 5 * 60 * 1000,
			queryFn: () => fetchRecordById(id),
		}),
	name: (str: string) =>
		queryOptions<{ record: R }>({
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
			return await deleteRecord(id);
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

	// Omitted record type because it can't be changed on update.
	//
	changeFlag: (id: number) => ({
		mutationKey: recordKeys.id(id),

		onMutate: ({
			flag,
			data,
		}: {
			flag: number;
			data: Omit<R, "record_type">;
		}) => {
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
				record: { ...data, flags: newFlag },
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

		mutationFn: async ({
			flag,
			data,
		}: {
			flag: number;
			data: Omit<R, "record_type">;
		}) => {
			const prev = data.flags;
			const f = createFlags(prev);

			if (f.check(flag)) {
				f.clear(flag);
			} else {
				f.set(flag);
			}

			return updateRecord({
				...data,
				id,
				record: { ...data, flags: f.value },
			}).then((r) => console.log(r));
		},
	}),

	restoreAllDeleted: () => ({
		mutationKey: recordKeys.all,

		onMutate: ({ data }: { data: { update: RUpdate }[] }) => {
			client.cancelQueries({ queryKey: [recordKeys.all] });

			for (const d of data) {
				if (!d) continue;

				const newFlag = createFlags(d.update.record.flags).clear(
					FLAGS.IS_DELETED,
				).value;

				client.setQueryData(recordKeys.id(d.update.id), () => ({
					...d,
					flags: newFlag,
				}));

				d.update.record.flags = newFlag;

				client.setQueryData(recordKeys.all, (old: R[]) => {
					const record = old.find((r) => r.id === d.update.record.id);
					if (record) record.flags = d.update.record.flags;
					return old;
				});
			}

			return { data };
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async ({ data }: { data: { update: RUpdate }[] }) => {
			for (const d of data) {
				await updateRecord({
					...d.update,
					record: {
						...d.update.record,
						flags: createFlags(d.update.record.flags).clear(FLAGS.IS_DELETED)
							.value,
					},
				});
			}
			return true;
		},
	}),

	createNewRecord: () => ({
		onMutate: ({ data }: { data: RInsert }) => {
			client.setQueryData(recordKeys.name(data.record.name), data);
			return { data };
		},

		onSettled: (_: any, __: any, { data }: { data: RInsert }) => {
			client.invalidateQueries({ queryKey: recordKeys.name(data.record.name) });
			return { data };
		},

		onSuccess: ({ data }: { data: RInsert }) => {
			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, id: data.record.id ?? -1 },
			}));
			return { data };
		},

		mutationFn: async ({ data }: { data: RInsert }) => {
			const input: RInsert = {
				record: { ...data.record },
			};
			const id = await insertRecord(input);
			if (id === -1) return;
			const record = await fetchRecordById(id);
			client.setQueryData(recordKeys.id(id), record);
			return { data: record };
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
		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
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
