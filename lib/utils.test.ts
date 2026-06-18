import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combina varias clases", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("ignora valores falsy y condicionales", () => {
    expect(cn("base", false && "oculta", undefined, "activa")).toBe(
      "base activa",
    );
  });

  it("resuelve conflictos de Tailwind dejando la última clase", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
