import { describe, expect, it } from "vitest";
import { formatBasicAmount } from ".";

describe("formatBasicAmount", () => {
  const UNEXPECTED = "?.??€";
  it("should format amount", () => {
    expect(formatBasicAmount(100)).toEqual("100.00€");
  });

  it("should format amount with absolute", () => {
    expect(formatBasicAmount(-100, true)).toEqual("100.00€");
  });

  it("should format amount with 0", () => {
    expect(formatBasicAmount(0)).toEqual("0.00€");
  });

  it("should format undefined amount with ?.??", () => {
    expect(formatBasicAmount(undefined)).toEqual(UNEXPECTED);
  });

  it("should format null amount with ?.??", () => {
    expect(formatBasicAmount(null)).toEqual(UNEXPECTED);
  });
});
