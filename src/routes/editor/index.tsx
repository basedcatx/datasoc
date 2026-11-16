import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { SimpleEditor } from "#/components/tiptap-templates/simple/simple-editor";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import {
	appStore,
	resetStore,
} from "#/integrations/tanstack-query/store-provider";
import { useSelector } from "@tanstack/react-store";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/editor/")({
	component: RouteComponent,
});

function RouteComponent() {
	const state = useSelector(appStore, (store) => store.file)
	const dirty = useSelector(appStore, (state) => state.dirty);

	const { status, proceed, reset } = useBlocker({
		shouldBlockFn: () => dirty,
		withResolver: true,
	});

	// Entering /editor always starts a fresh note, so a previously opened
	// record can't be overwritten by accident.
	useLayoutEffect(() => {
		resetStore();
	}, []);

	return (
		<div>
			<Dialog status={status} proceed={proceed} reset={reset} />
			<SimpleEditor />
		</div>
	);
}

function Dialog({
	status,
	proceed,
	reset,
}: {
	status: string;
	proceed: (() => void) | undefined;
	reset: (() => void) | undefined;
}) {
	const handleClearState = resetStore;

	return (
		<AlertDialog open={status === "blocked"}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will discard any unsaved changes
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={reset}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							handleClearState();
							proceed?.();
						}}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
