import { CloseIcon } from "./tiptap-icons/close-icon";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Input } from "./ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Button } from "#/components/ui/button";
import { LucideOption, SeparatorHorizontal } from "lucide-react";
import {
	FieldGroup,
	FieldLegend,
	FieldSet,
	Field,
	FieldLabel,
	FieldContent,
	FieldDescription,
} from "./ui/field";
import { Badge } from "./ui/badge";
import { cn } from "#/lib/tiptap-utils";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { useSelector } from "@tanstack/react-store";
import { Switch } from "./ui/switch";
import { createFlags, FLAGS } from "#/lib/utils";

export default function MetadataDialog() {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const tags = useSelector(appStore, (s) => s.file.tags);
	const meta = useSelector(appStore, (s) => s.file.meta);
	const flags = createFlags(useSelector(appStore, (s) => s.file.flags));

	const toggleIsCompleted = () => {
		startTransition(() => {
			console.log("Toggling flags");
			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, flags: flags.toggle(FLAGS.IS_COMPLETED).value },
			}));
		});
	};

	const handleTags = (str: string) => {
		startTransition(() => {
			const res = str.split(" ");
			res.forEach((t) => {
				t.trim();
			});
			const s = new Set(res);
			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, tags: Array.from(s) },
			}));
		});
	};

	const handleMeta = (str: string) => {
		startTransition(() => {
			const res = str
				.split(" ")
				.filter((m) => /^[a-zA-Z]+:[a-zA-Z0-9\-_]+$/i.test(m));
			res.forEach((t) => {
				t.trim();
			});
			const s = new Set(res);
			appStore.setState((prev) => ({
				...prev,
				file: { ...prev.file, meta: Array.from(s) },
			}));
		});
	};

	return (
		<Popover modal={false} onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					// Did this because of tiptap... the custom color
					className={cn(
						"p-4 rounded-full",
						open && "bg-input/50 [&>_svg]:stroke-indigo-600",
					)}
				>
					<LucideOption className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="tiptap-card w-80 p-4 gap-0"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<div className="flex flex-row-reverse w-full">
					<Button
						variant={"ghost"}
						size={"icon-sm"}
						onClick={() => {
							setOpen(false);
						}}
					>
						<CloseIcon className="size-4" />
					</Button>
				</div>
				<div className="w-full h-full flex flex-col gap-4 ">
					<FieldSet className="flex flex-col gap-0">
						<FieldLegend>Meta information & Tags</FieldLegend>
						<FieldGroup className="flex gap-6">
							<Field>
								<FieldLabel htmlFor="r-tags" className="text-xs">
									Tags (Separated by space)
								</FieldLabel>
								<Input
									id="r-tags"
									onChange={(e) => {
										handleTags(e.target.value);
									}}
									defaultValue={tags.join(" ")}
									className="p-2 rounded-md"
									placeholder="eg water pump fixed..."
								/>
								{tags.length > 0 && (
									<ul className="flex flex-wrap gap-2">
										{tags.map((t) => (
											<li key={t}>
												{t.length > 0 && (
													<Badge variant={"outline"} className="p-2">
														{t}
													</Badge>
												)}
											</li>
										))}
									</ul>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor="r-meta" className="text-xs">
									Fields/Meta (Separated by space)
								</FieldLabel>
								<Input
									className="p-2 rounded-md"
									id="r-tags"
									defaultValue={meta.join(" ")}
									onChange={(e) => {
										handleMeta(e.target.value);
									}}
									placeholder="eg model:2334 serial:6000"
								/>
								{meta.length > 0 && (
									<ul className="flex flex-wrap gap-2">
										{meta.map((t) => (
											<li key={t}>
												{t.length > 0 && (
													<Badge variant={"secondary"} className="p-2">
														{t}
													</Badge>
												)}
											</li>
										))}
									</ul>
								)}
							</Field>
							<Field orientation={"horizontal"}>
								<FieldContent>
									<FieldLabel htmlFor="r-is-completed" className="text-xs">
										Completed
									</FieldLabel>
									<FieldDescription>
										Set this on to signal that the current write up is completed
									</FieldDescription>
								</FieldContent>
								<Switch
									className="p-2 rounded-md"
									id="r-is-completed"
									onCheckedChange={toggleIsCompleted}
									checked={flags.check(FLAGS.IS_COMPLETED)}
								/>
							</Field>
						</FieldGroup>
					</FieldSet>
				</div>
			</PopoverContent>
		</Popover>
	);
}
