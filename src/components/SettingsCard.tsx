import { Blobatar } from "@blobatar/react";
import { ChevronDown, ChevronRight, CloudSync, RotateCcw } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "./ui/field";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Spinner } from "./ui/spinner";
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
						<p className="text-sm">Theme</p>
						<ThemeSelect />
					</div>
				</FieldGroup>

				<FieldGroup className="w-full">
					<FieldDescription>Backup & Restore </FieldDescription>
					<BackupRestoreComponent />
				</FieldGroup>
			</FieldSet>
		</div>
	);
}

function ProfileCard() {
	const [open, setOpen] = useState(false);
	const { data: session } = useSession();
	const [isPending, startTransition] = useTransition();

	const handleAuthenticate = async (email: string, password: string) => {
		if (!(email && password)) return;

		startTransition(async () => {
			const res = await signIn("credentials", {
				email,
				password,
				redirect: false,
				redirectTo: "/",
			});

			if (res.error) {
				toast.error(
					"Invalid email or password. Ensure you have a working internet connection",
				);
			}
		});
	};

	const handleSignOut = async (e: MouseEvent) => {
		e.preventDefault();
		await signOut();
	};

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="w-full">
				<div className="flex items-center rounded-sm justify-between px-2 focus-within:bg-input/70 hover:bg-input/10 cursor-pointer">
					<span className="flex items-center gap-4 p-4">
						<div className="rounded-full p-1">
							<Blobatar
								name={session ? (session.user?.email as string) : "none"}
								animate="always"
								className={"size-15 object-cover"}
							/>
						</div>
						<div className="text-start">
							<p className="text-md">
								{session ? (session.user?.email as string) : "No login found"}
							</p>
							<p className="text-muted-foreground">
								{session ? (session.user?.role ?? "unknown") : "Please login"}
							</p>
						</div>
					</span>
					{open ? (
						<ChevronDown className="stroke-muted-foreground size-4" />
					) : (
						<ChevronRight className="stroke-muted-foreground size-4" />
					)}
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className="radix-collapsibleContent w-full py-2 px-1">
				{session?.user ? (
					<Button
						variant={"destructive"}
						onClick={(e) => handleSignOut(e as unknown as MouseEvent)}
						className="w-full p-4"
					>
						Sign out
					</Button>
				) : (
					<form
						onSubmit={async (e) => {
							e.preventDefault();
							const formData = new FormData(e.target);
							const email = formData.get("email")?.toString() ?? "";
							const password = formData.get("password")?.toString() ?? "";
							await handleAuthenticate(email, password);
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>

								<Input
									className="p-2"
									id="fieldgroup-email"
									type="email"
									name="email"
									placeholder="name@example.com"
								/>

								<FieldDescription>
									Enter your email address to create an account
								</FieldDescription>
							</Field>

							<Field>
								<FieldLabel htmlFor="fieldgroup-password">Password</FieldLabel>
								<Input
									className="p-2"
									id="fieldgroup-password"
									type="password"
									name="password"
									placeholder="********"
								/>

								<FieldDescription>
									Enter your password. Would automatically log in if your
									password is correct and an account exists
								</FieldDescription>
							</Field>

							<Field orientation={"horizontal"}>
								<Button type="reset" variant={"secondary"}>
									Reset
								</Button>
								<Button type="submit">Create an account / sign in</Button>
								{isPending && <Spinner />}
							</Field>
						</FieldGroup>
					</form>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}

function BackupRestoreComponent(role: "admin" | "user") {
	return (
		<div className="w-full flex gap-3">
			<Button variant={"outline"} className="flex-1">
				<RotateCcw />
				Restore
			</Button>
			<Button className="flex-1" disabled={role !== "admin"}>
				<CloudSync />
				Backup
			</Button>
		</div>
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
