import { useEffect, useRef } from "react";
import { Button } from "./ui/Button.tsx";

interface MathJaxTheaterProps {
	mathml: string;
	onClose: () => void;
}

export function MathJaxTheater({ mathml, onClose }: MathJaxTheaterProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current === e.target) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		modalRef.current?.addEventListener("click", handleClickOutside);

		return () => {
			document.removeEventListener("keydown", handleEscape);
			modalRef.current?.removeEventListener("click", handleClickOutside);
		};
	}, [onClose]);

	useEffect(() => {
		if (contentRef.current) {
			contentRef.current.innerHTML = mathml;
		}
	}, [mathml]);

	return (
		<div
			ref={modalRef}
			className="mathjax-theater-overlay"
			role="dialog"
			aria-modal="true"
			aria-label="MathJax formula viewer"
		>
			<div className="mathjax-theater-content">
				<Button
					variant="close"
					className="mathjax-theater-close"
					aria-label="Close"
					onClick={onClose}
				/>
				<div ref={contentRef} className="mathjax-theater-formula" />
			</div>
		</div>
	);
}
