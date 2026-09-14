export function StorageManager() {
	if (window.__TAURI__) {
		console.log("Tauri");
	} else {
		console.log("Tanstack");
	}
}
