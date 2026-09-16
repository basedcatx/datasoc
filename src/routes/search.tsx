import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const searchQuerySchema = z.object({
	page: z.enum(["all", "draft", "completed"]).default("all").catch("all"),
	query: z.string().default("How to"),
	tags: z.string().default(""),
});

export const Route = createFileRoute("/search")({
	component: RouteComponent,
	validateSearch: searchQuerySchema,
});

function RouteComponent() {
	return <div className="mx-80"></div>;
}
