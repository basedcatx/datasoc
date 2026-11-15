import { pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// The app is built with a relative base. A raw asset string would be resolved
// against the document url, which breaks on routes like /view/2, so anchor it
// to this module instead. Absolute urls pass through unchanged.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(workerSrc, import.meta.url).href;
