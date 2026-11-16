import { cn } from "cn";
import type { ReactNode } from "react";
import { Card } from "./ui/card";

const tones = {
	primary: "text-primary bg-primary/10 border-primary/20",
	amber:
		"text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/20",
	emerald:
		"text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
	rose: "text-rose-600 dark:text-rose-300 bg-rose-500/10 border-rose-500/20",
} as const;

export default function HomeInfoCard({
	icon,
	value,
	type,
	tone = "primary",
}: {
	icon: ReactNode;
	value: string;
	type: string;
	tone?: keyof typeof tones;
}) {
	return (
		<Card className="group relative overflow-hidden rounded-2xl border bg-card/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
			<div className="flex items-start justify-between gap-3">
				<div
					className={cn(
						"flex size-10 items-center justify-center rounded-xl border",
						tones[tone],
					)}
				>
					{icon}
				</div>
			</div>
			<div className="mt-5 space-y-0.5">
				<p className="text-3xl font-semibold tracking-tight">{value}</p>
				<p className="text-sm text-muted-foreground">{type}</p>
			</div>
			<div className="pointer-events-none absolute -right-6 -bottom-6 size-20 rounded-full bg-foreground/[0.03] transition-transform duration-300 group-hover:scale-125" />
		</Card>
	);
}
