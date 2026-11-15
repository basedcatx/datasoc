import { type QueryClient, queryOptions } from "@tanstack/react-query";
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

	// Toggles one flag. The record type is sent along only so the cache keeps
	// it; update_record never changes it.
	//
	changeFlag: (id: number) => ({
		mutationKey: recordKeys.id(id),

		onMutate: async ({ flag, data }: { flag: number; data: R }) => {
			// Every record key starts with recordKeys.all, so this cancels both
			// the list and the single-record request.
			await client.cancelQueries({ queryKey: recordKeys.all });

			const prevId = client.getQueryData<{ record: R }>(recordKeys.id(id));
			const prevList = client.getQueryData<{ record: R }[]>(recordKeys.all);

			const f = createFlags(data.flags);
			let newFlag = FLAGS.NONE_CLEAR_ALL;

			if (f.check(flag)) {
				newFlag = createFlags(f.value).clear(flag).value;
			} else {
				newFlag = createFlags(f.value).set(flag).value;
			}

			// Only change the flags. Reusing the cached record keeps fields the
			// card doesn't carry (created_at) and avoids overwriting fresher
			// data with a stale card.
			client.setQueryData(recordKeys.id(id), {
				record: {
					...(prevId?.record ?? data),
					flags: newFlag,
				},
			});

			// The list cache holds { record } wrappers, not bare records.
			client.setQueryData(recordKeys.all, (old: { record: R }[]) => {
				if (!old) return old;
				return old.map((r) =>
					r.record.id === id ? { record: { ...r.record, flags: newFlag } } : r,
				);
			});

			return { prevId, prevList, data };
		},

		onError: (
			_: unknown,
			__: { flag: number; data: R },
			context?: {
				prevId?: { record: R };
				prevList?: { record: R }[];
				data: R;
			},
		) => {
			if (context?.prevId) {
				client.setQueryData(recordKeys.id(id), context.prevId);
			} else {
				client.removeQueries({ queryKey: recordKeys.id(id) });
			}

			if (context?.prevList) {
				client.setQueryData(recordKeys.all, context.prevList);
			}
		},

		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.id(id) });
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async ({ flag, data }: { flag: number; data: R }) => {
			const prev = data.flags;
			const f = createFlags(prev);

			if (f.check(flag)) {
				f.clear(flag);
			} else {
				f.set(flag);
			}

			// Flags don't change searchable text, and a PDF's content is
			// base64, so never pay for an embedding call here.
			const res = await updateRecord(
				{
					...data,
					id,
					record: { ...data, id, flags: f.value },
				},
				{ skipEmbedding: true },
			);

			if (!res) throw new Error("update_record affected no rows");
			return res;
		},
	}),

	restoreAllDeleted: () => ({
		mutationKey: recordKeys.all,

		onMutate: ({ data }: { data: { update: RUpdate }[] }) => {
			client.cancelQueries({ queryKey: [recordKeys.all] });

			for (const d of data) {
				if (!d) continue;
				const id = d.update.id;
				if (!id) continue;

				const newFlag = createFlags(d.update.record.flags).clear(
					FLAGS.IS_DELETED,
				).value;

				client.setQueryData(recordKeys.id(id), (old?: { record: R }) => ({
					record: { ...old?.record, ...d.update.record, flags: newFlag },
				}));

				d.update.record.flags = newFlag;

				client.setQueryData(recordKeys.all, (old: { record: R }[]) => {
					const record = old.find(
						(r) => r.record.id === d.update.record.id,
					)?.record;
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
				await updateRecord(
					{
						...d.update,
						record: {
							...d.update.record,
							flags: createFlags(d.update.record.flags).clear(FLAGS.IS_DELETED)
								.value,
						},
					},
					{ skipEmbedding: true },
				);
			}
			return true;
		},
	}),

	createNewRecord: () => ({
		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},

		mutationFn: async ({
			data,
			searchText,
		}: {
			data: RInsert;
			searchText?: string;
		}) => {
			const input: RInsert = {
				record: { ...data.record },
			};
			const id = await insertRecord(input, searchText);
			if (id === -1) throw new Error("create new record returned -1");
			const record = await fetchRecordById(id);
			client.setQueryData(recordKeys.id(id), record);
			return record;
		},
	}),

	updateRecord: () => ({
		onMutate: ({ data }: { data: Omit<RUpdate, "id" | "record_type"> }) => {
			const { id } = data.record;
			if (!id) {
				console.log("Error(updateRecord): Invalid id");
				throw new Error("No ID provided");
			}

			// Omit<R, "record_type"> has no type field, so merge with whatever
			// is cached instead of replacing the record and losing it.
			const prev = client.getQueryData<{ record: R }>(recordKeys.id(id));
			const next = {
				record: {
					...data.record,
					record_type: prev?.record.record_type ?? RecordTypes.DOCUMENT,
				},
			};

			client.setQueryData(recordKeys.id(id), next);
			client.setQueryData(recordKeys.name(data.record.name), next);
			return { data };
		},
		onSettled: () => {
			client.invalidateQueries({ queryKey: recordKeys.all });
		},
		mutationFn: async ({
			data,
		}: {
			data: Omit<RUpdate, "id" | "record_type">;
		}) => {
			const { id } = data.record;
			if (!id) throw new Error("No ID provided");
			const rUpdate: RUpdate = {
				...data,
				record: { ...data.record, id },
				id,
			};
			const res = await updateRecord(rUpdate);
			if (!res) {
				throw new Error("update_record affected no rows");
			}
			return rUpdate;
		},
	}),
});
