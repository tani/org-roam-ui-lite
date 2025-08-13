import type { ReactNode } from "react";

interface FormGroupProps {
	label: string;
	children: ReactNode;
	className?: string;
}

export function FormGroup({
	label,
	children,
	className = "mb-4",
}: FormGroupProps) {
	return (
		<div className={className}>
			<h5>{label}</h5>
			{children}
		</div>
	);
}
