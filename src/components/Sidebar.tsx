import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
	Box,
	File,
	Home,
	Library,
	PanelLeft,
	Plus,
	Search,
	Settings,
	Trash,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { recordQueries } from "#/lib/features/query";
import { createFlags, FLAGS } from "../lib/utils";
import { AddRecordDialog } from "./add-record-dialog";
import NavSection from "./nav-section";
import SearchComponent from "./SearchComponent";
import SettingsCard from "./SettingsCard";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const navLinks = [
	{ text: "Home", path: "/", icon: Home },
	{ text: "Library", path: "/library", icon: Library },
	{ text: "Trash", path: "/trash", icon: Trash },
];

function NavRow({
	active,
	children,
}: {
	active?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors",
				"hover:bg-input/30 hover:text-foreground",
				active && "bg-accent text-foreground",
			)}
		>
			{children}
		</div>
	);
}

function SidebarComponent({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem("datasoc.sidebarOpen") !== "false";
	});
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		localStorage.setItem("datasoc.sidebarOpen", String(isOpen));
	}, [isOpen]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
				e.preventDefault();
				setIsOpen((prev) => !prev);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	if (location.pathname === "/splashscreen") return null;

	return (
		<nav
			className={cn(
				"flex h-screen shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar text-sidebar-foreground",
				isOpen ? "w-60 p-3" : "w-14 items-center p-2",
			)}
		>
			<div
				className={cn(
					"mb-4 flex items-center",
					isOpen ? "justify-between px-1" : "justify-center",
				)}
			>
				{isOpen && (
					<div className="flex items-center gap-2">
						<span className="text-[14px] font-medium text-foreground/90">
							Datasoc
						</span>
					</div>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsOpen(!isOpen)}
					className="size-7 text-muted-foreground hover:text-foreground"
					title="Toggle sidebar (⌘B)"
				>
					<PanelLeft className="size-4" />
				</Button>
			</div>

			{isOpen ? (
				<>
					<div className="flex flex-col gap-3">
						<SearchComponent>
							<button type="button" className="block w-full text-left">
								<NavRow>
									<span className="flex w-full items-center justify-between gap-2">
										<span className="flex items-center gap-2.5">
											<Search className="size-4 shrink-0" />
											<span>Search</span>
										</span>
										<span className="text-xs text-muted-foreground/60">⌘K</span>
									</span>
								</NavRow>
							</button>
						</SearchComponent>
						{navLinks.map((l) => {
							const active = location.pathname === l.path;
							return (
								<Link key={l.path} to={l.path} className="block">
									<NavRow active={active}>
										<l.icon className="size-4 shrink-0" />
										<span>{l.text}</span>
									</NavRow>
								</Link>
							);
						})}
					</div>

					<div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto">
						{children}
					</div>

					<div className="mt-3 flex flex-col gap-0.5 border-t border-border pt-3">
						<SettingsCard
							Trigger={
								<button type="button" className="w-full text-left">
									<NavRow>
										<Settings className="size-4 shrink-0" />
										<span>Settings</span>
									</NavRow>
								</button>
							}
						/>
						<button
							type="button"
							className="w-full text-left"
							onClick={() => setAddOpen(true)}
						>
							<NavRow>
								<Plus className="size-4 shrink-0" />
								<span>New</span>
							</NavRow>
						</button>
					</div>
				</>
			) : (
				<div className="flex h-full flex-col items-center gap-2 pt-1">
					<SearchComponent>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-muted-foreground"
							title="Search (⌘K)"
						>
							<Search className="size-4" />
						</Button>
					</SearchComponent>
					{navLinks.map((l) => {
						const active = location.pathname === l.path;
						return (
							<Button
								key={l.path}
								asChild
								variant="ghost"
								size="icon"
								className={cn(
									"size-8 text-muted-foreground hover:text-foreground",
									active && "bg-accent text-foreground",
								)}
							>
								<Link to={l.path} title={l.text}>
									<l.icon className="size-4" />
								</Link>
							</Button>
						);
					})}
					<div className="mt-auto flex flex-col items-center gap-2 pb-1">
						<SettingsCard
							Trigger={
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground"
									title="Settings"
								>
									<Settings className="size-4" />
								</Button>
							}
						/>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-muted-foreground"
							onClick={() => setAddOpen(true)}
							title="New"
						>
							<Plus className="size-4" />
						</Button>
					</div>
				</div>
			)}
			<AddRecordDialog open={addOpen} onOpenChange={setAddOpen} />
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

	const recent = [...data]
		.sort((a, b) => {
			const aTime = a.record.created_at;
			const bTime = b.record.created_at;
			if (!aTime || !bTime) return 0;
			return new Date(bTime).getTime() - new Date(aTime).getTime();
		})
		.slice(0, 3);

	const starred = [...data]
		.sort((a, b) => {
			const aTime = a.record.created_at;
			const bTime = b.record.created_at;
			if (!aTime || !bTime) return 0;
			return new Date(aTime).getTime() - new Date(bTime).getTime();
		})
		.filter((r) => createFlags(r.record.flags).check(FLAGS.IS_FAVORITE))
		.slice(0, 3);

	return (
		<SidebarComponent>
			{recent.length > 0 && (
				<NavSection
					sectionName="Recent"
					items={{ data: recent, action: handleNavigateAction }}
				/>
			)}

			{starred.length > 0 && (
				<NavSection
					sectionName="Starred"
					items={{ data: starred, action: handleNavigateAction }}
				/>
			)}
		</SidebarComponent>
	);
}
