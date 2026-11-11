import { useQuery } from "@tanstack/react-query";
import { Ghost, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { cn } from "#/lib/tiptap-utils";
import { createFlags, FLAGS } from "#/lib/utils";
import EntryCard from "./entrycard";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readFile } from "@tauri-apps/plugin-fs";
import { basename } from "@tauri-apps/api/path";
import { fileTypeFromBuffer } from "file-type";

function HomeFilter(data: { record: R }[]) {
	return [...data]
		.sort((a, b) => {
			const aTime = a.record.created_at;
			const bTime = b.record.created_at;
			if (!aTime || !bTime) {
				return 0;
			}
			return new Date(bTime).getTime() - new Date(aTime).getTime();
		})
		.filter((d) => !createFlags(d.record.flags).check(FLAGS.IS_DELETED));
}

const validateAndProcessFile = async (
	file: Uint8Array<ArrayBuffer>,
	path: string,
): Promise<string> => {
	if (!file) {
		return "Invalid file selected, please choose a valid pdf file";
	}

	const fileName = await basename(path);
	const typeInfo = await fileTypeFromBuffer(file);

	console.log(typeInfo?.mime, typeInfo?.ext);

	if (
		typeInfo &&
		!(typeInfo.mime === "application/pdf" && typeInfo.ext === "pdf")
	) {
		return "Invalid file detected, please input a valid pdf document";
	}

	await processPdfFile(file, fileName);
	return "";
};

const processPdfFile = async (
	buffer: Uint8Array<ArrayBuffer>,
	name: string,
) => {
	console.log("Processing pdf fie: ", name);
};

export default function RecentlyCreatedCard() {
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let unlisten: (() => void) | undefined;
		async function setupDropZone() {
			const appWindow = getCurrentWebviewWindow();
			unlisten = await appWindow.onDragDropEvent((e) => {
				if (e.payload.type === "over") {
					setIsDragging(true);
				} else if (e.payload.type === "drop") {
					setIsDragging(false);
					const paths = e.payload.paths;
					if (paths && paths.length > 0) {
						readFile(paths[0]).then((buffer) =>
							validateAndProcessFile(buffer, paths[0]).then((res) => {
								if (res.length > 0) {
									toast.error(res);
								}
							}),
						);
					}
				}
			});
		}

		setupDropZone();
		return () => {
			if (unlisten) unlisten();
		};
	}, []);

	const { data, isPending, error } = useQuery({
		...recordQueries.all(),
		select: HomeFilter,
	});

	if (isPending) {
		return (
			<div>
				<div className="flex flex-col gap-4 rounded-xl">
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
					<Skeleton className="w-full h-30" />
				</div>
			</div>
		);
	}

	if (!data) {
		return <div>Something went wrong, invalid data: {error?.message}</div>;
	}

	const handleFileInputClick = () => {
		fileInputRef.current?.click();
	};

	const handleInputChange = (list: FileList | null) => {
		if (!list || list.length === 0) return;
		validateAndProcessFile(list[0]);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<div className="flex flex-col h-full gap-3">
			<button
				onClick={handleFileInputClick}
				type="button"
				tabIndex={0}
				className={cn(
					"w-full  cursor-pointer border-dashed p-4 border-2 dark:bg-secondary dark:text-secondary-foreground bg-secondary-foreground text-secondary flex justify-center items-center flex-col",
					isDragging && "bg-red-600",
				)}
			>
				<Input
					type="file"
					ref={fileInputRef}
					onChange={(e) => {
						e.preventDefault();
						handleInputChange(e.target.files);
					}}
					accept="application/pdf, .pdf"
					className="hidden"
				/>
				<Upload className="size-6 stroke-muted" />
				<p className="text-center text-muted">Drag or click to upload PDF</p>
			</button>
			<div className="flex flex-col grow h-full gap-4">
				{data.length > 0 ? (
					<ul className="flex gap-4 flex-col">
						{data.slice(0, 5).map((e) => (
							<li key={e.record.name}>
								<EntryCard {...e.record} />
							</li>
						))}
					</ul>
				) : (
					<div className="flex flex-col justify-center items-center shadow-none gap-4 h-full ">
						<Ghost className="size-30 stroke-muted-foreground" />
						<p className="text-muted-foreground text-lg shimmer">
							No entry found. Click on new to populate
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
