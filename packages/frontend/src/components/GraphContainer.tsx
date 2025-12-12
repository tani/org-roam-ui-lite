import type { Ref } from "react";

interface GraphContainerProps {
	graphRef: Ref<HTMLDivElement | null>;
}

export function GraphContainer({ graphRef }: GraphContainerProps) {
	return <div ref={graphRef} className="h-100 w-100" />;
}
