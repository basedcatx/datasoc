export const isTauri = () =>
	"__TAURI_INTERNALS__" in window || "__TAURI__" in window;

export const FLAGS = {
	NONE_CLEAR_ALL: 1,
	IS_DELETED: 1 << 1,
	IS_FAVORITE: 1 << 2,
	IS_COMPLETED: 1 << 3,
};

export type FLAGS = (typeof FLAGS)[keyof typeof FLAGS];

export const createFlags = (initial = 1) => {
	let flags = initial;
	if (flags < 1) flags = FLAGS.NONE_CLEAR_ALL;

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
