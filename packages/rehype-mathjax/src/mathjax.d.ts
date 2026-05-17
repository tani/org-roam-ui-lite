declare module "mathjax" {
	interface MathJaxApi {
		init(options: unknown): Promise<MathJaxApi>;
		tex2svgPromise(
			value: string,
			options: { display: boolean },
		): Promise<unknown>;
		startup: {
			adaptor: {
				serializeXML(node: unknown): string;
			};
		};
	}

	const MathJax: MathJaxApi;
	export default MathJax;
}

declare module "mathjax/tex-svg.js";
