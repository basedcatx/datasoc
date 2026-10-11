import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/editor")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<SimpleEditor />
		</div>
	);
}
