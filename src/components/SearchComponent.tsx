import { Card } from "./ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "./ui/field";
import { ButtonGroup } from "./tiptap-ui-primitive/button-group";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import { FileTextIcon, FolderIcon, InboxIcon } from "lucide-react";

import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@/components/ui/command";
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Textarea } from "./ui/textarea";

export default function SearchComponent({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	return (
		<div className="flex flex-col gap-4">
			<Button onClick={() => setOpen(true)} asChild>
				{children}
			</Button>
			<CommandDialog
				open={open}
				onOpenChange={(open) => {
					setOpen(open);
					setQuery("");
				}}
				className="w-full"
			>
				<Command>
					<form className="flex flex-col gap-2 p-1">
						<div className="flex gap-3">
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
								asChild
								className="my-auto"
								onClick={() => {
									if (query.length > 0) {
										setOpen(false);
									}
								}}
							>
								<Link
									to={"/search/$query"}
									params={{ query }}
									disabled={query === undefined}
								>
									Search
								</Link>
							</Button>
						</div>
						<Link
							to={"/search/$query"}
							params={{ query }}
							className="w-full align-left flex items-center gap-3 p-1 rounded-sm hover:bg-input"
						>
							<InboxIcon className="size-5" />
							<p>All records</p>
						</Link>
						<Link
							to={"/search/$query"}
							params={{ query }}
							search={{ page: "completed" }}
							className="w-full align-left flex items-center gap-3 p-1 rounded-sm hover:bg-input"
						>
							<InboxIcon className="size-5" />
							<p>Completed</p>
						</Link>
						<Link
							to={"/search/$query"}
							params={{ query }}
							search={{ page: "draft" }}
							className="w-full align-left flex items-center gap-3 p-1 rounded-sm hover:bg-input"
						>
							<InboxIcon className="size-5" />
							<p>Draft</p>
						</Link>
					</form>
				</Command>
			</CommandDialog>
		</div>
	);
}
