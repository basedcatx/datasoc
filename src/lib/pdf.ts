import { createStore } from "@tanstack/react-store";

export interface PdfCandidate {
	fileName: string;
	bytes: Uint8Array;
}

export const pdfUploadStore = createStore<{ candidate: PdfCandidate | null }>({
	candidate: null,
});

export const openPdfUpload = (candidate: PdfCandidate) =>
	pdfUploadStore.setState(() => ({ candidate }));

export const closePdfUpload = () =>
	pdfUploadStore.setState(() => ({ candidate: null }));

export const isPdfBuffer = (bytes: Uint8Array) =>
	bytes.length >= 5 &&
	bytes[0] === 0x25 &&
	bytes[1] === 0x50 &&
	bytes[2] === 0x44 &&
	bytes[3] === 0x46 &&
	bytes[4] === 0x2d;

export const toBase64 = (bytes: Uint8Array) => {
	const chunkSize = 0x8000;
	let binary = "";

	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
};

export const fromBase64 = (base64: string) => {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
};

export const pdfTitleFromFileName = (fileName: string) =>
	fileName.replace(/\.pdf$/i, "").trim() || "Untitled PDF";

export const formatBytes = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;

	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unit = 0;

	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}

	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
};
