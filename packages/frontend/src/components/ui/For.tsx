import type { ReactNode } from "react";

interface ForProps<T> {
	list: readonly T[];
	children: (props: { item: T; index: number }) => ReactNode;
}

export function For<T>({ list, children }: ForProps<T>) {
	return list.map((item, index) => children({ item, index }));
}
