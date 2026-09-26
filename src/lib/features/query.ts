import { queryOptions } from "@tanstack/react-query";
import { getAllRecords, getRecord } from "../libs";

export const recordKeys = {
	all: ["records"] as const,
	id: (id: number) => [...recordKeys.all, id] as const,
};

export const recordQueries = {
	all: () =>
		queryOptions({
			queryKey: recordKeys.all,
			queryFn: () => getAllRecords(),
			staleTime: 5 * 60 * 1000,
		}),
	id: (id: number) =>
		queryOptions({
			queryKey: recordKeys.id(id),
			staleTime: 5 * 60 * 1000,
			queryFn: () => getRecord(id),
		}),
};
