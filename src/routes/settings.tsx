import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
	AlertTriangle,
	BarChart3,
	BookOpen,
	Cloud,
	Database,
	Keyboard,
	Save,
	Settings as SettingsIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
import { Separator } from "#/components/ui/separator";
import { recordKeys } from "#/lib/features/query";
import {
	type AppPreferences,
	getPreferences,
	setPreferences,
} from "#/lib/preferences";
import { isTauri } from "#/lib/utils";

export const Route = createFileRoute("/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const { theme, setTheme } = useTheme();
	const [prefs, setPrefsState] = useState<AppPreferences>(getPreferences);
	const [exportOpen, setExportOpen] = useState(false);
	const [busy, setBusy] = useState<"export" | "import" | null>(null);

	// Ensure next-themes stays in sync with stored preference on mount
	useEffect(() => {
		if (theme !== prefs.theme) setTheme(prefs.theme);
	}, [prefs.theme, setTheme, theme]);

	const updatePref = <K extends keyof AppPreferences>(
		key: K,
		value: AppPreferences[K],
	) => {
		const next = setPreferences({ [key]: value });
		setPrefsState(next);
		if (key === "theme") setTheme(value as string);
		toast.success("Settings saved");
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

	return (
		<div className="flex flex-col h-full overflow-y-auto p-8 bg-background">
			<div className="flex flex-col gap-8 max-w-2xl mx-auto">
				<div className="flex items-center gap-4">
					<SettingsIcon className="size-6 text-primary" />
					<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				</div>

				<Separator />

				{/* Appearance */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<BarChart3 className="size-5" /> Appearance
					</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-lg border bg-background p-4 shadow-sm">
							<Label className="text-sm font-medium">Theme mode</Label>
							<Select
								value={prefs.theme}
								onValueChange={(v) =>
									updatePref("theme", v as AppPreferences["theme"])
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Mode</SelectLabel>
										<SelectItem value="system">System</SelectItem>
										<SelectItem value="light">Light mode</SelectItem>
										<SelectItem value="dark">Dark mode</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="rounded-lg border bg-background p-4 shadow-sm">
							<Label className="text-sm font-medium">Card density</Label>
							<Select
								value={prefs.density}
								onValueChange={(v) =>
									updatePref("density", v as AppPreferences["density"])
								}
							>
								<SelectTrigger className="w-full">
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
							<p className="text-xs text-muted-foreground mt-2">
								Applied to record cards in lists and library.
							</p>
						</div>
					</div>
				</section>

				{/* Library */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<BookOpen className="size-5" /> Library
					</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-lg border bg-background p-4 shadow-sm">
							<Label className="text-sm font-medium">Default view</Label>
							<Select
								value={prefs.defaultView}
								onValueChange={(v) =>
									updatePref("defaultView", v as AppPreferences["defaultView"])
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>View</SelectLabel>
										<SelectItem value="list">List</SelectItem>
										<SelectItem value="grid">Grid</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="rounded-lg border bg-background p-4 shadow-sm flex items-center justify-between">
							<Label className="text-sm font-medium">Show PDF covers</Label>
							<button
								type="button"
								onClick={() =>
									updatePref("showPdfCovers", !prefs.showPdfCovers)
								}
								className={`h-5 w-9 rounded-full border transition-colors ${prefs.showPdfCovers ? "bg-primary" : "bg-muted"}`}
								aria-checked={prefs.showPdfCovers}
								role="switch"
							>
								<span
									className={`block h-4 w-4 rounded-full bg-background shadow transition-transform ${prefs.showPdfCovers ? "translate-x-4" : "translate-x-0.5"}`}
								/>
							</button>
						</div>
					</div>
				</section>

				{/* Data */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Database className="size-5" /> Data
					</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<Button
							onClick={handleExport}
							disabled={busy !== null}
							className="flex items-center gap-2 w-full"
							variant="outline"
						>
							<Save className="size-5" />
							{busy === "export" ? "Exporting..." : "Export library"}
						</Button>
						<Button
							onClick={() => (isTauri() ? handleImport() : setExportOpen(true))}
							disabled={busy !== null}
							className="flex items-center gap-2 w-full"
							variant="outline"
						>
							<Cloud className="size-5" />
							{busy === "import" ? "Importing..." : "Import backup"}
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						Export downloads all records (including PDF content) as JSON. Import
						restores from a previous export and regenerates search embeddings.
						Existing records are kept.
					</p>
				</section>

				{/* About */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<AlertTriangle className="size-5" /> About
					</h2>
					<div className="rounded-lg border bg-background p-4 shadow-sm">
						<p className="text-sm font-medium">Datasoc v1.1.0-beta</p>
						<p className="text-xs text-muted-foreground">
							Personal knowledge base · PDF viewer · TipTap editor
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Built with TanStack Router, Tauri, and local SQLite. All data
							stored on-device.
						</p>
					</div>
				</section>

				{/* Keyboard shortcuts */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Keyboard className="size-5" /> Keyboard shortcuts
					</h2>
					<div className="grid gap-2 md:grid-cols-2 text-sm">
						<div className="flex items-center gap-3 rounded-lg border bg-background p-2">
							<kbd className="rounded border border-input px-1.5 font-mono text-xs">
								⌘K
							</kbd>
							<span className="text-muted-foreground">
								Open command palette
							</span>
						</div>
						<div className="flex items-center gap-3 rounded-lg border bg-background p-2">
							<kbd className="rounded border border-input px-1.5 font-mono text-xs">
								⌘B
							</kbd>
							<span className="text-muted-foreground">Toggle sidebar</span>
						</div>
						<div className="flex items-center gap-3 rounded-lg border bg-background p-2">
							<kbd className="rounded border border-input px-1.5 font-mono text-xs">
								j / k
							</kbd>
							<span className="text-muted-foreground">
								Next / previous page (PDF)
							</span>
						</div>
						<div className="flex items-center gap-3 rounded-lg border bg-background p-2">
							<kbd className="rounded border border-input px-1.5 font-mono text-xs">
								Home / End
							</kbd>
							<span className="text-muted-foreground">
								First / last page (PDF)
							</span>
						</div>
					</div>
				</section>

				<Separator className="mt-8" />
				<div className="text-xs text-muted-foreground">
					Datasoc · No telemetry.
				</div>
			</div>

			{/* Web-only import dialog fallback */}
			<Dialog open={exportOpen} onOpenChange={setExportOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import backup</DialogTitle>
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
		</div>
	);
}
