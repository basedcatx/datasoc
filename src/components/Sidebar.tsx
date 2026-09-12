import {
	File,
	Home,
	Library,
	LucidePencilLine,
	LucideSearch,
	LucideSettings,
	PanelLeft,
	Trash,
} from "lucide-react";
import { useState } from "react";
import NavButton from "./nav-button";
import NavSection from "./nav-section";
import { Button } from "./ui/button";

const navLinks = [
	{ text: "Home", path: "/home", icon: Home },
	{ text: "Library", path: "/library", icon: Library },
	{ text: "Trash", path: "/trash", icon: Trash },
];

export default function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDrawer = () => {
		setIsOpen(!isOpen);
	};

	return isOpen ? (
		<nav className="w-100 flex flex-col p-4 border-r gap-10 min-h-screen h-full">
			<div className="flex justify-end">
				<Button variant={"ghost"} onClick={toggleDrawer}>
					<PanelLeft className="size-6" />
				</Button>
			</div>

			<div className="flex justify-between">
				<ul className="flex gap-2">
					{navLinks.map((l) => (
						<li key={l.path}>
							<NavButton icon={l.icon} navText={l.text} path={l.path} />
						</li>
					))}
				</ul>
				<NavButton navText="Search" icon={LucideSearch} onClick={() => {}} />
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

			<NavSection
				sectionName="Misc"
				icon={Trash}
				items={[{ name: "Recently deleted", action: () => {} }]}
			/>

			<div className="flex justify-around items-center p-4">
				<Button variant={"secondary"} size={"lg"} className="p-4 rounded-full">
					<LucideSettings />
					<p>Settings</p>
				</Button>
				<Button size={"lg"} className="p-4 rounded-full">
					<LucidePencilLine />
					<p>New</p>
				</Button>
			</div>
		</nav>
	) : (
		<div className="p-4">
			<Button variant={"ghost"} onClick={toggleDrawer}>
				<PanelLeft className="size-6" />
			</Button>
		</div>
	);
}
