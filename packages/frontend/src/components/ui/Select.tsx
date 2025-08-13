import { For } from "./For.tsx";

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps {
	value: string;
	options: readonly SelectOption[] | readonly string[];
	onChange: (value: string) => void;
	className?: string;
}

export function Select({
	value,
	options,
	onChange,
	className = "form-select",
}: SelectProps) {
	return (
		<select
			className={className}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		>
			<For list={options as readonly (string | SelectOption)[]}>
				{({ item: option }) => {
					const optionValue =
						typeof option === "string" ? option : option.value;
					const optionLabel =
						typeof option === "string" ? option : option.label;

					return (
						<option key={optionValue} value={optionValue}>
							{optionLabel}
						</option>
					);
				}}
			</For>
		</select>
	);
}
