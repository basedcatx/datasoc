import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import SearchCard from "#/components/SearchCard";

const searchQuerySchema = z.object({
	page: z.enum(["all", "starred", "deleted"]).default("all").catch("all"),
	query: z.string().default(""),
});

const RECENT_KEY = "datasoc.recentSearches";
const MAX_RECENT = 5;

export const Route = createFileRoute("/search")({
	component: RouteComponent,
	validateSearch: searchQuerySchema,
});

function RouteComponent() {
	const { query, page } = Route.useSearch();
	const navigate = useNavigate();
	const [recent, setRecent] = useState<string[]>([]);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(RECENT_KEY);
			setRecent(raw ? JSON.parse(raw) : []);
		} catch {
			setRecent([]);
		}
	}, []);

	const addRecent = useCallback((q: string) => {
		if (!q.trim()) return;
		setRecent((prev) => {
			const next = [q.trim(), ...prev.filter((r) => r !== q.trim())].slice(
				0,
				MAX_RECENT,
			);
			try {
				localStorage.setItem(RECENT_KEY, JSON.stringify(next));
			} catch {
				// ignore quota errors
			}
			return next;
		});
	}, []);

	useEffect(() => {
		if (query.trim().length > 0) {
			addRecent(query);
		}
	}, [query, addRecent]);

	const goToSearch = useCallback(
		(q: string) => {
			navigate({ to: "/search", search: { query: q, page: "all" } });
		},
		[navigate],
	);

	if (query.trim().length === 0) {
		return (
			<div className="px-8 py-4">
				{recent.length > 0 ? (
					<>
						<p className="text-muted-foreground text-sm mb-3">
							Recent searches
						</p>
						<div className="flex flex-wrap gap-2 mb-6">
							{recent.map((q) => (
								<button
									key={q}
									type="button"
									onClick={() => goToSearch(q)}
									className="rounded-full border border-input bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
								>
									{q}
								</button>
							))}
						</div>
					</>
				) : (
					<p className="text-muted-foreground text-sm mb-6">
						No recent searches. Start typing to find records.
					</p>
				)}
				<SearchCard query={query} page={page} />
			</div>
		);
	}

	return <SearchCard query={query} page={page} />;
}
