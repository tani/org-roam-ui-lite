import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const mockReadFile = vi.fn();
vi.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

const mockDrizzle = vi.fn();
vi.mock("drizzle-orm/sql-js", () => ({
  drizzle: (...args: unknown[]) => mockDrizzle(...args),
}));

const initSqlJs = vi.fn();
let DatabaseCtor: Mock;
vi.mock("sql.js", () => {
  DatabaseCtor = vi.fn(function Database(
    this: { blob?: Uint8Array },
    blob: Uint8Array,
  ) {
    this.blob = blob;
  });
  return {
    default: (...args: unknown[]) =>
      initSqlJs(...args).then(() => ({ Database: DatabaseCtor })),
  };
});

beforeEach(() => {
  mockReadFile.mockResolvedValue(new Uint8Array([1, 2]));
  initSqlJs.mockResolvedValue(undefined);
  mockDrizzle.mockReturnValue("db" as unknown);
  vi.resetModules();
});

describe("createDatabase", () => {
  it("uses wasm binary when available", async () => {
    vi.doMock("sql.js/dist/sql-wasm.wasm", () => ({ default: "bin" }));
    const { createDatabase } = await import("../src/database.ts");
    const result = await createDatabase("/tmp/db");
    expect(result).toBe("db");
    expect(initSqlJs).toHaveBeenCalledWith({ wasmBinary: "bin" });
    expect(DatabaseCtor).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(mockDrizzle).toHaveBeenCalled();
  });

  it("falls back without wasm binary", async () => {
    vi.doMock("sql.js/dist/sql-wasm.wasm", () => {
      throw new Error("fail");
    });
    const { createDatabase } = await import("../src/database.ts");
    initSqlJs.mockClear();
    const result = await createDatabase("/tmp/db");
    expect(result).toBe("db");
    expect(initSqlJs).toHaveBeenCalledWith();
  });
});
