export const isTauri = () =>
	"__TAURI_INTERNALS__" in window || "__TAURI__" in window;
