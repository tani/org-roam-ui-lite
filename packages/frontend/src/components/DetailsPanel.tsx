import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { components } from "../api/api.d.ts";
import type { Theme } from "../graph/graph-types.ts";
import { openNode } from "../graph/node.ts";
import { PreviewPopover } from "./PreviewPopover.tsx";

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
	const previewAnchorRef = useRef<HTMLAnchorElement | null>(null);
	const containerRef = useRef<HTMLElement>(null);
	const previewComponentRef = useRef<HTMLDivElement>(null);

	const handleRenderedKeyDown = (ev: React.KeyboardEvent<HTMLElement>) => {
		if (ev.key === "Enter" || ev.key === " ") {
			const a = (ev.target as HTMLElement).closest("a");
			if (!a || !a.href.startsWith("id:")) return;
			ev.preventDefault();
			onOpenNode(a.href.replace("id:", ""));
		}
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

	useEffect(() => {
		if (!open) {
			hidePreview();
		}
	}, [open, hidePreview]);

	useEffect(() => {
		hidePreview();
	}, [hidePreview]);

	return (
		<>
			<style>
				{`
        .offcanvas.offcanvas-end.responsive-wide {
          width: 90vw;
        }

        @media (min-width: 576px) {
          .offcanvas.offcanvas-end.responsive-wide {
            width: 85vw;
          }
        }

        @media (min-width: 768px) {
          .offcanvas.offcanvas-end.responsive-wide {
            width: 70vw;
          }
        }

        @media (min-width: 992px) {
          .offcanvas.offcanvas-end.responsive-wide {
            width: 60vw;
          }
        }

        @media (min-width: 1200px) {
          .offcanvas.offcanvas-end.responsive-wide {
            width: 50vw;
            max-width: 800px;
          }
        }
      `}
			</style>
			<div
				id="offcanvasDetails"
				className={`offcanvas offcanvas-end responsive-wide ${
					open ? "show" : ""
				}`}
				tabIndex={-1}
				role="dialog"
				aria-labelledby="offcanvasDetailsLabel"
			>
				<div className="offcanvas-header">
					<h4 id="offcanvasDetailsLabel" className="offcanvas-title">
						<i className="bi bi-file-earmark-text"></i>
						<span>{selected?.title ?? "Click a node to view details"}</span>
					</h4>
					<button
						type="button"
						className="btn-close"
						aria-label="Close"
						onClick={onClose}
					></button>
				</div>
				<section
					className="offcanvas-body"
					ref={containerRef}
					onKeyDown={handleRenderedKeyDown}
					onMouseOver={handleRenderedMouseOver}
					onMouseOut={handleRenderedMouseOut}
					onFocus={handleRenderedMouseOver}
					onBlur={handleRenderedMouseOut}
					aria-label="Details content"
				>
					<div>{selected?.body}</div>
					{selected?.backlinks && selected.backlinks.length > 0 && (
						<div className="mt-3">
							<h5>
								<i className="bi bi-link-45deg"></i>Backlinks
							</h5>
							<ul className="list-unstyled">
								{selected.backlinks.map((b) => (
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
								))}
							</ul>
						</div>
					)}
				</section>
			</div>
			{preview && (
				<div ref={previewComponentRef}>
					<PreviewPopover
						content={preview.body}
						x={preview.x}
						y={preview.y}
						onLeave={hidePreview}
					/>
				</div>
			)}
		</>
	);
}
