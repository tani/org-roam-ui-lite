import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

vi.mock("../src/graph/node.ts", () => ({ openNode: vi.fn() }));

import DetailsPanel from "../src/components/DetailsPanel.vue";
import { openNode } from "../src/graph/node.ts";

const mockOpenNode = vi.mocked(openNode);

afterEach(() => cleanup());

beforeEach(() => {
  mockOpenNode.mockResolvedValue({
    id: "1",
    title: "",
    raw: "",
    body: h("p", "preview"),
  });
});

const sampleNode = {
  id: "1",
  title: "Node",
  body: h("p", "html"),
  backlinks: [{ source: "2", title: "Back" }],
};

describe("DetailsPanel", () => {
  it("shows panel when open", () => {
    const { container } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: sampleNode,
          theme: "light",
        },
      },
    );
    expect(
      container.querySelector("#offcanvasDetails")?.classList.contains("show"),
    ).toBe(true);
  });

  it("emits close on button click", async () => {
    const user = userEvent.setup();
    const { container, emitted } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: sampleNode,
          theme: "light",
        },
      },
    );
    const btn = container.querySelector(
      "button[aria-label='Close']",
    ) as HTMLElement;
    await user.click(btn);
    expect(emitted().close).toHaveLength(1);
  });

  it("emits openNode on backlink click", async () => {
    const user = userEvent.setup();
    const { getAllByText, emitted } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: sampleNode,
          theme: "light",
        },
      },
    );
    await user.click(getAllByText("Back")[0]);
    expect(emitted().openNode[0]).toEqual(["2"]);
  });

  it("shows preview on hover and hides on close", async () => {
    const user = userEvent.setup();
    const body = h("p", [h("a", { href: "id:2" }, "link")]);
    const { container, rerender } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: { ...sampleNode, body },
          theme: "light",
        },
      },
    );
    const anchor = container.querySelector("a") as HTMLElement;
    await user.hover(anchor);
    await Promise.resolve();
    await Promise.resolve();
    expect(openNode).toHaveBeenCalledWith("light", "2");
    expect(document.body.querySelector(".preview-popover")).toBeTruthy();
    await rerender({
      open: false,
      selected: { ...sampleNode, body },
      theme: "light",
    });
    await Promise.resolve();
    expect(document.body.querySelector(".preview-popover")).toBeNull();
  });

  it("emits openNode when internal link clicked", async () => {
    const body = h("p", [h("a", { href: "id:2" }, "link")]);
    const { container, emitted } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: { ...sampleNode, body },
          theme: "light",
        },
      },
    );
    const anchor = container.querySelector("a") as HTMLAnchorElement;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    await Promise.resolve();
    expect(event.defaultPrevented).toBe(true);
    expect(emitted().openNode[0]).toEqual(["2"]);
  });

  it("keeps preview when moving to popover", async () => {
    const user = userEvent.setup();
    const body = h("p", [h("a", { href: "id:2" }, "link")]);
    const { container } = render(
      DetailsPanel as unknown as Record<string, unknown>,
      {
        props: {
          open: true,
          selected: { ...sampleNode, body },
          theme: "light",
        },
      },
    );
    const anchor = container.querySelector("a") as HTMLElement;
    await user.hover(anchor);
    await Promise.resolve();
    const preview = document.body.querySelector(
      ".preview-popover",
    ) as HTMLElement;
    expect(preview).toBeTruthy();
    await fireEvent.mouseOut(anchor, { relatedTarget: preview });
    await Promise.resolve();
    await fireEvent.mouseOut(anchor, { relatedTarget: null });
    expect(document.body.querySelector(".preview-popover")).toBeNull();
  });
});
