import { describe, expect, it } from "vitest";
import { extractPayeeName } from "./utils";

describe("extractPayeeName", () => {
  it("should extract everything before the first 'Betaling met' or a digit", () => {
    // Arrange
    const payeeName = "Some payee name Betaling met 123";

    // Act
    const result = extractPayeeName(payeeName);

    // Assert
    expect(result).toBe("Some payee name");
  });

  it("should extract everything before the first digit", () => {
    // Arrange
    const payeeName =
      "PARKING ALBERTINE 1112 BE1000 BRUXELLES Betaling met KBC-Debetkaart via Bancontact 18-07-2024 om 16.35 uur 6703 42XX XXXX X301 0 VAN DEN BROECK FILIP";

    // Act
    const result = extractPayeeName(payeeName);

    // Assert
    expect(result).toBe("PARKING ALBERTINE");
  });

  it("should extract correctly when it starts with a number", () => {
    // Arrange
    const payeeName = "8286 COGO ANTWERPEN Betaling met 123";
    // Act
    const result = extractPayeeName(payeeName);

    // Assert
    expect(result).toBe("COGO ANTWERPEN");
  });

  it("should return the original payeeName if there is no match", () => {
    // Arrange
    const payeeName = "Some payee name without any match";

    // Act
    const result = extractPayeeName(payeeName);

    // Assert
    expect(result).toBe(payeeName);
  });

  it("should return empty string if match is undefined", () => {
    // Arrange
    const payeeName = "Some payee name without any match";

    // Act and Assert
    expect(extractPayeeName(undefined)).toBe("");
    expect(extractPayeeName(null)).toBe("");
  });
});
