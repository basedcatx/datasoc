export const isTauri = () =>
	"__TAURI_INTERNALS__" in window || "__TAURI__" in window;

export const FLAGS = {
	IS_DELETED: 1,
	IS_FAVORITE: 1 << 1,
	IS_COMPLETED: 1 << 2,
};

export type FLAGS = (typeof FLAGS)[keyof typeof FLAGS];

export const createFlags = (initial = 0) => {
	let flags = initial;

	return {
		get value() {
			return flags;
		},
		set(target: FLAGS) {
			flags |= target;
			return this;
		},
		clear(target: FLAGS) {
			flags &= ~target;
			return this;
		},
		toggle(target: FLAGS) {
			flags ^= target;
			return this;
		},
		check(target: FLAGS) {
			return (flags & target) === target;
		},
	};
};
