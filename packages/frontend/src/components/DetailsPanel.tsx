import type { ReactNode } from "react";
import { useCallback, useId, useRef, useState } from "react";
import type { components } from "../api/api.d.ts";
import type { Theme } from "../graph/graph-types.ts";
import { openNode } from "../graph/node.ts";
import { MathJaxTheater } from "./MathJaxTheater.tsx";
import { PreviewPopover } from "./PreviewPopover.tsx";
import { Button } from "./ui/Button.tsx";
import { For } from "./ui/For.tsx";
import { When } from "./ui/When.tsx";

interface DetailsPanelProps {
	open: boolean;
	selected: components["schemas"]["Node"] & { body?: ReactNode };
	theme: Theme;
	onClose: () => void;
	onOpenNode: (id: string) => void;
}

export function DetailsPanel({
	open,
	selected,
	theme,
	onClose,
	onOpenNode,
}: DetailsPanelProps) {
	const [preview, setPreview] = useState<{
		body: ReactNode;
		x: number;
		y: number;
	} | null>(null);
	const [theaterMath, setTheaterMath] = useState<string | null>(null);
	const previewAnchorRef = useRef<HTMLAnchorElement | null>(null);
	const containerRef = useRef<HTMLElement>(null);
	const previewComponentRef = useRef<HTMLDivElement>(null);

	const handleRenderedOnClick = (ev: React.MouseEvent<HTMLElement>) => {
		const target = ev.target as HTMLElement;

		// Check if clicked on MathJax formula
		const mjxContainer = target.closest("mjx-container");
		if (mjxContainer) {
			ev.preventDefault();
			ev.stopPropagation();
			setTheaterMath(mjxContainer.outerHTML);
			return;
		}

		// Check for links
		const a = target.closest("a");
		if (!a || !a.href.startsWith("id:")) return;
		ev.preventDefault();
		onOpenNode(a.href.replace("id:", ""));
	};

	const handleRenderedMouseOver = (
		ev: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
	) => {
		const anchor = (ev.target as HTMLElement).closest("a");
		if (!anchor || !anchor.href.startsWith("id:")) return;
		if (previewAnchorRef.current === anchor) return;
		showPreview(anchor, ev as React.MouseEvent<HTMLElement>);
	};

	const handleRenderedMouseOut = (
		ev: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
	) => {
		if (!previewAnchorRef.current) return;
		const related = ev.relatedTarget as Node | null;
		if (
			related &&
			(previewAnchorRef.current.contains(related) ||
				previewComponentRef.current?.contains(related))
		) {
			return;
		}
		hidePreview();
	};

	const showPreview = async (
		anchor: HTMLAnchorElement,
		ev: React.MouseEvent<HTMLElement>,
	) => {
		previewAnchorRef.current = anchor;
		const node = await openNode(theme, anchor.href.replace("id:", ""));
		if (previewAnchorRef.current === anchor) {
			setPreview({ body: node.body, x: ev.clientX, y: ev.clientY });
		}
	};

	const hidePreview = useCallback(() => {
		setPreview(null);
		previewAnchorRef.current = null;
	}, []);

	const panelId = useId();
	const labelId = useId();

	if (!open) {
		return null;
	}

	const handleClose = () => {
		hidePreview();
		setTheaterMath(null);
		onClose();
	};

	return (
		<>
			<div
				id={panelId}
				className={`offcanvas offcanvas-end responsive-wide ${
					open ? "show" : ""
				}`}
				tabIndex={-1}
				role="dialog"
				aria-labelledby={labelId}
			>
				<div className="offcanvas-header">
					<h4 id={labelId} className="offcanvas-title">
						<i className="bi bi-file-earmark-text"></i>
						<span>{selected?.title ?? "Click a node to view details"}</span>
					</h4>
					<Button variant="close" aria-label="Close" onClick={handleClose} />
				</div>
				<section
					className="offcanvas-body"
					ref={containerRef}
					onClick={handleRenderedOnClick}
					onKeyDown={(_) => {}}
					onMouseOver={handleRenderedMouseOver}
					onMouseOut={handleRenderedMouseOut}
					onFocus={handleRenderedMouseOver}
					onBlur={handleRenderedMouseOut}
					aria-label="Details content"
				>
					<div>{selected?.body}</div>
					<When
						condition={!!(selected?.backlinks && selected.backlinks.length > 0)}
					>
						<div className="mt-3">
							<h5>
								<i className="bi bi-link-45deg"></i>Backlinks
							</h5>
							<ul className="list-unstyled">
								<For list={selected?.backlinks || []}>
									{({ item: b }) => (
										<li key={b.source}>
											<button
												type="button"
												className="btn btn-sm btn-link p-0"
												onClick={() => onOpenNode(b.source)}
											>
												<i className="bi bi-chevron-right"></i>
												<span>{b.title}</span>
											</button>
										</li>
									)}
								</For>
							</ul>
						</div>
					</When>
				</section>
			</div>
			<When condition={!!preview}>
				<div ref={previewComponentRef}>
					<PreviewPopover
						content={preview?.body}
						x={preview?.x ?? 0}
						y={preview?.y ?? 0}
						onLeave={hidePreview}
					/>
				</div>
			</When>
			<When condition={!!theaterMath}>
				<MathJaxTheater
					mathml={theaterMath || ""}
					onClose={() => setTheaterMath(null)}
				/>
			</When>
		</>
	);
}
