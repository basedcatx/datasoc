export * from "./image-upload-node-extension";

export function compressAndConvertBase64(
	file: File,
	maxWidth = 1600,
	quality = 0.8,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = URL.createObjectURL(file);
		img.onload = () => {
			let { width, height } = img;
			if (width > maxWidth) {
				height = Math.round((height * maxWidth) / width);
				width = maxWidth;
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			ctx?.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL("image/webp", quality));
		};
		img.onerror = reject;
	});
}
