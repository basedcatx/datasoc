import { Button } from "#/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "#/components/ui/input";
import {
	LucideChevronRight,
	LucideHeart,
	LucidePlus,
	LucideSave,
	LucideTrash,
} from "lucide-react";

function TooltipButton({
	children,
	tooltip,
}: {
	children: React.ReactNode;
	tooltip: string;
}) {
	return (
		<Tooltip>
			<TooltipTrigger>
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

function GrowInput({ field, value }: { field?: string; value?: string }) {
	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex items-center gap-4">
				<Input placeholder="field..." value={field} />
				<LucideChevronRight className="size-12" />
				<Input placeholder="value..." value={value} />
			</div>
		</div>
	);
}

export default function EditorDrawerCard() {
	return (
		<div className="flex flex-col gap-8 overflow-y-auto scrollbar-none h-full">
			<div className="flex gap-4">
				<TooltipButton tooltip="Save to favorite">
					<LucideHeart className="size-6" />
				</TooltipButton>
				<TooltipButton tooltip="Save to draft">
					<LucideSave className="size-6" />
				</TooltipButton>
				<TooltipButton tooltip="Move to trash">
					<LucideTrash className="size-6" />
				</TooltipButton>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-xs text-muted-foreground">Tags</p>
				<Input placeholder="Type to enter, separated by commas (,)" />
			</div>

			<div className="flex gap-2 flex-col">
				<p className="text-xs text-muted-foreground">Metadata</p>
				<GrowInput />
			</div>

			<Button className="p-4 w-fit rounded-full mx-auto" variant={"default"}>
				<LucidePlus />
			</Button>
		</div>
	);
}
