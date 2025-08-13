import type { RefObject } from "react";

interface GraphContainerProps {
	graphRef: RefObject<HTMLDivElement | null>;
}

export function GraphContainer({ graphRef }: GraphContainerProps) {
	return <div ref={graphRef} className="h-100 w-100" />;
}
