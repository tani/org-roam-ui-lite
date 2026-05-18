import { useEffect, useRef } from "react";
import { Button } from "./ui/Button.tsx";

interface MathJaxTheaterProps {
	mathml: string;
	onClose: () => void;
}

export function MathJaxTheater({ mathml, onClose }: MathJaxTheaterProps) {
	const formulaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (formulaRef.current) {
			formulaRef.current.innerHTML = mathml;
		}
	}, [mathml]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			className="mathjax-theater-overlay"
			role="dialog"
			aria-modal="true"
			aria-label="MathJax formula viewer"
			tabIndex={-1}
			onKeyDown={handleKeyDown}
		>
			<div className="mathjax-theater-content">
				<Button
					variant="close"
					className="mathjax-theater-close"
					aria-label="Close"
					autoFocus={true}
					onClick={onClose}
				/>
				<div ref={formulaRef} className="mathjax-theater-formula" />
			</div>
		</div>
	);
}
