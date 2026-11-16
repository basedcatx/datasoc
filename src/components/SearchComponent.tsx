import { useNavigate } from "@tanstack/react-router";
import {
	FileText,
	InboxIcon,
	Library,
	Moon,
	Search,
	Sun,
	Trash,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Slot } from "radix-ui";
import { type ReactNode, useEffect, useState } from "react";
import { openPdfUpload } from "#/lib/pdf";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

export default function SearchComponent({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const nav = useNavigate();
	const { resolvedTheme, setTheme } = useTheme();

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((o) => !o);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const run = (fn: () => void) => {
		setOpen(false);
		setQuery("");
		fn();
	};

	const handleUploadPdf = () => {
		run(() => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "application/pdf,.pdf";
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;
				const bytes = new Uint8Array(await file.arrayBuffer());
				const { isPdfBuffer } = await import("#/lib/pdf");
				if (!isPdfBuffer(bytes)) return;
				openPdfUpload({ fileName: file.name, bytes });
			};
			input.click();
		});
	};

	return (
		<>
			<Slot.Root onClick={() => setOpen(true)}>{children}</Slot.Root>

			<CommandDialog
				open={open}
				onOpenChange={(v) => {
					setOpen(v);
					if (!v) setQuery("");
				}}
			>
				<Command>
					<CommandInput
						placeholder="Search or jump to..."
						value={query}
						onValueChange={setQuery}
					/>
					<CommandList className="max-h-85 p-1">
						<CommandEmpty>No results.</CommandEmpty>

						{query.trim().length > 0 && (
							<CommandGroup heading="Search">
								<CommandItem
									className="data-[selected=true]:bg-input"
									onSelect={() =>
										run(() =>
											nav({
												to: "/search",
												search: { query: query.trim(), page: "all" },
											}),
										)
									}
								>
									<Search className="size-4" />
									Search for “{query.trim()}”
								</CommandItem>
							</CommandGroup>
						)}

						<CommandGroup heading="Create">
							<CommandItem
								className="data-[selected=true]:bg-input"
								onSelect={() => run(() => nav({ to: "/editor" }))}
							>
								<FileText className="size-4" />
								New document
							</CommandItem>
							<CommandItem
								className="data-[selected=true]:bg-input"
								onSelect={handleUploadPdf}
							>
								<Library className="size-4" />
								Upload PDF
							</CommandItem>
						</CommandGroup>

						<CommandSeparator />

						<CommandGroup heading="Go to">
							<CommandItem
								className="data-[selected=true]:bg-input"
								onSelect={() => run(() => nav({ to: "/library" }))}
							>
								<InboxIcon className="size-4" />
								Library
							</CommandItem>
							<CommandItem
								className="data-[selected=true]:bg-input"
								onSelect={() => run(() => nav({ to: "/trash" }))}
							>
								<Trash className="size-4" />
								Trash
							</CommandItem>
						</CommandGroup>

						<CommandSeparator />

						<CommandGroup heading="Preferences">
							<CommandItem
								className="data-[selected=true]:bg-input"
								onSelect={() =>
									run(() =>
										setTheme(resolvedTheme === "dark" ? "light" : "dark"),
									)
								}
							>
								{resolvedTheme === "dark" ? (
									<Sun className="size-4" />
								) : (
									<Moon className="size-4" />
								)}
								Toggle theme
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
