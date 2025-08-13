import { generateResponsiveCSS } from "../../utils/responsive.ts";

export function GlobalStyles() {
	return <style>{generateResponsiveCSS()}</style>;
}
