import { invoke } from "@tauri-apps/api/core";

export const FLAGS = {
	IS_DELETED: 1 << 1,
	IS_FAVORITE: 1 << 2,
};

interface R {
	name: string;
	content: string;
	flags: number;
	tags: string[];
	meta: Record<string, string>;
	embedding: [];
}

export async function generateVector(text: string) {
	try {
		const vector: number[] = await invoke("get_embedding", { input: text });
		return vector;
	} catch (e) {
		console.error("Embedding generation error", e);
		return [];
	}
}

export async function generateContentEmbedding(name: string, content: string) {
	return await generateVector(`${name}\n${content}`);
}

export async function createRecord(input: R) {
	try {
		return await invoke<boolean>("create_record", { input });
	} catch (e) {
		console.error("createRecord error", e);
		return false;
	}
}

export async function getAllRecords() {
	try {
		return await invoke<R[]>("read_records");
	} catch (e) {
		console.error(e);
		return [];
	}
}
