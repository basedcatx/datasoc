import {
	File,
	Home,
	Library,
	LucideSearch,
	PanelLeft,
	Plus,
	Search,
	Trash,
} from "lucide-react";
import { useState } from "react";
import NavButton from "./nav-button";
import NavSection from "./nav-section";
import { Button } from "./ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import SearchComponent from "./SearchComponent";

const navLinks = [
	{ text: "Home", path: "/", icon: Home },
	{ text: "Library", path: "/library", icon: Library },
	{ text: "Trash", path: "/trash", icon: Trash },
];

export default function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);
	const location = useLocation();

	const toggleDrawer = () => {
		setIsOpen(!isOpen);
	};

	return isOpen ? (
		<nav className="bg-card w-100 overflow-y-auto scrollbar-thin scrollbar-thumb-primary shrink-0 flex flex-col p-4 border-r gap-10 h-screen">
			<div className="flex justify-end sticky top-0">
				<Button
					variant={"ghost"}
					onClick={toggleDrawer}
					className="backdrop-blur-xs"
				>
					<PanelLeft className="size-6" />
				</Button>
			</div>

			<div className="flex justify-between gap-4">
				<ul className="flex gap-2">
					{navLinks.map((l) => (
						<li key={l.path}>
							<NavButton icon={l.icon} navText={l.text} path={l.path} />
						</li>
					))}
				</ul>

				<SearchComponent>
					<NavButton navText="Search" icon={LucideSearch} />
				</SearchComponent>
			</div>

			<NavSection
				sectionName="Recent"
				icon={File}
				items={[
					{ name: "Water pump9", action: () => {} },
					{ name: "Water pump22", action: () => {} },
					{ name: "Water pump39", action: () => {} },
				]}
			/>

			<NavSection
				sectionName="Starred"
				icon={File}
				items={[
					{ name: "Water pump", action: () => {} },
					{ name: "Water pump2", action: () => {} },
					{ name: "Water pump3", action: () => {} },
				]}
			/>

			<NavSection
				sectionName="Draft"
				icon={File}
				items={[
					{ name: "Water pump", action: () => {} },
					{ name: "Water pump2", action: () => {} },
					{ name: "Water pump3", action: () => {} },
				]}
			/>

			{/* TODO:: Later
* <div className="flex justify-around items-center p-4">
				<Button variant={"secondary"} size={"lg"} className="p-4 rounded-full">
					<LucideSettings />
					<p>Settings</p>
				</Button>
				<Button size={"lg"} className="p-4 rounded-full">
					<LucidePencilLine />
					<p>New</p>
				</Button>

				</div>
*/}
		</nav>
	) : (
		<div className="p-1 bg-card flex flex-col gap-12">
			<Button variant={"ghost"} onClick={toggleDrawer}>
				<PanelLeft className="size-6" />
			</Button>

			<ul className="flex flex-col gap-3 items-center">
				{navLinks.map((l) => (
					<li key={l.path}>
						<Button
							asChild
							variant={"ghost"}
							className={cn(
								location.pathname === l.path &&
									"bg-secondary-foreground/5 p-2 rounded-full",
							)}
						>
							<Link to={l.path}>
								<l.icon className="size-6" />
							</Link>
						</Button>
					</li>
				))}
			</ul>

			<SearchComponent>
				<Button variant={"secondary"} className="rounded-full">
					<Search className="size-6" />
				</Button>
			</SearchComponent>

			<Button variant={"secondary"} className="rounded-full">
				<Link to="/editor">
					<Plus className="size-6" />
				</Link>
			</Button>
		</div>
	);
}
