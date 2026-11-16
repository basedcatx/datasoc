import { createFileRoute, redirect } from "@tanstack/react-router";
import { SimpleEditorView } from "#/components/tiptap-templates/simple/simple-editor-view";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import { PdfViewerClient } from "#/components/pdf/pdf-viewer-client";
import { Spinner } from "#/components/ui/spinner";
import { RecordTypes } from "#/lib/utils";

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
	const { data, error, isError, isPending } = useQuery(
		recordQueries.id(Number(id)),
	);

	if (isError) {
		return <div>{error.message}</div>;
	}

	if (isPending || !data) {
		return <Spinner className="mx-auto my-auto size-10 h-full" />;
	}

	const { name, content, content_html, record_type } = data.record;

	if (record_type === RecordTypes.PDF) {
		return <PdfViewerClient key={id} content={content} name={name} />;
	}

	return (
		<div>
			<SimpleEditorView key={id} name={name} content={content_html} />
		</div>
	);
}
