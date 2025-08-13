import { Button } from "./ui/Button.tsx";

interface GraphControlsProps {
	onToggleSettings: () => void;
	onToggleDetails: () => void;
}

export function GraphControls({
	onToggleSettings,
	onToggleDetails,
}: GraphControlsProps) {
	return (
		<>
			<Button
				variant="outline-secondary"
				className="position-fixed"
				style={{ top: "1rem", left: "1rem", zIndex: 1 }}
				onClick={onToggleSettings}
			>
				<i className="bi bi-gear"></i>
			</Button>

			<Button
				variant="outline-secondary"
				className="position-fixed"
				style={{ top: "1rem", right: "1rem", zIndex: 1 }}
				onClick={onToggleDetails}
			>
				<i className="bi bi-chevron-left"></i>
			</Button>
		</>
	);
}
