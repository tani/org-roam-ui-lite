import { Button } from "./ui/Button.tsx";
import { Icon } from "./ui/Icon.tsx";

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
				<Icon name="gear" />
			</Button>

			<Button
				variant="outline-secondary"
				className="position-fixed"
				style={{ top: "1rem", right: "1rem", zIndex: 1 }}
				onClick={onToggleDetails}
			>
				<Icon name="chevron-left" />
			</Button>
		</>
	);
}
