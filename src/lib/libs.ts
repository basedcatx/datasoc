import {invoke} from "@tauri-apps/api/core"

export async function generateVector(text: string) {
    try {
        const vector: number[] = await invoke("get_embedding", {input: text});
        return vector;
    } catch (e) {
        console.error("Embedding generation error", e);
        return [];
    }
}

