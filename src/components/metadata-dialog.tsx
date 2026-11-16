import { useSelector } from "@tanstack/react-store";
import { ArrowRight, Plus, Tags, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { FLAGS } from "#/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";

type MetaEntry = {
	id: string;
	key: string;
	value: string;
};

function parseMeta(entries: string[]): MetaEntry[] {
	return entries.map((entry, index) => {
		const separator = entry.indexOf(":");
		return {
			id: `existing-${index}`,
			key: separator === -1 ? entry.trim() : entry.slice(0, separator).trim(),
			value: separator === -1 ? "" : entry.slice(separator + 1).trim(),
		};
	});
}

function serializeMeta(entries: MetaEntry[]): string[] {
	return entries.flatMap(({ key, value }) => {
		const normalizedKey = key.trim();
		const normalizedValue = value.trim();
		return normalizedKey && normalizedValue
			? [`${normalizedKey}:${normalizedValue}`]
			: [];
	});
}

export default function MetadataDialog() {
	const [open, setOpen] = useState(false);
	const [tagDraft, setTagDraft] = useState("");
	const [metaEntries, setMetaEntries] = useState<MetaEntry[]>([]);
	const nextMetaId = useRef(0);
	const tags = useSelector(appStore, (state) => state.file.tags);
	const flags = useSelector(appStore, (state) => state.file.flags);
	const isCompleted = (flags & FLAGS.IS_COMPLETED) !== 0;

	useEffect(() => {
		if (!open) return;
		setTagDraft("");
		setMetaEntries(parseMeta(appStore.state.file.meta));
	}, [open]);

	const commitTags = (draft: string) => {
		const additions = draft
			.split(/[\s,]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);
		if (additions.length > 0) {
			appStore.setState((state) => {
				const seen = new Set(state.file.tags.map((tag) => tag.toLowerCase()));
				const tagsToAdd = additions.filter((tag) => {
					const normalized = tag.toLowerCase();
					if (seen.has(normalized)) return false;
					seen.add(normalized);
					return true;
				});
				return {
					...state,
					file: { ...state.file, tags: [...state.file.tags, ...tagsToAdd] },
				};
			});
		}
		setTagDraft("");
	};

	const removeTag = (index: number) => {
		appStore.setState((state) => ({
			...state,
			file: {
				...state.file,
				tags: state.file.tags.filter((_, tagIndex) => tagIndex !== index),
			},
		}));
	};

	const updateMetaEntries = (nextEntries: MetaEntry[]) => {
		setMetaEntries(nextEntries);
		appStore.setState((state) => ({
			...state,
			file: { ...state.file, meta: serializeMeta(nextEntries) },
		}));
	};

	const addMetaEntry = () => {
		setMetaEntries((entries) => [
			...entries,
			{ id: `new-${nextMetaId.current++}`, key: "", value: "" },
		]);
	};

	const removeMetaEntry = (id: string) => {
		updateMetaEntries(metaEntries.filter((entry) => entry.id !== id));
	};

	const updateMetaEntry = (
		id: string,
		field: "key" | "value",
		value: string,
	) => {
		updateMetaEntries(
			metaEntries.map((entry) =>
				entry.id === id ? { ...entry, [field]: value } : entry,
			),
		);
	};

	const toggleCompleted = (checked: boolean) => {
		appStore.setState((state) => ({
			...state,
			file: {
				...state.file,
				flags: checked
					? state.file.flags | FLAGS.IS_COMPLETED
					: state.file.flags & ~FLAGS.IS_COMPLETED,
			},
		}));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Edit tags and metadata"
					title="Tags and metadata"
					aria-expanded={open}
				>
					<Tags className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				sideOffset={8}
				className="w-[min(26rem,calc(100vw-1rem))] overflow-hidden p-0"
			>
				<div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
					<div className="min-w-0">
						<h2 className="text-sm font-semibold">Record details</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							Organize this document with tags and custom fields.
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Close record details"
						onClick={() => setOpen(false)}
					>
						<X className="size-4" />
					</Button>
				</div>

				<div className="max-h-[min(70dvh,34rem)] space-y-5 overflow-y-auto p-4">
					<section aria-labelledby="record-tags-heading" className="space-y-2">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h3 id="record-tags-heading" className="text-sm font-medium">
									Tags
								</h3>
								<p
									id="record-tags-help"
									className="text-xs text-muted-foreground"
								>
									Press Enter or comma to add a tag.
								</p>
							</div>
							<span className="text-xs tabular-nums text-muted-foreground">
								{tags.length}
							</span>
						</div>
						<div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border-input bg-background px-2 py-1.5 shadow-xs focus-within:ring-1 focus-within:ring-ring">
							{tags.map((tag, index) => (
								<Badge
									key={tag}
									variant="secondary"
									className="gap-1 rounded-md px-2 py-1"
								>
									<span>#{tag}</span>
									<button
										type="button"
										aria-label={`Remove tag ${tag}`}
										className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										onClick={() => removeTag(index)}
									>
										<X className="size-3" />
									</button>
								</Badge>
							))}
							<Input
								id="record-tags-input"
								value={tagDraft}
								onChange={(event) => setTagDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === ",") {
										event.preventDefault();
										commitTags(tagDraft);
									}
								}}
								onBlur={() => {
									if (tagDraft.trim()) commitTags(tagDraft);
								}}
								aria-label="Add tags"
								aria-describedby="record-tags-help"
								placeholder={tags.length ? "Add another…" : "e.g. maintenance"}
								className="h-8 min-w-28 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
							/>
						</div>
					</section>

					<section
						aria-labelledby="record-fields-heading"
						className="space-y-2 pt-4"
					>
						<div className="flex items-center justify-between gap-3">
							<div>
								<h3 id="record-fields-heading" className="text-sm font-medium">
									Custom fields
								</h3>
								<p className="text-xs text-muted-foreground">
									Add searchable details such as asset or priority.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={addMetaEntry}
								className="shrink-0"
							>
								<Plus />
								Add field
							</Button>
						</div>
						{metaEntries.length > 0 ? (
							<div className="space-y-2">
								{metaEntries.map((entry, index) => (
									<div
										key={entry.id}
										className="flex min-w-0 items-center gap-1.5"
									>
										<Input
											value={entry.key}
											autoFocus={entry.id.startsWith("new-")}
											onChange={(event) =>
												updateMetaEntry(entry.id, "key", event.target.value)
											}
											aria-label={`Field name ${index + 1}`}
											placeholder="Name"
											className="min-w-0"
										/>
										<ArrowRight
											aria-hidden="true"
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<Input
											value={entry.value}
											onChange={(event) =>
												updateMetaEntry(entry.id, "value", event.target.value)
											}
											aria-label={`Field value ${index + 1}`}
											placeholder="Value"
											className="min-w-0"
										/>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Remove ${entry.key || "custom field"}`}
											onClick={() => removeMetaEntry(entry.id)}
										>
											<X className="size-4" />
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
								No custom fields yet.
							</p>
						)}
					</section>

					<section className="flex items-center justify-between gap-4 pt-4">
						<div>
							<Label htmlFor="record-completed" className="text-sm font-medium">
								Completed
							</Label>
							<p className="text-xs text-muted-foreground">
								Mark this document as finished.
							</p>
						</div>
						<Switch
							id="record-completed"
							checked={isCompleted}
							onCheckedChange={toggleCompleted}
							aria-label="Mark document completed"
						/>
					</section>
				</div>
			</PopoverContent>
		</Popover>
	);
}
