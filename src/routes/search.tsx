import SearchCard from "#/components/SearchCard";
import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import z from "zod";

const searchQuerySchema = z.object({
	page: z.enum(["all", "starred", "deleted"]).default("all").catch("all"),
	query: z.string().default("How to"),
});

export const Route = createFileRoute("/search")({
	component: RouteComponent,
	validateSearch: searchQuerySchema,
});

function RouteComponent() {
	const { query, page } = Route.useSearch();
	return (
		<div>
			<SearchCard query={query} page={page} />
		</div>
	);
}
