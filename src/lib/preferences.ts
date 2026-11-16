export type AppPreferences = {
	theme: "system" | "light" | "dark";
	density: "comfortable" | "compact";
	defaultView: "list" | "grid";
	showPdfCovers: boolean;
};

export const PREFS_KEY = "datasoc.preferences";

export const defaultPreferences: AppPreferences = {
	theme: "system",
	density: "comfortable",
	defaultView: "list",
	showPdfCovers: true,
};

let cachedRaw: string | null | undefined;
let cachedPrefs: AppPreferences = defaultPreferences;

export function getPreferences(): AppPreferences {
	if (typeof window === "undefined") return defaultPreferences;
	try {
		const raw = localStorage.getItem(PREFS_KEY);
		if (raw === cachedRaw) return cachedPrefs;
		cachedRaw = raw;
		if (!raw) {
			cachedPrefs = defaultPreferences;
			return cachedPrefs;
		}
		const parsed = JSON.parse(raw) as Partial<AppPreferences>;
		cachedPrefs = { ...defaultPreferences, ...parsed };
		return cachedPrefs;
	} catch {
		return cachedPrefs ?? defaultPreferences;
	}
}

export function setPreferences(patch: Partial<AppPreferences>): AppPreferences {
	const next = { ...getPreferences(), ...patch };
	if (typeof window !== "undefined") {
		try {
			const raw = JSON.stringify(next);
			localStorage.setItem(PREFS_KEY, raw);
			cachedRaw = raw;
			cachedPrefs = next;
			window.dispatchEvent(new Event("datasoc:preferences"));
		} catch {
			// ignore
		}
	}
	return next;
}

export function subscribePreferences(cb: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	const handler = () => cb();
	window.addEventListener("datasoc:preferences", handler);
	window.addEventListener("storage", handler);
	return () => {
		window.removeEventListener("datasoc:preferences", handler);
		window.removeEventListener("storage", handler);
	};
}
