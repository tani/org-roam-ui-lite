interface SwitchProps {
	id: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}

export function Switch({ id, checked, onChange, label }: SwitchProps) {
	return (
		<div className="form-check form-switch">
			<input
				id={id}
				className="form-check-input"
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<label className="form-check-label" htmlFor={id}>
				{label}
			</label>
		</div>
	);
}
