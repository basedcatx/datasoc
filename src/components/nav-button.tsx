import { cn } from "cn";
import { Button } from "./ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

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
				"flex gap-3 rounded-full p-4",
				isActive && "bg-primary w-30",
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
