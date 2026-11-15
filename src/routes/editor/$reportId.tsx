import { createFileRoute } from "@tanstack/react-router";
import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import { Spinner } from "#/components/ui/spinner";

export const Route = createFileRoute("/editor/$reportId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { reportId } = Route.useParams();

	const { data, isPending, isError, error } = useQuery({
		...recordQueries.id(Number(reportId)),
		enabled: !!reportId,
	});

	if (isError) {
		return (
			<div>
				<p>{error.message}</p>
			</div>
		);
	}

	if (isPending) {
		return <Spinner className="mx-auto my-auto size-10 h-full" />;
	}

	return (
		<div>
			<SimpleEditor key={reportId} data={data.record} />
		</div>
	);
}
