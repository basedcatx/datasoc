import { useQuery } from "@tanstack/react-query";
import { Ghost, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { isPdfBuffer, openPdfUpload } from "#/lib/pdf";
import { createFlags, FLAGS } from "#/lib/utils";
import EntryCard from "./entrycard";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

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

export default function RecentlyCreatedCard() {
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const handleInputChange = async (list: FileList | null) => {
		if (!list || list.length === 0) return;

		const file = list[0];
		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			if (!isPdfBuffer(bytes)) {
				toast.error("Only PDF files can be uploaded");
				return;
			}

			openPdfUpload({ fileName: file.name, bytes });
		} catch (e) {
			toast.error(`Could not read the selected file: ${e}`);
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<div className="flex flex-col h-full gap-3">
			<button
				onClick={handleFileInputClick}
				type="button"
				tabIndex={0}
				className="w-full cursor-pointer border-dashed p-4 border-2 dark:bg-secondary dark:text-secondary-foreground bg-secondary-foreground text-secondary flex justify-center items-center flex-col"
			>
				<Input
					type="file"
					ref={fileInputRef}
					onChange={(e) => {
						e.preventDefault();
						void handleInputChange(e.target.files);
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
