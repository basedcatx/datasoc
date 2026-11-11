import { invoke } from "@tauri-apps/api/core";

export interface R {
	id?: number;
	name: string;
	content: string;
	content_html: string;
	flags: number;
	tags: string[];
	meta: string[];
	created_at?: string;
	updated_at?: string;
	record_type: number;
}

export interface RNew {
	name: string;
	content: string;
	content_html: string;
	flags: number;
	record_type: number;
	tags: string[];
	meta: string[];
}

export interface RUpdate {
	record: Omit<R, "record_type">;
	embedding?: number[];
	id: number;
}

export interface RInsert {
	record: R;
	embedding?: number[];
}

export interface RSearch {
	text: string;
	limit?: number;
}

export interface RSearchResult {
	record: R;
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

export async function insertRecord(input: RInsert) {
	try {
		const { record } = input;
		const vec = await generateContentEmbedding(record.name, record.content);
		input.embedding = [...vec];
		return await invoke<number>("create_record", { input });
	} catch (e) {
		console.error("createRecord error", e);
		return -1;
	}
}

export async function fetchRecords(): Promise<{ record: R }[]> {
	try {
		return await invoke("fetch_records");
	} catch (e) {
		console.log("ERROR: ", e);
		return [];
	}
}

export async function fetchRecordById(id: number): Promise<{ record: R }> {
	try {
		return await invoke("fetch_record_by_id", { input: id });
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export async function fetchRecordByName(name: string): Promise<{ record: R }> {
	try {
		return await invoke("fetch_record_by_name", { input: name });
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export async function updateRecord(input: RUpdate): Promise<boolean> {
	try {
		const embedding = await generateContentEmbedding(
			input.record.name,
			input.record.content,
		);
		input.embedding = embedding;
		// console.log(input);
		return await invoke<boolean>("update_record", {
			input,
		});
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
		return e;
	}
}

export async function hybridSearchRecords(input: RSearch) {
	const embedding = await generateVector(input.text);
	const limit = input.limit || 50;

	try {
		return await invoke<RSearchResult[]>("hybrid_search", {
			input: { ...input, embedding, limit },
		});
	} catch (e) {
		console.error(e);
		return [];
	}
}
