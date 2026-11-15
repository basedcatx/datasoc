import { createFileRoute, Link } from "@tanstack/react-router";
import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import { Spinner } from "#/components/ui/spinner";
import { Button } from "#/components/ui/button";
import { RecordTypes } from "#/lib/utils";

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

	if (data.record.record_type === RecordTypes.PDF) {
		return (
			<div className="flex h-dvh flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">PDF records are read-only.</p>
				<Button asChild>
					<Link to="/view/$reportId" params={{ reportId }}>
						Open PDF
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div>
			<SimpleEditor key={reportId} data={data.record} />
		</div>
	);
}
