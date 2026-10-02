import { htmlContent } from "#/routes/view/$reportId";
import { DrawerTrigger } from "#/components/ui/drawer";
import { SimpleEditorView } from "./tiptap-templates/simple/simple-editor-view";
import { CardHeader } from "./tiptap-ui-primitive/card";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Drawer, DrawerContent } from "./ui/drawer";
import { useSelector } from "@tanstack/react-store";
import { appStore } from "#/integrations/tanstack-query/store-provider";

export default function PreviewCard() {
	const content = useSelector(appStore, (state) => state.preview.content);
	return (
		<Drawer
			open={content.trim().length > 0}
			onOpenChange={() =>
				appStore.setState((prev) => {
					return { ...prev, preview: { content: "" } };
				})
			}
		>
			<DrawerContent className="border-none mx-auto w-[calc(100%-50rem)]">
				<div
					className="prose-sm overflow-y-auto mx-auto p-8"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: To display saved records (preview) TODO: serialize
					dangerouslySetInnerHTML={{ __html: htmlContent }}
				/>
			</DrawerContent>
		</Drawer>
	);
}
