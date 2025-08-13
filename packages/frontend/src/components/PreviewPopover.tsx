import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PreviewPopoverProps {
	content: ReactNode;
	x: number;
	y: number;
	onLeave: () => void;
}

export function PreviewPopover({
	content,
	x,
	y,
	onLeave,
}: PreviewPopoverProps) {
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (ref.current) {
			const offset = 20;
			const div = ref.current;
			div.style.left = `${x - div.offsetWidth - offset}px`;
			div.style.top = `${y + offset}px`;
			div.style.visibility = "visible";
		}
	}, [x, y]);

	return createPortal(
		<div
			ref={ref}
			className="card p-2 preview-popover"
			style={{ visibility: "hidden" }}
			onMouseLeave={onLeave}
			role="tooltip"
			aria-label="Preview popover"
		>
			{content}
		</div>,
		document.body,
	);
}
