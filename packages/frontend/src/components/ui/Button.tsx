import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline-secondary" | "close";
	size?: "sm" | "md" | "lg";
}

export function Button({
	variant = "primary",
	size = "md",
	className,
	children,
	type = "button",
	...props
}: ButtonProps) {
	const baseClasses = variant === "close" ? "btn-close" : "btn";
	const variantClass = variant !== "close" ? `btn-${variant}` : "";
	const sizeClass = size !== "md" ? `btn-${size}` : "";

	const classes = [baseClasses, variantClass, sizeClass, className]
		.filter(Boolean)
		.join(" ");

	return (
		<button type={type} className={classes} {...props}>
			{children}
		</button>
	);
}
