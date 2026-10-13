import { useLayoutEffect, useState } from "react";

export const useTheme = () => {
	const [theme, setTheme] = useState("light");

	useLayoutEffect(() => {
		const storedTheme = window.localStorage.getItem("theme");

		const prefersDark = matchMedia("prefers-colors-scheme: dark").matches;
		window.document.documentElement.classList.remove("light", "dark");
		window.document.documentElement.classList.add(theme);
		// // //
		// if (theme === "auto") {
		// 	window.document.documentElement.removeAttribute("data-theme");
		// } else {
		// 	window.document.documentElement.setAttribute("data-theme", theme);
		// }
		//
		// window.document.documentElement.style.colorScheme = theme;
	}, [theme]);

	return { theme, setTheme };
};
