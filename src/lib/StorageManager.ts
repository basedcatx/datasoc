import { isTauri } from "./utils";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";

export async function StorageManager() {
	if (isTauri()) {
		const database = await readDir("./", {
			baseDir: BaseDirectory.AppLocalData,
		});

		const Database = await import("better-sqlite3");
		console.log(Database);
	}
}
