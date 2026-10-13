"use client";

import { useState, type ReactNode } from "react";
import { Blobatar } from "@blobatar/react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
	FieldLegend,
	FieldSet,
	FieldDescription,
	FieldGroup,
} from "./ui/field";
import { useTheme } from "next-themes";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
export default function SettingsCard({ Trigger }: { Trigger: ReactNode }) {
	return (
		<Dialog>
			<DialogTrigger asChild>{Trigger}</DialogTrigger>
			<DialogContent
				className="w-xl rounded-2xl bg-background"
				showCloseButton={false}
			>
				<SettingsPage />
			</DialogContent>
		</Dialog>
	);
}

function SettingsPage() {
	return (
		<div className="flex flex-col gap-8">
			<ProfileCard />

			<FieldSet>
				<FieldLegend>General</FieldLegend>
				<FieldDescription>General app settings and feel</FieldDescription>

				<FieldGroup>
					<div className="flex justify-between items-center">
						<p className="text-lg">Theme</p>
						<ThemeSelect />
					</div>
				</FieldGroup>

				<FieldGroup></FieldGroup>
			</FieldSet>
		</div>
	);
}

function ProfileCard() {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="w-full">
				<div className="flex items-center bg-card rounded-sm justify-between px-2">
					<span className="flex items-center">
						<Blobatar
							name={"sdfssdfs"}
							animate="hover"
							className={"size-20 rounded-full"}
						/>
						<div className="text-start">
							<p className="text-md">basedcatx@gmail.com</p>
							<p className="text-muted-foreground">admin</p>
						</div>
					</span>
					{open ? (
						<ChevronDown className="stroke-muted-foreground size-4" />
					) : (
						<ChevronRight className="stroke-muted-foreground size-4" />
					)}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className="radix-collapsibleContent w-full"></CollapsibleContent>
		</Collapsible>
	);
}

function ThemeSelect() {
	const { setTheme } = useTheme();

	const items = [
		{ label: "System", value: "system" },
		{ label: "Light mode", value: "light" },
		{ label: "Dark mode", value: "dark" },
	];

	return (
		<Select
			items={items}
			defaultValue={items[0].value}
			onValueChange={(v: string) => setTheme(v)}
		>
			<SelectTrigger className="w-full max-w-48">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Theme mode</SelectLabel>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
