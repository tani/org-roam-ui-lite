import { describe, expect, it, vi } from "vitest";

let mount: ReturnType<typeof vi.fn>;
let use: ReturnType<typeof vi.fn>;
vi.mock("vue", async (importActual) => {
  const actual = await importActual<typeof import("vue")>();
  mount = vi.fn();
  use = vi.fn();
  return { ...actual, createApp: vi.fn(() => ({ mount, use })) };
});

describe("startApp", () => {
  it("mounts Vue app", async () => {
    const mod = await import("../src/main.ts");
    mount.mockClear();
    use.mockClear();
    const app = mod.startApp();
    expect(mount).toHaveBeenCalledWith("#app");
    expect(use).toHaveBeenCalled();
    expect(app).toEqual({ mount, use });
  });
});
