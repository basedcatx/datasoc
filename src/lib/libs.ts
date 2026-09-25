import { invoke } from "@tauri-apps/api/core";

export const FLAGS = {
	IS_DELETED: 1 << 1,
	IS_FAVORITE: 1 << 2,
};

export interface R {
	name: string;
	content: string;
	contentHtml: string;
	flags: number;
	tags: string[];
	meta: Record<string, string>;
	embedding?: number[];
}

export interface RUpdate extends R {
	id: number;
}

export interface RSearch {
	text: string;
	limit?: number;
}

async function generateVector(text: string) {
	try {
		const vector: number[] = await invoke("get_embedding", { input: text });
		return vector;
	} catch (e) {
		console.error("Embedding generation error", e);
		return [];
	}
}

async function generateContentEmbedding(
	name: string,
	content: string,
): Promise<number[]> {
	return await generateVector(`${name}\n${content}`);
}

export async function createRecord(input: R) {
	try {
		const { name, content } = input;
		const vec = await generateContentEmbedding(name, content);
		input.embedding = [...vec];
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

export async function updateRecord(input: RUpdate) {
	try {
		return await invoke<boolean>("update_record", { input });
	} catch (e) {
		console.error(e);
		return false;
	}
}

export async function deleteRecord(id: number) {
	try {
		return await invoke<boolean>("delete_record", { input: id });
	} catch (e) {
		console.error(e);
		return false;
	}
}

export async function hybridSearch(input: RSearch) {
	const embedding = await generateVector(input.text);
	const limit = input.limit || 50;

	try {
		return await invoke<R[]>("hybrid_search", {
			input: { ...input, embedding, limit },
		});
	} catch (e) {
		console.error(e);
		return false;
	}
}
