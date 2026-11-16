import { Blobatar } from "@blobatar/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
	AlertTriangle,
	BookOpen,
	Cloud,
	CloudUpload,
	Database,
	FileUp,
	History,
	Info,
	Keyboard,
	LogIn,
	LogOut,
	type LucideIcon,
	RefreshCw,
	RotateCcw,
	Save,
	Settings2,
	ShieldCheck,
	UserRound,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import {
	type BackupStatus,
	cancelRestore,
	createBackup,
	getBackupStatus,
	prepareRestore,
	type RecordSummary,
	type RestorePreview,
	restoreBackup,
} from "#/lib/backup";
import { recordKeys } from "#/lib/features/query";
import {
	type AppPreferences,
	getPreferences,
	setPreferences,
	subscribePreferences,
} from "#/lib/preferences";
import { isTauri } from "#/lib/utils";

export const Route = createFileRoute("/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const { theme, setTheme } = useTheme();
	const { data: session, status: sessionStatus } = useSession();
	const prefs = useSyncExternalStore(
		subscribePreferences,
		getPreferences,
		getPreferences,
	);
	const [exportOpen, setExportOpen] = useState(false);
	const [restoreOpen, setRestoreOpen] = useState(false);
	const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(
		null,
	);
	const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
	const [backupStatusError, setBackupStatusError] = useState<string | null>(
		null,
	);
	const [busy, setBusy] = useState<
		"export" | "import" | "backup" | "prepare-restore" | "restore" | null
	>(null);
	const [authBusy, setAuthBusy] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (
			(theme === "system" || theme === "light" || theme === "dark") &&
			theme !== prefs.theme
		) {
			setPreferences({ theme });
		}
	}, [prefs.theme, theme]);

	useEffect(() => {
		if (!isTauri()) return;
		let active = true;
		const refreshStatus = async () => {
			try {
				const status = await getBackupStatus();
				if (active) {
					setBackupStatus(status);
					setBackupStatusError(null);
				}
			} catch (error) {
				if (active) setBackupStatusError(String(error));
			}
		};
		void refreshStatus();
		const timer = window.setInterval(() => void refreshStatus(), 30_000);
		return () => {
			active = false;
			window.clearInterval(timer);
		};
	}, []);

	const refreshBackupStatus = async () => {
		if (!isTauri()) return;
		const status = await getBackupStatus();
		setBackupStatus(status);
		setBackupStatusError(null);
	};

	const updatePref = <K extends keyof AppPreferences>(
		key: K,
		value: AppPreferences[K],
	) => {
		if (key === "theme") setTheme(value as string);
		setPreferences({ [key]: value });
	};

	const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!(email.trim() && password)) {
			toast.error("Enter both an email address and password.");
			return;
		}

		setAuthBusy(true);
		try {
			const result = await signIn("credentials", {
				email: email.trim(),
				password,
				redirect: false,
				redirectTo: "/",
			});
			if (result?.error) {
				toast.error(
					"Sign in failed. Check your credentials and internet connection.",
				);
				return;
			}
			setPassword("");
			toast.success("Signed in successfully.");
		} catch (error) {
			toast.error(`Sign in failed: ${String(error)}`);
		} finally {
			setAuthBusy(false);
		}
	};

	const handleSignOut = async () => {
		setAuthBusy(true);
		try {
			await signOut({ redirect: false });
			toast.success("Signed out.");
		} catch (error) {
			toast.error(`Sign out failed: ${String(error)}`);
		} finally {
			setAuthBusy(false);
		}
	};

	const handleExport = async () => {
		setBusy("export");
		try {
			if (isTauri()) {
				const json: string = await invoke("export_records");
				const path = await save({
					defaultPath: `datasoc-export-${new Date().toISOString().slice(0, 10)}.json`,
					filters: [{ name: "JSON", extensions: ["json"] }],
				});
				if (!path) return;
				await writeTextFile(path, json);
				toast.success("Library exported");
			} else {
				// web fallback: try API route if present, else not supported
				const res = await fetch("/api/export");
				if (!res.ok) throw new Error("Export not available in web mode");
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `datasoc-export-${new Date().toISOString().slice(0, 10)}.json`;
				a.click();
				URL.revokeObjectURL(url);
				toast.success("Library exported");
			}
		} catch (e) {
			toast.error(`Export failed: ${String(e)}`);
		} finally {
			setBusy(null);
		}
	};

	const handleImport = async () => {
		setBusy("import");
		try {
			if (isTauri()) {
				const selected = await open({
					multiple: false,
					filters: [{ name: "JSON", extensions: ["json"] }],
				});
				if (!selected || Array.isArray(selected)) return;
				const json = await readTextFile(selected);
				const count: number = await invoke("import_records", { json });
				await queryClient.invalidateQueries({ queryKey: recordKeys.all });
				toast.success(`Imported ${count} record(s)`);
				setExportOpen(false);
			} else {
				// web fallback file input handled below; this path unused
				throw new Error("Use file picker in browser");
			}
		} catch (e) {
			toast.error(`Import failed: ${String(e)}`);
		} finally {
			setBusy(null);
		}
	};

	const handleImportWeb = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setBusy("import");
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch("/api/import", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("Import failed");
			await queryClient.invalidateQueries({ queryKey: recordKeys.all });
			toast.success("Library imported");
			setExportOpen(false);
		} catch (err) {
			toast.error(`Import failed: ${String(err)}`);
		} finally {
			setBusy(null);
			e.target.value = "";
		}
	};

	const handleCloudBackup = async () => {
		setBusy("backup");
		try {
			const key = await createBackup();
			toast.success(`Backup uploaded: ${key}`);
			try {
				await refreshBackupStatus();
			} catch {
				setBackupStatusError("Could not refresh backup status.");
			}
		} catch (error) {
			toast.error(`Cloud backup failed: ${String(error)}`);
			try {
				await refreshBackupStatus();
			} catch {
				setBackupStatusError("Could not refresh backup status.");
			}
		} finally {
			setBusy(null);
		}
	};

	const handleRestorePreview = async () => {
		setBusy("prepare-restore");
		try {
			const preview = await prepareRestore();
			if (!preview) {
				toast.info("No cloud backups were found.");
				return;
			}
			setRestorePreview(preview);
			setRestoreOpen(true);
		} catch (error) {
			toast.error(`Could not prepare restore: ${String(error)}`);
		} finally {
			setBusy(null);
		}
	};

	const closeRestoreDialog = async (open: boolean) => {
		setRestoreOpen(open);
		if (!open && restorePreview && busy !== "restore") {
			setRestorePreview(null);
			try {
				await cancelRestore();
			} catch (error) {
				toast.error(`Could not cancel restore: ${String(error)}`);
			}
		}
	};

	const handleRestore = async () => {
		if (!restorePreview) return;
		setBusy("restore");
		try {
			await restoreBackup(restorePreview.backupKey);
			await queryClient.invalidateQueries({ queryKey: recordKeys.all });
			setRestorePreview(null);
			setRestoreOpen(false);
			toast.success("Database restored from the selected snapshot.");
			try {
				await refreshBackupStatus();
			} catch {
				setBackupStatusError("Could not refresh backup status.");
			}
		} catch (error) {
			toast.error(`Restore failed: ${String(error)}`);
		} finally {
			setBusy(null);
		}
	};

	const formatTimestamp = (value: string | null | undefined) => {
		if (!value) return "Not available";
		const numericValue = Number(value);
		const date = Number.isFinite(numericValue)
			? new Date(numericValue)
			: new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
	};

	const formatSnapshotTimestamp = (key: string) => {
		const timestamp = key.match(/^appdata-(\d{13})-/)?.[1];
		return timestamp ? formatTimestamp(timestamp) : key;
	};

	const renderSummary = (title: string, summary: RecordSummary) => (
		<div className="rounded-lg border bg-background p-4">
			<p className="text-sm font-medium">{title}</p>
			<p className="mt-2 text-2xl font-semibold tabular-nums">
				{summary.count}
				<span className="ml-1 text-sm font-normal text-muted-foreground">
					records
				</span>
			</p>
			<div className="mt-3 space-y-1 text-xs text-muted-foreground">
				<p className="font-medium text-foreground">
					{summary.latestRecord?.name ?? "No records"}
				</p>
				<p>
					Most recent entry:{" "}
					{formatTimestamp(
						summary.latestRecord?.createdAt ?? summary.latestRecord?.updatedAt,
					)}
				</p>
			</div>
		</div>
	);

	return (
		<div className="h-full overflow-y-auto bg-background">
			<div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

				<div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)]">
					<nav
						aria-label="Settings sections"
						className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-6 lg:mx-0 lg:h-fit lg:border-0 lg:bg-transparent lg:p-0"
					>
						<div className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
							{settingsNavigation.map(({ id, label, icon: Icon }) => (
								<a
									key={id}
									href={`#${id}`}
									className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									<Icon className="size-4" />
									{label}
								</a>
							))}
						</div>
					</nav>

					<main className="min-w-0 space-y-8 pb-12">
						<SettingsSection
							id="account"
							title="Account"
							description="Manage your Datasoc sign-in."
							icon={UserRound}
						>
							<div className="space-y-5 p-5">
								<div className="flex flex-wrap items-center gap-4">
									<Blobatar
										name={session?.user?.email ?? "Datasoc"}
										className="size-12 rounded-full object-cover"
									/>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{sessionStatus === "loading"
												? "Checking account..."
												: (session?.user?.email ?? "No account signed in")}
										</p>
										<p className="text-xs text-muted-foreground">
											{session?.user
												? (session.user.role ?? "Account")
												: "Sign in or create an account to sync your account access."}
										</p>
									</div>
									{session?.user && (
										<Button
											variant="outline"
											onClick={() => void handleSignOut()}
											disabled={authBusy}
											className="gap-2"
										>
											{authBusy ? (
												<RefreshCw className="size-4 animate-spin" />
											) : (
												<LogOut className="size-4" />
											)}
											{authBusy ? "Signing out..." : "Sign out"}
										</Button>
									)}
								</div>

								{!session?.user && sessionStatus !== "loading" && (
									<form onSubmit={handleSignIn} className="space-y-4">
										<div className="grid gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="settings-email">Email</Label>
												<Input
													autoComplete="email"
													id="settings-email"
													type="email"
													value={email}
													onChange={(event) => setEmail(event.target.value)}
													placeholder="name@example.com"
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="settings-password">Password</Label>
												<Input
													autoComplete="current-password"
													id="settings-password"
													type="password"
													value={password}
													onChange={(event) => setPassword(event.target.value)}
													placeholder="Enter your password"
													required
												/>
											</div>
										</div>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<p className="text-xs text-muted-foreground">
												Use an existing account or create one with these
												credentials.
											</p>
											<Button
												type="submit"
												disabled={authBusy}
												className="gap-2"
											>
												{authBusy ? (
													<RefreshCw className="size-4 animate-spin" />
												) : (
													<LogIn className="size-4" />
												)}
												{authBusy
													? "Signing in..."
													: "Sign in / create account"}
											</Button>
										</div>
									</form>
								)}
							</div>
						</SettingsSection>

						<SettingsSection
							id="appearance"
							title="Appearance"
							description="Adjust the look and density of Datasoc."
							icon={Settings2}
						>
							<div className="divide-y divide-border">
								<SettingsRow
									title="Theme"
									description="Follow your system setting or choose a fixed theme."
								>
									<Select
										value={prefs.theme}
										onValueChange={(value) =>
											updatePref("theme", value as AppPreferences["theme"])
										}
									>
										<SelectTrigger className="w-full sm:w-52">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Theme mode</SelectLabel>
												<SelectItem value="system">System</SelectItem>
												<SelectItem value="light">Light</SelectItem>
												<SelectItem value="dark">Dark</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</SettingsRow>
								<SettingsRow
									title="Card density"
									description="Choose how much information fits in your library."
								>
									<Select
										value={prefs.density}
										onValueChange={(value) =>
											updatePref("density", value as AppPreferences["density"])
										}
									>
										<SelectTrigger className="w-full sm:w-52">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Density</SelectLabel>
												<SelectItem value="comfortable">Comfortable</SelectItem>
												<SelectItem value="compact">Compact</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</SettingsRow>
							</div>
						</SettingsSection>

						<SettingsSection
							id="library"
							title="Library"
							description="Set your default browsing and document display options."
							icon={BookOpen}
						>
							<div className="divide-y divide-border">
								<SettingsRow
									title="Default library view"
									description="Choose whether the library opens as a list or grid."
								>
									<Select
										value={prefs.defaultView}
										onValueChange={(value) =>
											updatePref(
												"defaultView",
												value as AppPreferences["defaultView"],
											)
										}
									>
										<SelectTrigger className="w-full sm:w-52">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Default view</SelectLabel>
												<SelectItem value="list">List</SelectItem>
												<SelectItem value="grid">Grid</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</SettingsRow>
								<SettingsRow
									title="PDF cover thumbnails"
									description="Show a subtle first-page preview on PDF cards."
									last
								>
									<Switch
										checked={prefs.showPdfCovers}
										onCheckedChange={(checked) =>
											updatePref("showPdfCovers", checked)
										}
										aria-label="Show PDF cover thumbnails"
									/>
								</SettingsRow>
							</div>
						</SettingsSection>

						<SettingsSection
							id="backups"
							title="Backups & restore"
							description="Back up to a remote server"
							icon={Cloud}
						>
							<div className="space-y-5 p-5">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium">Cloud status</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Changes upload after five quiet minutes; failed attempts
										</p>
									</div>
									<div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
										<span
											className={`size-2 rounded-full ${!isTauri() || !backupStatus ? "bg-muted-foreground" : backupStatus.lastError ? "bg-destructive" : backupStatus.pendingBackup ? "bg-amber-500" : backupStatus.configured ? "bg-emerald-500" : "bg-muted-foreground"}`}
										/>
										{!isTauri()
											? "Desktop app only"
											: !backupStatus
												? "Checking..."
												: backupStatus.lastError
													? "Needs attention"
													: backupStatus.pendingBackup
														? "Changes pending"
														: backupStatus.configured
															? "Ready"
															: "Not configured"}
									</div>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-lg bg-muted/40 p-3">
										<p className="text-xs text-muted-foreground">
											Last successful backup
										</p>
										<p className="mt-1 text-sm font-medium">
											{backupStatus?.lastBackupAt
												? formatTimestamp(backupStatus.lastBackupAt)
												: "No snapshot yet"}
										</p>
									</div>

								</div>

								{backupStatus?.lastError && (
									<output className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
										<AlertTriangle className="mt-0.5 size-4 shrink-0" />
										<span>{backupStatus.lastError}</span>
									</output>
								)}
								{backupStatusError && (
									<output className="block rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
										Backup status unavailable: {backupStatusError}
									</output>
								)}
								{isTauri() && backupStatus && !backupStatus.configured && (
									<p className="text-xs text-muted-foreground">
										There was an error configuring the backup, please contact the admin
									</p>
								)}
								{!isTauri() && (
									<p className="text-xs text-muted-foreground">
										Cloud database backups are available in the desktop app.
									</p>
								)}

								<div className="flex flex-wrap gap-2">
									<Button
										onClick={handleCloudBackup}
										disabled={!isTauri() || busy !== null}
										className="gap-2"
									>
										{busy === "backup" ? (
											<RefreshCw className="size-4 animate-spin" />
										) : (
											<CloudUpload className="size-4" />
										)}
										{busy === "backup"
											? "Uploading snapshot..."
											: "Back up now"}
									</Button>
									<Button
										onClick={handleRestorePreview}
										disabled={!isTauri() || busy !== null}
										variant="outline"
										className="gap-2"
									>
										{busy === "prepare-restore" ? (
											<RefreshCw className="size-4 animate-spin" />
										) : (
											<History className="size-4" />
										)}
										{busy === "prepare-restore"
											? "Checking recent backups..."
											: "Restore from cloud"}
									</Button>
								</div>

								{(busy === "backup" || busy === "prepare-restore") && (
									<output
										aria-live="polite"
										className="block text-sm text-muted-foreground"
									>
										{busy === "backup"
											? "Creating a consistent database snapshot and uploading it to B2..."
											: "Listing backups and downloading the latest snapshot for comparison..."}
									</output>
								)}
							</div>
						</SettingsSection>

						<SettingsSection
							id="data"
							title="Data"
							description="Move a portable copy of your library in or out (Local backup)"
							icon={Database}
						>
							<div className="divide-y divide-border">
								<SettingsRow
									title="Export library"
									description="Download all records, including PDF content, as JSON."
								>
									<Button
										onClick={handleExport}
										disabled={busy !== null}
										variant="outline"
										className="w-full gap-2 sm:w-auto"
									>
										{busy === "export" ? (
											<RefreshCw className="size-4 animate-spin" />
										) : (
											<Save className="size-4" />
										)}
										{busy === "export" ? "Exporting..." : "Export JSON"}
									</Button>
								</SettingsRow>
								<SettingsRow
									title="Import JSON export"
									description="Add records from a Datasoc export; existing records are kept."
									last
								>
									<Button
										onClick={() =>
											isTauri() ? handleImport() : setExportOpen(true)
										}
										disabled={busy !== null}
										variant="outline"
										className="w-full gap-2 sm:w-auto"
									>
										{busy === "import" ? (
											<RefreshCw className="size-4 animate-spin" />
										) : (
											<FileUp className="size-4" />
										)}
										{busy === "import" ? "Importing..." : "Choose JSON"}
									</Button>
								</SettingsRow>
							</div>
						</SettingsSection>

						<SettingsSection
							id="shortcuts"
							title="Keyboard shortcuts"
							description="Quick ways to move around Datasoc."
							icon={Keyboard}
						>
							<div className="grid gap-3 p-5 sm:grid-cols-2">
								<Shortcut keys="⌘K / Ctrl+K" description="Open search" />
								<Shortcut keys="⌘B / Ctrl+B" description="Toggle sidebar" />
								<Shortcut keys="J / K" description="Next / previous PDF page" />
								<Shortcut
									keys="Home / End"
									description="First / last PDF page"
								/>
							</div>
						</SettingsSection>
					</main>
				</div>
			</div>

			<Dialog open={exportOpen} onOpenChange={setExportOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import JSON export</DialogTitle>
						<DialogDescription>
							Select a previously exported Datasoc JSON file.
						</DialogDescription>
					</DialogHeader>
					<input
						type="file"
						accept=".json,application/json"
						onChange={handleImportWeb}
						disabled={busy !== null}
						className="block w-full text-sm text-muted-foreground"
					/>
					<DialogFooter>
						<Button onClick={() => setExportOpen(false)} variant="outline">
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={restoreOpen}
				onOpenChange={(open) => void closeRestoreDialog(open)}
			>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Review database restore</DialogTitle>
						<DialogDescription>
							This snapshot will replace the database currently on this device.
							Review the record counts and most recent entries before
							continuing.
						</DialogDescription>
					</DialogHeader>
					{restorePreview && (
						<div className="space-y-4">
							<div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
								Snapshot from{" "}
								{formatSnapshotTimestamp(restorePreview.backupKey)}
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								{renderSummary("This device", restorePreview.local)}
								{renderSummary("Backblaze snapshot", restorePreview.backup)}
							</div>
							{restorePreview.local.count !== restorePreview.backup.count && (
								<p className="text-sm text-muted-foreground">
									The snapshot has{" "}
									{Math.abs(
										restorePreview.backup.count - restorePreview.local.count,
									)}{" "}
									{restorePreview.backup.count > restorePreview.local.count
										? "more"
										: "fewer"}{" "}
									record(s) than this device.
								</p>
							)}
							<p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
								<AlertTriangle className="mt-0.5 size-4 shrink-0" />
								Restoring is destructive: local records created after this
								snapshot will be replaced.
							</p>
						</div>
					)}
					<DialogFooter>
						<Button
							onClick={() => void closeRestoreDialog(false)}
							variant="outline"
							disabled={busy === "restore"}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRestore}
							disabled={!restorePreview || busy === "restore"}
							variant="destructive"
							className="gap-2"
						>
							{busy === "restore" ? (
								<RefreshCw className="size-4 animate-spin" />
							) : (
								<RotateCcw className="size-4" />
							)}
							{busy === "restore" ? "Restoring..." : "Replace local database"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

const settingsNavigation = [
	{ id: "account", label: "Account", icon: UserRound },
	{ id: "appearance", label: "Appearance", icon: Settings2 },
	{ id: "library", label: "Library", icon: BookOpen },
	{ id: "backups", label: "Backups & restore", icon: Cloud },
	{ id: "data", label: "Data", icon: Database },
	{ id: "shortcuts", label: "Shortcuts", icon: Keyboard },
];

function SettingsSection({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<section id={id} className="scroll-mt-6">
			<div className="mb-3 flex items-start gap-3">
				<div>
					<h2 className="text-base font-semibold">{title}</h2>
				</div>
			</div>
			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				{children}
			</div>
		</section>
	);
}

function SettingsRow({
	title,
	description,
	children,
	last = false,
}: {
	title: string;
	description: string;
	children: ReactNode;
	last?: boolean;
}) {
	return (
		<div
			className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${last ? "" : "border-b border-border"}`}
		>
			<div className="min-w-0">
				<p className="text-sm font-medium">{title}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
			</div>
			<div className="flex w-full shrink-0 items-center sm:w-auto sm:justify-end">
				{children}
			</div>
		</div>
	);
}

function Shortcut({
	keys,
	description,
}: {
	keys: string;
	description: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
			<span className="text-sm text-muted-foreground">{description}</span>
			<kbd className="shrink-0 rounded-md border border-input bg-muted px-2 py-1 font-mono text-xs text-foreground">
				{keys}
			</kbd>
		</div>
	);
}
