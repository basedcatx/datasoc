import type { R } from "./libs";

export const mockRecords: R[] = [
	{
		name: "Rust Ownership",
		content:
			"Ownership is Rust's memory management model. Each value has a single owner, and when the owner goes out of scope, the value is dropped. Borrowing lets you reference a value without taking ownership.",
		flags: 0,
		tags: ["rust", "memory", "borrowing"],
		meta: {
			author: "docs",
			language: "en",
			difficulty: "intermediate",
		},
		// embedding left undefined — the backend generates it
	},
	{
		name: "SQLite WAL Mode",
		content:
			"Write-Ahead Logging (WAL) allows readers and writers to proceed concurrently. It generally improves performance over the default rollback journal, at the cost of extra files on disk.",
		flags: 1,
		tags: ["sqlite", "database", "performance"],
		meta: {
			author: "sqlite.org",
			language: "en",
			difficulty: "advanced",
		},
	},
	{
		name: "Tauri IPC",
		content:
			"Tauri commands are Rust functions exposed to the frontend via invoke(). Arguments and return values are serialized with serde, so both sides must agree on the shape.",
		flags: 0,
		tags: ["tauri", "ipc", "serde"],
		meta: {
			author: "internal",
			language: "en",
		},
	},
	{
		name: "serde_json Round-Trip",
		content:
			"serde_json::from_str parses a &str into a Deserialize type. Its error type is serde_json::Error, which does not implement From for rusqlite::Error — you must convert manually.",
		flags: 2,
		tags: ["serde", "json", "rusqlite"],
		meta: {
			author: "internal",
			language: "en",
			difficulty: "advanced",
		},
	},
	{
		name: "空のテスト",
		content:
			"Unicode content to make sure nothing chokes on multi-byte characters: こんにちは、世界 🌍",
		flags: 0,
		tags: ["i18n", "unicode"],
		meta: {
			language: "ja",
			note: "emoji included on purpose",
		},
	},
];
