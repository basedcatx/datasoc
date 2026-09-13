import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

export default function NavButton({
	icon,
	navText,
	path,
	onClick,
}: {
	icon: LucideIcon;
	navText: string;
	path?: string;
	onClick?: () => void;
}) {
	const location = useLocation();
	const isActive = path && location.pathname === path;
	const Icon = icon;
	return (
		<Button
			onClick={onClick}
			asChild={path !== undefined}
			className={cn(
				"flex gap-3 rounded-full w-fit p-4 cursor-pointer",
				isActive && "bg-primary w-30",
				location.pathname === "/trash" &&
					path === "/trash" &&
					"bg-destructive/70 hover:bg-destructive/70 [&_svg]:stroke-primary-foreground",
			)}
			variant={isActive ? "default" : "ghost"}
		>
			{path ? (
				<Link to={path}>
					<Icon className={cn("size-6", isActive && "size-4")} />
					{isActive && <p>{navText}</p>}
				</Link>
			) : (
				<Icon className={cn("size-6", isActive && "size-4")} />
			)}
		</Button>
	);
}
