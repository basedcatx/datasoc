import { createFileRoute } from "@tanstack/react-router";
import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";

export const Route = createFileRoute("/editor/$reportId")({
	component: RouteComponent,
});

function RouteComponent() {

	const { reportId } = Route.useParams();

	const { data } = useQuery({ ...recordQueries.id(Number(reportId)), enabled: !!reportId });

	return (
		<div>
			<SimpleEditor data={data} />
		</div>
	);
}

