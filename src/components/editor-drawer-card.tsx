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
import { Card } from "./ui/card";

function MetaInput({
	name,
	value,
	onDelete,
	onDataChange,
	enabled,
	id,
}: {
	name: string;
	value: string;
	id: string;
	enabled: boolean;
	onDelete: (key: string) => void;
	onDataChange: (id: string, field: "name" | "value", value: string) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 w-full" id={id}>
			<div className="flex items-center gap-3">
				<Input
					disabled={!enabled}
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
					disabled={!enabled}
					placeholder="value..."
					defaultValue={value}
					className="focus-visible:ring-0"
					onChange={(e) => {
						e.preventDefault();
						onDataChange(id, "value", e.target.value);
					}}
				/>
				<Button
					disabled={!enabled}
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

export default function EditorDrawerCard({
	enabled = false,
}: {
	enabled?: boolean;
}) {
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
}
