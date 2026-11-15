import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { PdfViewerClient } from "#/components/pdf/pdf-viewer-client";
import { SimpleEditorView } from "#/components/tiptap-templates/simple/simple-editor-view";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { recordQueries } from "#/lib/features/query";
import { RecordTypes } from "#/lib/utils";

export function RecordDetailPane() {
	const selectedId = useSelector(appStore, (s) => s.selectedRecordId);
	const { data, isPending, error } = useQuery(
		recordQueries.id(Math.max(selectedId, 1)),
	);

	if (selectedId === -1) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
				Select a record from the list to view it here.
			</div>
		);
	}

	if (isPending) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8">
				Loading record...
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
				Error loading record: {error?.message}
			</div>
		);
	}

	const { content, content_html, record_type, name } = data.record;

	if (record_type === RecordTypes.PDF) {
		return <PdfViewerClient key={selectedId} content={content} name={name} />;
	}

	return (
		<SimpleEditorView key={selectedId} name={name} content={content_html} />
	);
}
