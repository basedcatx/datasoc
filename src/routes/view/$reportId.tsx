import { createFileRoute, redirect } from "@tanstack/react-router";
import { SimpleEditorView } from "#/components/tiptap-templates/simple/simple-editor-view";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";

export const Route = createFileRoute("/view/$reportId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		if (!params.reportId) throw redirect({ to: "/editor" });
		const nId = Number.parseInt(params.reportId, 10);
		if (!nId) throw redirect({ to: "/editor" });
	},
});

function RouteComponent() {
	const id = Route.useParams().reportId;
	const { data, error, isError } = useQuery(recordQueries.id(Number(id)));

	if (!data) {
		return <div>No data found</div>;
	}

	if (isError) {
		return <div>{error.message}</div>;
	}

	const { name, content_html } = data;

	return (
		<div>
			<SimpleEditorView key={id} name={name} content={content_html} />
		</div>
	);
}
