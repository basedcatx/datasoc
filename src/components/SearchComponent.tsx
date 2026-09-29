import { Button } from "@/components/ui/button";
import { Heart, InboxIcon, Library, Trash } from "lucide-react";

import { Command, CommandDialog } from "@/components/ui/command";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Textarea } from "./ui/textarea";

export default function SearchComponent({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [page, setPage] = useState<"all" | "starred" | "deleted">("all");
	const nav = useNavigate();

	const handleSearchClick = (e: any) => {
		e.preventDefault();
		if (query.length > 0) {
			setOpen(false);
			nav({ to: "/search", search: { query, page } });
			setPage("all");
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Button onClick={() => setOpen(true)} asChild>
				{children}
			</Button>

			<CommandDialog
				open={open}
				onOpenChange={() => {
					setOpen(false);
					setQuery("");
				}}
				className="w-full"
			>
				<Command>
					<form className="flex flex-col gap-3 p-1">
						<Textarea
							placeholder="Search for any record..."
							required
							rows={1}
							className="ring-0 focus-visible:ring-0 border-0"
							onChange={(e) => {
								setQuery(e.target.value);
							}}
						/>
						<Button
							variant={"ghost"}
							className="w-full align-left items-start flex items-center justify-start gap-3 p-1 rounded-sm hover:bg-input"
							onClick={(e) => handleSearchClick(e)}
						>
							<Library className="size-5" />
							<p>All records</p>
						</Button>
						<Button
							variant={"ghost"}
							className="w-full align-left flex items-center gap-3 p-1 rounded-sm hover:bg-input justify-start "
							onClick={(e) => {
								setPage("deleted");
								handleSearchClick(e);
							}}
						>
							<Trash className="size-5" />
							<p>Trash</p>
						</Button>
						<Button
							variant={"ghost"}
							className="w-full align-left flex items-center gap-3 p-1 rounded-sm hover:bg-input justify-start "
							onClick={(e) => {
								setPage("starred");
								handleSearchClick(e);
							}}
						>
							<Heart className="size-5" />
							<p>Starred</p>
						</Button>
						<Button
							type="submit"
							className="my-auto"
							disabled={query.length < 1}
							onClick={(e) => {
								handleSearchClick(e);
							}}
						>
							Search
						</Button>
					</form>
				</Command>
			</CommandDialog>
		</div>
	);
}
