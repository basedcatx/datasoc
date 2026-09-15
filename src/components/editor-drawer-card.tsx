import { Button } from "#/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "#/components/ui/input";
import {
	LucideChevronRight,
	LucideHeart,
	LucideMinus,
	LucidePlus,
	LucideSave,
	LucideTrash,
} from "lucide-react";
import { useSelector } from "@tanstack/react-store";
import { appStore } from "#/integrations/tanstack-query/store-provider";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

function TooltipButton({
	children,
	tooltip,
}: {
	children: React.ReactNode;
	tooltip: string;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant={"secondary"} className={"cursor-pointer"}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	);
}

function MetaInput({
	name,
	value,
	onDelete,
	onDataChange,
	id,
}: {
	name: string;
	value: string;
	id: string;
	onDelete: (key: string) => void;
	onDataChange: (id: string, field: "name" | "value", value: string) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 w-full" id={id}>
			<div className="flex items-center gap-3">
				<Input
					placeholder="field..."
					defaultValue={name}
					className="focus-visible:ring-0"
					onChange={(e) => {
						e.preventDefault();
						onDataChange(id, "name", e.target.value);
					}}
				/>
				<LucideChevronRight className="size-12" />
				<Input
					placeholder="value..."
					defaultValue={value}
					className="focus-visible:ring-0"
					onChange={(e) => {
						e.preventDefault();
						onDataChange(id, "value", e.target.value);
					}}
				/>
				<Button
					onClick={(e) => {
						e.preventDefault();
						onDelete(id);
					}}
					className="rounded-full [&_svg]:stroke-white bg-red-600/30"
					size={"icon-xs"}
					variant={"default"}
				>
					<LucideMinus />
				</Button>
			</div>
		</div>
	);
}

export default function EditorDrawerCard() {
	const tags = useSelector(appStore, (state) => state.file.tags);
	const metas = useSelector(appStore, (state) => state.file.meta);

	const handleMetaDelete = (id: string) => {
		if (metas.length < 2) return;
		appStore.setState((state) => ({
			...state,
			file: {
				...state.file,
				meta: [
					...state.file.meta.filter(
						(obj: Record<string, string>) => obj.id !== id,
					),
				],
			},
		}));
	};

	const handleAddMeta = () => {
		appStore.setState((state) => ({
			...state,
			file: {
				...state.file,
				meta: [
					...state.file.meta,
					{
						id: `id${Math.random().toString(16)}`,
						name: "",
						value: "",
					},
				],
			},
		}));
	};

	const handleMetaUpdate = (
		id: string,
		field: "name" | "value",
		value: string,
	) => {
		appStore.setState((state) => {
			const _state = state;
			for (const obj of _state.file.meta as [Record<string, string>]) {
				if (obj.id === id) {
					obj[field] = value;
					break;
				}
			}
			return _state;
		});
	};

	const handleTagChange = (value: string) => {
		appStore.setState((state) => ({
			...state,
			file: {
				...state.file,
				tags: value
					.trim()
					.split(",")
					.map((v) => v.trim()),
			},
		}));
	};

	return (
		<div className="flex flex-col gap-8 overflow-y-hidden overflow-x-hidden h-full px-2">
			<div className="flex flex-col gap-2">
				<p className="text-xs text-muted-foreground">Tags</p>
				<Textarea
					placeholder="Type to enter, separated by commas (,)"
					onChange={(e) => {
						e.preventDefault();
						handleTagChange(e.target.value);
					}}
				/>
				{
					<ul className="flex flex-wrap gap-2 mt-4">
						{tags.map((tag) => {
							return (
								tag.trim() && (
									<li key={tag}>
										<Badge variant={"outline"} className="p-4">
											<p className="text-nowrap truncate max-w-20">{tag}</p>
										</Badge>
									</li>
								)
							);
						})}
					</ul>
				}
			</div>

			<div className="flex gap-1 flex-col overflow-y-auto">
				<p className="text-xs text-muted-foreground">Metadata</p>
				<ul>
					{metas.map(({ id, name, value }: Record<string, string>) => (
						<li key={id}>
							<MetaInput
								onDataChange={handleMetaUpdate}
								id={id}
								name={name}
								value={value}
								onDelete={() => {
									handleMetaDelete(id);
								}}
							/>
						</li>
					))}
				</ul>
			</div>

			<Button
				className="p-4 w-xs rounded-full mx-auto"
				variant={"default"}
				onClick={(e) => {
					e.preventDefault();
					handleAddMeta();
				}}
			>
				<LucidePlus className="size-6" />
			</Button>
		</div>
	);
}
