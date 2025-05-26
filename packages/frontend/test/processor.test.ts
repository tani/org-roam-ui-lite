import { describe, expect, it, vi } from "vitest";
import { renderToString } from "vue/server-renderer";

const mockMermaid = vi.fn((...args: unknown[]) => {
  void args;
  return () => {};
});
vi.mock("rehype-mermaid", () => ({
  default: (...args: unknown[]) => mockMermaid(...args),
}));
const mockPrettyCode = vi.fn((...args: unknown[]) => {
  void args;
  return () => {};
});
vi.mock("rehype-pretty-code", () => ({
  default: (...args: unknown[]) => mockPrettyCode(...args),
}));
const mockMathJax = vi.fn((...args: unknown[]) => {
  void args;
  return () => {};
});
vi.mock("rehype-mathjax", () => ({
  default: (...args: unknown[]) => mockMathJax(...args),
}));
const mockLoadLanguage = vi.fn(() => Promise.resolve());
const mockGetHighlighter = vi.fn(async (...args: unknown[]) => {
  void args;
  return {
    loadLanguage: mockLoadLanguage,
    codeToHtml: () => "",
    getTheme: () => ({ settings: [] }),
  };
});
vi.mock("shiki", () => ({
  getSingletonHighlighter: (...args: unknown[]) => mockGetHighlighter(...args),
}));

import { createOrgHtmlProcessor } from "../src/processor.ts";

function createProcess(theme = "light") {
  return createOrgHtmlProcessor(theme, "abc");
}

function trim(str: string): string {
  return str.replace(/<!--\[-->|<!--\]-->/g, "").replace(/\n/g, "");
}

describe("createOrgHtmlProcessor", () => {
  it("converts headings", async () => {
    const process = createProcess();
    const vnode = await process("* Hello");
    const html = await renderToString(vnode);
    expect(trim(html)).toBe("<h1>Hello</h1>");
  });

  it("rewrites relative image paths", async () => {
    const process = createProcess();
    const vnode = await process("[[file:images/foo.png]]");
    const html = await renderToString(vnode);
    expect(trim(html)).toBe(
      '<p><img src="/api/node/abc/ZmlsZTppbWFnZXMvZm9v.png"></p>',
    );
  });

  it("keeps absolute image paths", async () => {
    const process = createProcess();
    const vnode = await process("[[http://example.com/foo.png]]");
    const html = await renderToString(vnode);
    expect(trim(html)).toBe('<p><img src="http://example.com/foo.png"></p>');
  });

  it("adds blockquote class", async () => {
    const process = createProcess();
    const org = "#+begin_quote\nfoo\n#+end_quote";
    const vnode = await process(org);
    const html = await renderToString(vnode);
    expect(trim(html)).toBe(
      '<blockquote class="blockquote"><p>foo</p></blockquote>',
    );
  });
  it("loads optional plugins only when needed", async () => {
    mockMermaid.mockClear();
    mockMathJax.mockClear();
    mockPrettyCode.mockClear();
    mockLoadLanguage.mockClear();
    await createProcess()("*");
    expect(mockMermaid).not.toHaveBeenCalled();
    expect(mockMathJax).not.toHaveBeenCalled();
    expect(mockPrettyCode).not.toHaveBeenCalled();
    expect(mockLoadLanguage).not.toHaveBeenCalled();
  });

  it("uses mermaid plugin based on theme", async () => {
    mockMermaid.mockClear();
    const mermaidOrg = "#+begin_src mermaid\nflowchart\n#+end_src";
    await createProcess()(mermaidOrg);
    expect(mockMermaid).toHaveBeenCalledWith(
      expect.objectContaining({ dark: false }),
    );
    mockMermaid.mockClear();
    await createProcess("my-dark")(mermaidOrg);
    expect(mockMermaid).toHaveBeenCalledWith(
      expect.objectContaining({ dark: true }),
    );
  });

  it("uses mathjax plugin when math present", async () => {
    mockMathJax.mockClear();
    await createProcess()("$x$");
    expect(mockMathJax).toHaveBeenCalled();
  });

  it("loads languages for code blocks", async () => {
    mockPrettyCode.mockClear();
    mockLoadLanguage.mockClear();
    const org = "#+begin_src js\nconsole.log(1)\n#+end_src";
    await createProcess()(org);
    expect(mockPrettyCode).toHaveBeenCalled();
    expect(mockLoadLanguage).toHaveBeenCalledWith("js");
  });

  it("ignores unknown languages", async () => {
    mockLoadLanguage.mockClear();
    mockLoadLanguage.mockImplementationOnce(() => {
      throw new Error("bad lang");
    });
    const org = "#+begin_src unknown\nfoo\n#+end_src";
    await expect(createProcess()(org)).resolves.not.toThrow();
    expect(mockLoadLanguage).toHaveBeenCalledWith("unknown");
  });
});
