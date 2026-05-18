const icons = {
	"file-earmark-text": "bi-file-earmark-text",
	"link-45deg": "bi-link-45deg",
	"chevron-right": "bi-chevron-right",
	"gear-fill": "bi-gear-fill",
	gear: "bi-gear",
	"chevron-left": "bi-chevron-left",
};

interface IconProps {
	name: keyof typeof icons;
	className?: string;
	style?: React.CSSProperties;
}

export function Icon({ name, className = "", style }: IconProps) {
	const iconClass = icons[name];
	if (!iconClass) {
		throw new Error(`Icon "${name}" not found`);
	}

	return (
		<i
			className={`bi ${iconClass} ${className}`.trim()}
			aria-hidden="true"
			style={style}
		/>
	);
}
