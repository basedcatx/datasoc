import { useLayoutEffect, useRef, useState } from "react";

export const usePresence = (presence: boolean) => {
	const ref = useRef<HTMLElement | null>(null);
	const [mounted, setMounted] = useState(presence);

	useLayoutEffect(() => {
		const node = ref.current;

		if (presence) {
			setMounted(true);
			return;
		}

		if (!node) {
			setMounted(false);
			return;
		}

		const aname = getComputedStyle(node);
		if (!aname.animationName || aname.animationName === "none") {
			return;
		}

		const onEnd = () => {
			setMounted(false);
			return;
		};

		node.addEventListener("animationend", onEnd);
		node.addEventListener("animationcancel", onEnd);

		return () => {
			node.removeEventListener("animationend", onEnd);
			node.removeEventListener("animationcancel", onEnd);
		};
	}, [presence]);

	return {
		ref,
		shouldRender: presence || mounted,
		state: presence ? ("open" as const) : ("closed" as const),
		mounted,
	};
};
