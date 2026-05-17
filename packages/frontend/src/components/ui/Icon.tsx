import ChevronLeft from "bootstrap-icons/icons/chevron-left.svg?raw";
import ChevronRight from "bootstrap-icons/icons/chevron-right.svg?raw";
import FileEarmarkText from "bootstrap-icons/icons/file-earmark-text.svg?raw";
import Gear from "bootstrap-icons/icons/gear.svg?raw";
import GearFill from "bootstrap-icons/icons/gear-fill.svg?raw";
import Link45deg from "bootstrap-icons/icons/link-45deg.svg?raw";

const icons = {
	"file-earmark-text": FileEarmarkText,
	"link-45deg": Link45deg,
	"chevron-right": ChevronRight,
	"gear-fill": GearFill,
	gear: Gear,
	"chevron-left": ChevronLeft,
};

interface IconProps {
	name: keyof typeof icons;
	className?: string;
	style?: React.CSSProperties;
}

export function Icon({ name, className = "", style }: IconProps) {
	const svg = icons[name];
	if (!svg) {
		throw new Error(`Icon "${name}" not found`);
	}

	return (
		<svg
			className={`bi ${className}`}
			width="1em"
			height="1em"
			viewBox="0 0 16 16"
			fill="currentColor"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVGs are from trusted bootstrap-icons package
			dangerouslySetInnerHTML={{ __html: svg }}
			style={style}
		/>
	);
}
