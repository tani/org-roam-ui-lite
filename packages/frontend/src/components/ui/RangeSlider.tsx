interface RangeSliderProps {
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
	label?: string;
	unit?: string;
	formatter?: (value: number) => string;
}

export function RangeSlider({
	value,
	min,
	max,
	step,
	onChange,
	label,
	unit = "",
	formatter,
}: RangeSliderProps) {
	const formatValue = formatter || ((v) => v.toString());

	return (
		<div className="mb-4">
			{label && <h5>{label}</h5>}
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
			<div>
				Current: <span>{formatValue(value)}</span>
				{unit}
			</div>
		</div>
	);
}
