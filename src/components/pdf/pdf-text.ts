import { pdfjs } from "react-pdf";
import "./pdf-worker";

// get_embedding truncates to the model context window (2048 tokens). Stop well
// before that instead of tokenizing a whole book for every upload.
const MAX_CHARS = 8_000;

export async function extractPdfText(bytes: Uint8Array) {
	const loadingTask = pdfjs.getDocument({ data: bytes });
	const doc = await loadingTask.promise;

	try {
		const parts: string[] = [];
		let length = 0;

		for (
			let pageNumber = 1;
			pageNumber <= doc.numPages && length < MAX_CHARS;
			pageNumber++
		) {
			const page = await doc.getPage(pageNumber);
			const content = await page.getTextContent();
			const text = content.items
				.map((item) => ("str" in item ? item.str : ""))
				.join(" ");

			parts.push(text);
			length += text.length;
			page.cleanup();
		}

		return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
	} finally {
		await loadingTask.destroy().catch(() => undefined);
	}
}
