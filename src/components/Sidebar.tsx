import {
	File,
	Home,
	Library,
	LucidePencilLine,
	LucideSearch,
	LucideSettings,
	PanelLeft,
	Plus,
	Search,
	Trash,
} from "lucide-react";
import NavButton from "./nav-button";
import NavSection from "./nav-section";
import { Button } from "./ui/button";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import SearchComponent from "./SearchComponent";
import { useQuery } from "@tanstack/react-query";
import { recordQueries } from "#/lib/features/query";
import type { R } from "#/lib/libs";
import { Skeleton } from "./ui/skeleton";
import { createFlags, FLAGS } from "../lib/utils";
import type React from "react";
import { useState } from "react";
import { usePresence } from "#/hooks/use-presence";
import SettingsCard from "./SettingsCard";

const navLinks = [
	{ text: "Home", path: "/", icon: Home },
	{ text: "Library", path: "/library", icon: Library },
	{ text: "Trash", path: "/trash", icon: Trash },
];

function SidebarComponent({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(true);

	const { ref, state, mounted } = usePresence(isOpen);
	if (location.pathname === "/splashscreen") return null;

	return (
		<nav
			data-state={state}
			ref={ref}
			className={cn(
				"bg-card w-100 overflow-y-auto scrollbar-thin scrollbar-thumb-primary shrink-0 flex flex-col p-4 border-r gap-10 h-screen sidebar",
				!isOpen && "p-3 flex flex-col gap-12 h-screen w-20",
			)}
		>
			{mounted ? (
				<>
					<div className="flex justify-end sticky top-0">
						<Button
							variant={"ghost"}
							onClick={() => setIsOpen(!isOpen)}
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
					{isOpen && children}
					{isOpen && (
						<div className="flex justify-around items-center p-4">
							<SettingsCard
								Trigger={
									<Button
										variant={"outline"}
										size={"lg"}
										className="p-4 rounded-full"
									>
										<LucideSettings />
										<p>Settings</p>
									</Button>
								}
							/>
							<Button size={"lg"} asChild className="p-4 rounded-full">
								<Link to="/editor">
									<LucidePencilLine />
									<p>New</p>
								</Link>
							</Button>
						</div>
					)}
				</>
			) : (
				<div className="flex justify-between flex-col h-full items-center">
					<div className="flex flex-col gap-10">
						<Button variant={"ghost"} onClick={() => setIsOpen(!isOpen)}>
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
												"bg-secondary-foreground/5 p-2",
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
					<SettingsCard
						Trigger={
							<Button variant={"outline"} className="rounded-full">
								<LucideSettings className="size-6" />
							</Button>
						}
					/>
				</div>
			)}
		</nav>
	);
}

export default function Sidebar() {
	const { data } = useQuery(recordQueries.all());
	const navigate = useNavigate();
	if (!data) {
		return (
			<SidebarComponent>
				<Skeleton className="w-full h-3 rounded-xl p-4" />
				<Skeleton className="w-full h-3 rounded-xl p-4" />
				<Skeleton className="w-full h-3 rounded-xl p-4" />
			</SidebarComponent>
		);
	}

	const handleNavigateAction = (id?: number) => {
		if (id) return navigate({ to: `/view/${id}` });
	};

	const recent = [...(data as R[])]
		.sort(
			(a, b) =>
				new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
		)
		.slice(0, 3);

	const starred = [...(data as R[])]
		.sort(
			(a, b) =>
				new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime(),
		)
		.filter((r) => createFlags(r.flags).check(FLAGS.IS_FAVORITE))
		.slice(0, 3);

	return (
		<SidebarComponent>
			{recent.length > 0 && (
				<NavSection
					sectionName="Recent"
					icon={File}
					items={{ data: recent, action: handleNavigateAction }}
				/>
			)}

			{starred.length > 0 && (
				<NavSection
					sectionName="Starred"
					icon={File}
					items={{ data: starred, action: handleNavigateAction }}
				/>
			)}
		</SidebarComponent>
	);
}
