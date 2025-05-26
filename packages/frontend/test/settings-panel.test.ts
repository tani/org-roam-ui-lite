import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render } from "@testing-library/vue";
import { afterEach, describe, expect, it } from "vitest";
import SettingsPanel from "../src/components/SettingsPanel.vue";
import type { Layout, Renderer, Theme } from "../src/graph-types.ts";

afterEach(() => cleanup());

const baseProps = {
  open: true,
  themes: [
    { value: "light" as Theme, label: "Light" },
    { value: "dark" as Theme, label: "Dark" },
  ],
  renderers: [
    { value: "cytoscape" as Renderer, label: "Cytoscape" },
    { value: "force-graph" as Renderer, label: "Force Graph" },
  ],
  layouts: ["cose"] as Layout[],
  theme: "light" as Theme,
  renderer: "cytoscape" as Renderer,
  layout: "cose" as Layout,
  nodeSize: 10,
  labelScale: 1,
  showLabels: true,
};

describe("SettingsPanel", () => {
  it("shows panel when open", () => {
    const { container } = render(
      SettingsPanel as unknown as Record<string, unknown>,
      {
        props: baseProps,
      },
    );
    expect(
      container.querySelector("#offcanvasSettings")?.classList.contains("show"),
    ).toBe(true);
  });

  it("emits close on button click", async () => {
    const user = userEvent.setup();
    const { container, emitted } = render(
      SettingsPanel as unknown as Record<string, unknown>,
      {
        props: baseProps,
      },
    );
    const btn = container.querySelector(
      "button[aria-label='Close']",
    ) as HTMLElement;
    await user.click(btn);
    expect(emitted().close).toHaveLength(1);
  });

  it("emits updates on user actions", async () => {
    const user = userEvent.setup();
    const { getAllByRole, container, emitted } = render(
      SettingsPanel as unknown as Record<string, unknown>,
      {
        props: baseProps,
      },
    );
    const selects = getAllByRole("combobox");
    await user.selectOptions(selects[0], "dark");
    await user.selectOptions(selects[1], "force-graph");
    await user.selectOptions(selects[2], "cose");
    const range = container.querySelector(
      "input[type='range']",
    ) as HTMLInputElement;
    if (range) await fireEvent.input(range, { target: { value: "15" } });
    const checkbox = container.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;
    if (checkbox) await user.click(checkbox);
    expect(emitted()["update:theme"]).toBeTruthy();
    expect(emitted()["update:renderer"]).toBeTruthy();
    expect(emitted()["update:layout"]).toBeTruthy();
    expect(emitted()["update:nodeSize"]).toBeTruthy();
    expect(emitted()["update:showLabels"]).toBeTruthy();
  });
});
