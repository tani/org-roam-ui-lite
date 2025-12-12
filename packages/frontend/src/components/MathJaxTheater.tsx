import { Button } from "./ui/Button.tsx";

interface MathJaxTheaterProps {
	mathml: string;
	onClose: () => void;
}

export function MathJaxTheater({ mathml, onClose }: MathJaxTheaterProps) {
	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

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
			onClick={handleOverlayClick}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyDown}
		>
			<div className="mathjax-theater-content">
				<Button
					variant="close"
					className="mathjax-theater-close"
					aria-label="Close"
					autoFocus
					onClick={onClose}
				/>
				<div
					className="mathjax-theater-formula"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: MathML markup is provided by MathJax rendering and needs raw HTML.
					dangerouslySetInnerHTML={{ __html: mathml }}
				/>
			</div>
		</div>
	);
}
