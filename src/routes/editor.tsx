import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/editor")({
	component: RouteComponent,
});

function RouteComponent() {
	const [fileName, setFileName] = useState("Unamed");
	const [fileTags, setFileTags] = useState<string[]>([]);
	const [meta, setFileMeta] = useState<Record<string, string>>({});
	const [fileStatus, setFileStatus] = useState("Draft");

	return (
		<div>
			<SimpleEditor
				fileName={fileName}
				onFileNameChange={setFileName}
				fileTags={fileTags}
				onFileTagsChanged={setFileTags}
				metadata={meta}
				onMetadataChanged={setFileMeta}
				fileStatus={fileStatus}
				onFileStatusChanged={setFileStatus}
			/>
		</div>
	);
}
