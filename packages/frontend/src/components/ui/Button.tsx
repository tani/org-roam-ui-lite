import type { ReactNode } from "react";

interface ButtonProps {
	variant?: "primary" | "secondary" | "outline-secondary" | "close";
	size?: "sm" | "md" | "lg";
	className?: string;
	style?: React.CSSProperties;
	children?: ReactNode;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
	"aria-label"?: string;
	disabled?: boolean;
}

export function Button({
	variant = "primary",
	size = "md",
	className,
	style,
	children,
	onClick,
	type = "button",
	"aria-label": ariaLabel,
	disabled = false,
}: ButtonProps) {
	const baseClasses = variant === "close" ? "btn-close" : "btn";
	const variantClass = variant !== "close" ? `btn-${variant}` : "";
	const sizeClass = size !== "md" ? `btn-${size}` : "";

	const classes = [baseClasses, variantClass, sizeClass, className]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			type={type}
			className={classes}
			style={style}
			onClick={onClick}
			aria-label={ariaLabel}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
