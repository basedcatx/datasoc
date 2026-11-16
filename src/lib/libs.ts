import { invoke } from "@tauri-apps/api/core";
import { RecordTypes } from "./utils";

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
	record: RNew;
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
	const vector: number[] = await invoke("get_embedding", { input: text });
	if (vector.length < 1)
		throw new Error("Invalid vector embedding, length < 1");
	return vector;
}

async function generateContentEmbedding(
	name: string,
	content: string,
): Promise<number[]> {
	return await generateVector(`${name}\n${content}`);
}

export async function insertRecord(input: RInsert, searchText?: string) {
	const { record } = input;
	// PDF content is a base64 string, so its title is the fallback. When the
	// upload dialog managed to extract the document text, prefer that.
	const text =
		searchText && searchText.trim().length > 0
			? `${record.name}\n${searchText}`
			: record.record_type === RecordTypes.PDF
				? record.name
				: `${record.name}\n${record.content}`;
	const vec = await generateVector(text);
	input.embedding = [...vec];
	return await invoke<number>("create_record", { input });
}

export async function fetchRecords(): Promise<{ record: R }[]> {
	return await invoke("fetch_records");
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

export async function updateRecord(
	input: RUpdate,
	options?: { skipEmbedding?: boolean },
): Promise<boolean> {
	if (options?.skipEmbedding) {
		input.embedding = [];
	} else {
		const embedding = await generateContentEmbedding(
			input.record.name,
			input.record.content,
		);
		input.embedding = embedding;
	}

	return await invoke<boolean>("update_record", {
		input,
	});
}

export async function deleteRecord(id: number) {
	return await invoke<boolean>("delete_record", { input: id });
}

export async function hybridSearchRecords(input: RSearch) {
	const embedding = await generateVector(input.text);
	const limit = input.limit || 50;

	return await invoke<RSearchResult[]>("hybrid_search", {
		input: { ...input, embedding, limit },
	});
}
