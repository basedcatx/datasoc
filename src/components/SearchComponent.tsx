import { useNavigate } from "@tanstack/react-router";
import {
	InboxIcon,
	Library,
	Plus,
	Search,
	Settings,
	Trash,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { openPdfUpload } from "#/lib/pdf";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
} from "@/components/ui/command";
import { AddRecordDialog } from "./add-record-dialog";

export default function SearchComponent({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [page, setPage] = useState<"all" | "starred" | "deleted">("all");
	const [addOpen, setAddOpen] = useState(false);
	const nav = useNavigate();
	const { setTheme } = useTheme();

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen(true);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const handleSearchClick = () => {
		if (query.length > 0) {
			setOpen(false);
			nav({ to: "/search", search: { query, page } });
			setPage("all");
		}
	};

	const handleNewDocument = () => {
		setOpen(false);
		setAddOpen(false);
		nav({ to: "/editor" });
	};

	const handleUploadPdf = () => {
		setOpen(false);
		setAddOpen(false);
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/pdf,.pdf";
		input.style.display = "none";
		document.body.appendChild(input);
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const bytes = new Uint8Array(await file.arrayBuffer());
			const { isPdfBuffer } = await import("#/lib/pdf");
			if (!isPdfBuffer(bytes)) {
				// eslint-disable-next-line no-console
				console.error("Not a PDF");
				return;
			}
			openPdfUpload({ fileName: file.name, bytes });
		};
		input.click();
		document.body.removeChild(input);
	};

	const handleToggleTheme = () => {
		setOpen(false);
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<div className="flex flex-col gap-4">
			<Button onClick={() => setOpen(true)} variant={"ghost"} asChild>
				{children}
			</Button>

			<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />

			<CommandDialog
				open={open}
				onOpenChange={() => {
					setOpen(false);
					setQuery("");
				}}
				className="w-full max-w-md"
			>
				<Command>
					<CommandGroup>
						<CommandItem
							onClick={handleNewDocument}
							className="flex items-center gap-3 p-2"
						>
							<Plus className="size-5" />
							New document
						</CommandItem>
						<CommandItem
							onClick={handleUploadPdf}
							className="flex items-center gap-3 p-2"
						>
							<Library className="size-5" />
							Upload PDF
						</CommandItem>
						<CommandSeparator />
						<CommandItem
							onClick={() => {
								setOpen(false);
								nav({ to: "/library" });
							}}
							className="flex items-center gap-3 p-2"
						>
							<InboxIcon className="size-5" />
							Library
						</CommandItem>
						<CommandItem
							onClick={() => {
								setOpen(false);
								nav({ to: "/trash" });
							}}
							className="flex items-center gap-3 p-2"
						>
							<Trash className="size-5" />
							Trash
						</CommandItem>
						<CommandSeparator />
						<CommandItem
							onClick={handleToggleTheme}
							className="flex items-center gap-3 p-2"
						>
							<Settings className="size-5" />
							Settings
						</CommandItem>
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup>
						<CommandInput placeholder="Search records..." />
					</CommandGroup>

					{query.trim().length > 0 ? (
						<CommandGroup>
							<CommandItem
								onClick={handleSearchClick}
								className="flex items-center gap-3 p-2"
							>
								<Search className="size-5" />
								Search: "{query}"
							</CommandItem>
						</CommandGroup>
					) : (
						<CommandEmpty>Type to search records</CommandEmpty>
					)}
				</Command>
			</CommandDialog>
		</div>
	);
}
